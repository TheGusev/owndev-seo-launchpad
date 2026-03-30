import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

interface ComparisonTableProps {
  data: Record<string, any>;
}

function valueColor(you: any, average: any, leader: any): string {
  const y = parseFloat(you);
  const a = parseFloat(average);
  const l = parseFloat(leader);
  if (isNaN(y) || isNaN(a) || isNaN(l)) return "text-foreground";
  if (y >= l) return "text-emerald-500";
  if (y >= a) return "text-yellow-500";
  return "text-red-500";
}

function formatVal(v: any): string {
  if (v == null) return "—";
  if (typeof v === "boolean") return v ? "✓" : "✗";
  return String(v);
}

const ComparisonTable = ({ data }: ComparisonTableProps) => {
  if (!data) return null;

  const entries = Object.entries(data).filter(
    ([key]) => key !== "_type" && !key.startsWith("_")
  );

  if (entries.length === 0) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-foreground">
        Сравнение: Вы vs Среднее vs Лидер
      </h2>

      {/* Mobile */}
      <div className="md:hidden space-y-3">
        {entries.map(([param, vals]) => {
          const v = vals as any;
          return (
            <div key={param} className="border rounded-xl p-4 bg-card/50 backdrop-blur space-y-1">
              <p className="text-sm font-medium text-foreground">{param}</p>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Вы: </span>
                  <span className={`font-bold ${valueColor(v?.you, v?.average, v?.leader)}`}>
                    {formatVal(v?.you)}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Сред: </span>
                  <span className="font-medium">{formatVal(v?.average)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Лидер: </span>
                  <span className="font-medium">{formatVal(v?.leader)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop */}
      <div className="hidden md:block border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Параметр</TableHead>
              <TableHead className="text-center w-24">Вы</TableHead>
              <TableHead className="text-center w-24">Среднее</TableHead>
              <TableHead className="text-center w-24">Лидер</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map(([param, vals]) => {
              const v = vals as any;
              return (
                <TableRow key={param}>
                  <TableCell className="text-foreground">{param}</TableCell>
                  <TableCell className={`text-center font-bold ${valueColor(v?.you, v?.average, v?.leader)}`}>
                    {formatVal(v?.you)}
                  </TableCell>
                  <TableCell className="text-center">{formatVal(v?.average)}</TableCell>
                  <TableCell className="text-center">{formatVal(v?.leader)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ComparisonTable;
