import { useState } from "react";
import ToolCTA from "@/components/tools/ToolCTA";
import { Input } from "@/components/ui/input";
import { GradientButton } from "@/components/ui/gradient-button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Code2, Copy, CheckCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

type SchemaType = "Organization" | "LocalBusiness" | "Article" | "Product" | "FAQPage" | "Service" | "BreadcrumbList";

const schemaTypes: SchemaType[] = ["Organization", "LocalBusiness", "Article", "Product", "FAQPage", "Service", "BreadcrumbList"];

interface FieldConfig {
  key: string;
  label: string;
  placeholder: string;
  required?: boolean;
}

const fieldsByType: Record<SchemaType, FieldConfig[]> = {
  Organization: [
    { key: "name", label: "Название", placeholder: "ООО «Рога и Копыта»", required: true },
    { key: "url", label: "Сайт", placeholder: "https://example.com" },
    { key: "telephone", label: "Телефон", placeholder: "+7 (495) 123-45-67" },
    { key: "email", label: "Email", placeholder: "info@example.com" },
  ],
  LocalBusiness: [
    { key: "name", label: "Название", placeholder: "Кафе «Уют»", required: true },
    { key: "address", label: "Адрес", placeholder: "Москва, ул. Примерная, 1", required: true },
    { key: "telephone", label: "Телефон", placeholder: "+7 (495) 123-45-67" },
    { key: "url", label: "Сайт", placeholder: "https://example.com" },
    { key: "openingHours", label: "Часы работы", placeholder: "Пн-Пт 09:00-18:00" },
    { key: "priceRange", label: "Ценовой диапазон", placeholder: "₽₽" },
  ],
  Article: [
    { key: "headline", label: "Заголовок", placeholder: "Как настроить SEO", required: true },
    { key: "author", label: "Автор", placeholder: "Иван Иванов", required: true },
    { key: "datePublished", label: "Дата публикации", placeholder: "2025-01-15" },
    { key: "image", label: "URL изображения", placeholder: "https://example.com/image.jpg" },
    { key: "description", label: "Описание", placeholder: "Подробное руководство по SEO" },
  ],
  Product: [
    { key: "name", label: "Название товара", placeholder: "Смартфон XYZ", required: true },
    { key: "description", label: "Описание", placeholder: "Флагманский смартфон 2025 года" },
    { key: "image", label: "URL изображения", placeholder: "https://example.com/product.jpg" },
    { key: "price", label: "Цена", placeholder: "49990" },
    { key: "currency", label: "Валюта", placeholder: "RUB" },
    { key: "brand", label: "Бренд", placeholder: "XYZ Electronics" },
  ],
  FAQPage: [
    { key: "q1", label: "Вопрос 1", placeholder: "Как оформить заказ?", required: true },
    { key: "a1", label: "Ответ 1", placeholder: "Нажмите кнопку «Купить»…", required: true },
    { key: "q2", label: "Вопрос 2", placeholder: "Какие способы оплаты?" },
    { key: "a2", label: "Ответ 2", placeholder: "Мы принимаем карты и наличные" },
    { key: "q3", label: "Вопрос 3", placeholder: "Есть ли доставка?" },
    { key: "a3", label: "Ответ 3", placeholder: "Да, по всей России" },
  ],
  Service: [
    { key: "name", label: "Название услуги", placeholder: "SEO-оптимизация", required: true },
    { key: "description", label: "Описание", placeholder: "Комплексная SEO-оптимизация сайта" },
    { key: "provider", label: "Компания", placeholder: "OWNDEV" },
    { key: "areaServed", label: "Регион", placeholder: "Россия" },
    { key: "price", label: "Цена", placeholder: "от 60000" },
  ],
  BreadcrumbList: [
    { key: "item1name", label: "Элемент 1 (название)", placeholder: "Главная", required: true },
    { key: "item1url", label: "Элемент 1 (URL)", placeholder: "https://example.com/", required: true },
    { key: "item2name", label: "Элемент 2 (название)", placeholder: "Каталог" },
    { key: "item2url", label: "Элемент 2 (URL)", placeholder: "https://example.com/catalog" },
    { key: "item3name", label: "Элемент 3 (название)", placeholder: "Товар" },
    { key: "item3url", label: "Элемент 3 (URL)", placeholder: "https://example.com/catalog/product" },
  ],
};

