import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Save, Lock, Filter, BarChart3 } from "lucide-react";

const ADMIN_PASSWORD = "owndev2024";

interface Rule {
  id: string;
  rule_id: string;
  module: string;
  source: string;
  severity: string;
  title: string;
  description: string;
  how_to_check: string;
  fix_template: string;
  example_fix: string;
  score_weight: number;
  visible_in_preview: boolean;
  active: boolean;
  trigger_count: number;
  last_triggered_at: string | null;
}

const MODULES = ["technical", "content", "direct", "schema", "ai"];
const SEVERITIES = ["critical", "high", "medium", "low"];
const SOURCES = ["blog_checklist", "direct_rules", "technical", "ai_rules"];

const severityColor: Record<string, string> = {
  critical: "bg-red-500/20 text-red-400 border-red-500/30",
  high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  low: "bg-muted text-muted-foreground border-border",
};

export default function AdminRules() {
  const { toast } = useToast();
  const [authed, setAuthed] = useState(() => localStorage.getItem("admin_auth") === "true");
  const [password, setPassword] = useState("");
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterModule, setFilterModule] = useState<string>("all");
  const [filterSeverity, setFilterSeverity] = useState<string>("all");
  const [filterSource, setFilterSource] = useState<string>("all");
  const [editingRule, setEditingRule] = useState<Rule | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      localStorage.setItem("admin_auth", "true");
      setAuthed(true);
    } else {
      toast({ title: "Неверный пароль", variant: "destructive" });
    }
  };

  const fetchRules = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("scan_rules").select("*").order("module").order("severity");
    if (error) {
      toast({ title: "Ошибка загрузки", description: error.message, variant: "destructive" });
    } else {
      setRules((data || []) as Rule[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (authed) fetchRules();
  }, [authed]);

  const toggleActive = async (rule: Rule) => {
    const { error } = await supabase.from("scan_rules").update({ active: !rule.active }).eq("id", rule.id);
    if (error) {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    } else {
      setRules(prev => prev.map(r => r.id === rule.id ? { ...r, active: !r.active } : r));
    }
  };

  const saveRule = async (rule: Partial<Rule> & { id?: string }) => {
    if (rule.id) {
      const { error } = await supabase.from("scan_rules").update(rule).eq("id", rule.id);
      if (error) {
        toast({ title: "Ошибка", description: error.message, variant: "destructive" });
        return;
      }
      toast({ title: "Правило обновлено" });
    } else {
      const { error } = await supabase.from("scan_rules").insert(rule as any);
      if (error) {
        toast({ title: "Ошибка", description: error.message, variant: "destructive" });
        return;
      }
      toast({ title: "Правило добавлено" });
    }
    setEditingRule(null);
    setShowAdd(false);
    fetchRules();
  };

  const filtered = rules.filter(r => {
    if (filterModule !== "all" && r.module !== filterModule) return false;
    if (filterSeverity !== "all" && r.severity !== filterSeverity) return false;
    if (filterSource !== "all" && r.source !== filterSource) return false;
    return true;
  });

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="glass rounded-2xl p-8 max-w-sm w-full space-y-4">
          <div className="flex items-center gap-2 justify-center">
            <Lock className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-bold text-foreground">Admin Rules</h1>
          </div>
          <Input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
          />
          <Button onClick={handleLogin} className="w-full">Войти</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Управление правилами проверки</h1>
          <div className="flex gap-2">
            <Badge variant="outline">{rules.length} правил</Badge>
            <Badge variant="outline" className="text-green-400">{rules.filter(r => r.active).length} активных</Badge>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={filterModule} onValueChange={setFilterModule}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Модуль" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все модули</SelectItem>
              {MODULES.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterSeverity} onValueChange={setFilterSeverity}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Severity" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все</SelectItem>
              {SEVERITIES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterSource} onValueChange={setFilterSource}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Источник" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все источники</SelectItem>
              {SOURCES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => setShowAdd(true)}>
            <Plus className="w-4 h-4 mr-1" /> Добавить
          </Button>
        </div>

        {/* Rules table */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Загрузка...</div>
        ) : (
          <div className="border border-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Вкл</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Модуль</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Severity</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Правило</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Источник</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Вес</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Preview</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                      <BarChart3 className="w-4 h-4 inline" /> Сраб.
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(rule => (
                    <tr key={rule.id} className={`border-b border-border/50 ${!rule.active ? 'opacity-50' : ''}`}>
                      <td className="px-3 py-2">
                        <Switch checked={rule.active} onCheckedChange={() => toggleActive(rule)} />
                      </td>
                      <td className="px-3 py-2">
                        <Badge variant="outline" className="text-xs">{rule.module}</Badge>
                      </td>
                      <td className="px-3 py-2">
                        <Badge className={`text-xs border ${severityColor[rule.severity] || ''}`}>{rule.severity}</Badge>
                      </td>
                      <td className="px-3 py-2 max-w-[300px]">
                        <div className="font-medium text-foreground truncate">{rule.title}</div>
                        <div className="text-xs text-muted-foreground truncate">{rule.rule_id}</div>
                      </td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">{rule.source}</td>
                      <td className="px-3 py-2 text-center">{rule.score_weight}</td>
                      <td className="px-3 py-2 text-center">{rule.visible_in_preview ? "✓" : "—"}</td>
                      <td className="px-3 py-2 text-center">
                        <span className="text-foreground">{rule.trigger_count || 0}</span>
                      </td>
                      <td className="px-3 py-2">
                        <Button variant="ghost" size="sm" onClick={() => setEditingRule(rule)}>
                          Изменить
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <RuleDialog
        rule={editingRule}
        open={!!editingRule}
        onClose={() => setEditingRule(null)}
        onSave={saveRule}
      />

      {/* Add Dialog */}
      <RuleDialog
        rule={null}
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onSave={saveRule}
      />
    </div>
  );
}

function RuleDialog({ rule, open, onClose, onSave }: {
  rule: Rule | null;
  open: boolean;
  onClose: () => void;
  onSave: (rule: Partial<Rule>) => void;
}) {
  const [form, setForm] = useState<Partial<Rule>>({});

  useEffect(() => {
    if (rule) {
      setForm({ ...rule });
    } else {
      setForm({
        rule_id: "", module: "technical", source: "blog_checklist",
        severity: "medium", title: "", description: "", how_to_check: "",
        fix_template: "", example_fix: "", score_weight: 5,
        visible_in_preview: false, active: true,
      });
    }
  }, [rule, open]);

  const update = (key: string, value: any) => setForm(prev => ({ ...prev, [key]: value }));

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{rule ? "Редактировать правило" : "Добавить правило"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-muted-foreground">Rule ID</label>
              <Input value={form.rule_id || ""} onChange={e => update("rule_id", e.target.value)} placeholder="tech_new_rule" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Модуль</label>
              <Select value={form.module || "technical"} onValueChange={v => update("module", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{MODULES.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Severity</label>
              <Select value={form.severity || "medium"} onValueChange={v => update("severity", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{SEVERITIES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Источник</label>
              <Select value={form.source || "technical"} onValueChange={v => update("source", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{SOURCES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Название</label>
            <Input value={form.title || ""} onChange={e => update("title", e.target.value)} />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Описание</label>
            <Textarea value={form.description || ""} onChange={e => update("description", e.target.value)} rows={2} />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">How to check (ключ проверки)</label>
            <Input value={form.how_to_check || ""} onChange={e => update("how_to_check", e.target.value)} placeholder="check_something" />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Шаблон исправления</label>
            <Textarea value={form.fix_template || ""} onChange={e => update("fix_template", e.target.value)} rows={2} />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Пример исправления</label>
            <Textarea value={form.example_fix || ""} onChange={e => update("example_fix", e.target.value)} rows={2} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-muted-foreground">Вес (score_weight)</label>
              <Input type="number" value={form.score_weight ?? 5} onChange={e => update("score_weight", parseInt(e.target.value) || 0)} />
            </div>
            <div className="flex items-end gap-2">
              <Switch checked={form.visible_in_preview ?? false} onCheckedChange={v => update("visible_in_preview", v)} />
              <span className="text-sm">Preview</span>
            </div>
            <div className="flex items-end gap-2">
              <Switch checked={form.active ?? true} onCheckedChange={v => update("active", v)} />
              <span className="text-sm">Активно</span>
            </div>
          </div>
          <Button onClick={() => onSave(form)} className="w-full">
            <Save className="w-4 h-4 mr-2" /> Сохранить
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