function buildSchema(type: SchemaType, values: Record<string, string>): object {
  const base = { "@context": "https://schema.org", "@type": type };

  switch (type) {
    case "Organization":
      return { ...base, name: values.name, url: values.url, telephone: values.telephone, email: values.email };
    case "LocalBusiness":
      return {
        ...base,
        name: values.name,
        address: { "@type": "PostalAddress", streetAddress: values.address },
        telephone: values.telephone,
        url: values.url,
        openingHours: values.openingHours,
        priceRange: values.priceRange,
      };
    case "Article":
      return {
        ...base,
        headline: values.headline,
        author: { "@type": "Person", name: values.author },
        datePublished: values.datePublished,
        image: values.image,
        description: values.description,
      };
    case "Product":
      return {
        ...base,
        name: values.name,
        description: values.description,
        image: values.image,
        brand: values.brand ? { "@type": "Brand", name: values.brand } : undefined,
        offers: values.price
          ? { "@type": "Offer", price: values.price, priceCurrency: values.currency || "RUB", availability: "https://schema.org/InStock" }
          : undefined,
      };
    case "FAQPage": {
      const items = [];
      for (let i = 1; i <= 3; i++) {
        if (values[`q${i}`] && values[`a${i}`]) {
          items.push({
            "@type": "Question",
            name: values[`q${i}`],
            acceptedAnswer: { "@type": "Answer", text: values[`a${i}`] },
          });
        }
      }
      return { ...base, mainEntity: items };
    }
    case "Service":
      return {
        ...base,
        name: values.name,
        description: values.description,
        provider: values.provider ? { "@type": "Organization", name: values.provider } : undefined,
        areaServed: values.areaServed,
        offers: values.price ? { "@type": "Offer", price: values.price, priceCurrency: "RUB" } : undefined,
      };
    case "BreadcrumbList": {
      const items = [];
      for (let i = 1; i <= 3; i++) {
        if (values[`item${i}name`] && values[`item${i}url`]) {
          items.push({
            "@type": "ListItem",
            position: i,
            name: values[`item${i}name`],
            item: values[`item${i}url`],
          });
        }
      }
      return { ...base, itemListElement: items };
    }
    default:
      return base;
  }
}

// Remove undefined/empty values recursively
function cleanObj(obj: any): any {
  if (Array.isArray(obj)) return obj.map(cleanObj);
  if (obj && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj)
        .filter(([, v]) => v !== undefined && v !== "" && v !== null)
        .map(([k, v]) => [k, cleanObj(v)])
    );
  }
  return obj;
}

const SchemaGenerator = () => {
  const [type, setType] = useState<SchemaType | "">("");
  const [values, setValues] = useState<Record<string, string>>({});
  const [generated, setGenerated] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const fields = type ? fieldsByType[type] : [];

  const handleTypeChange = (t: string) => {
    setType(t as SchemaType);
    setValues({});
    setGenerated("");
    setErrors([]);
  };

  const handleGenerate = () => {
    if (!type) return;
    const required = fields.filter((f) => f.required);
    const missing = required.filter((f) => !values[f.key]?.trim());
    if (missing.length > 0) {
      setErrors(missing.map((f) => f.key));
      toast({ title: "Заполните обязательные поля", variant: "destructive" });
      return;
    }
    setErrors([]);
    const schema = cleanObj(buildSchema(type, values));
    setGenerated(JSON.stringify(schema, null, 2));
  };

  const handleCopy = async () => {
    if (!generated) return;
    const script = `<script type="application/ld+json">\n${generated}\n</script>`;
    await navigator.clipboard.writeText(script);
    setCopied(true);
    toast({ title: "Скопировано!" });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass rounded-2xl p-5 md:p-8">
      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Тип разметки</label>
          <Select onValueChange={handleTypeChange} value={type}>
            <SelectTrigger className="bg-card border-border">
              <SelectValue placeholder="Выберите тип…" />
            </SelectTrigger>
            <SelectContent>
              {schemaTypes.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {type && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fields.map((f) => (
              <div key={f.key} className="space-y-1">
                <label className="text-sm font-medium text-foreground">
                  {f.label} {f.required && <span className="text-destructive">*</span>}
                </label>
                <Input
                  placeholder={f.placeholder}
                  className={`bg-card border-border ${errors.includes(f.key) ? "border-destructive" : ""}`}
                  value={values[f.key] || ""}
                  onChange={(e) => setValues((prev) => ({ ...prev, [f.key]: e.target.value }))}
                />
              </div>
            ))}
          </div>
        )}

        {type && (
          <div className="text-center">
            <GradientButton size="lg" onClick={handleGenerate}>
              <Code2 className="w-5 h-5 mr-2" />
              Сгенерировать JSON-LD
            </GradientButton>
          </div>
        )}

        {generated && (
          <div className="glass rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-foreground">Результат</p>
              <button
                onClick={handleCopy}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                {copied ? <CheckCircle className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
                {copied ? "Скопировано" : "Копировать"}
              </button>
            </div>
            <pre className="text-xs text-muted-foreground overflow-x-auto whitespace-pre-wrap">
              {`<script type="application/ld+json">\n${generated}\n</script>`}
            </pre>

            <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-xs text-muted-foreground">
                <strong className="text-foreground">Как использовать:</strong> Вставьте этот код в{" "}
                <code className="text-primary">&lt;head&gt;</code> вашего HTML-документа. Разметка поможет
                поисковым системам лучше понять содержимое страницы и показать расширенные сниппеты.
              </p>
            </div>
          </div>
        )}
      </div>
      <ToolCTA />
    </div>
  );
};

export default SchemaGenerator;
