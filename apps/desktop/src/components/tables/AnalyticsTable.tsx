import { useMemo, useState } from "react";

export function AnalyticsTable({ headers, rows }: { headers: string[]; rows: Array<Array<string | number>> }) {
  const [sort, setSort] = useState<{ index: number; direction: "asc" | "desc" } | null>(null);
  const sortedRows = useMemo(() => {
    if (!sort) return rows;
    return [...rows].sort((a, b) => {
      const left = a[sort.index];
      const right = b[sort.index];
      const result = typeof left === "number" && typeof right === "number"
        ? left - right
        : String(left).localeCompare(String(right), undefined, { numeric: true });
      return sort.direction === "asc" ? result : -result;
    });
  }, [rows, sort]);

  function toggleSort(index: number) {
    setSort((current) => current?.index === index
      ? { index, direction: current.direction === "asc" ? "desc" : "asc" }
      : { index, direction: "asc" });
  }

  return (
    <div className="overflow-auto rounded-xl border border-line">
      <table className="min-w-full border-collapse text-sm">
        <thead className="sticky top-0 bg-ink text-white/52">
          <tr>
            {headers.map((header, index) => (
              <th key={header} className="border-b border-line px-3 py-2 text-left font-medium">
                <button type="button" onClick={() => toggleSort(index)} className="inline-flex items-center gap-1 text-left hover:text-white">
                  {header}
                  {sort?.index === index && <span className="text-xs">{sort.direction === "asc" ? "up" : "down"}</span>}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedRows.map((row, index) => (
            <tr key={index} className="odd:bg-white/[0.025] hover:bg-white/[0.055]">
              {row.map((cell, cellIndex) => <td key={`${index}-${cellIndex}`} className="whitespace-nowrap border-b border-white/6 px-3 py-2 text-white/72">{cell}</td>)}
            </tr>
          ))}
          {!rows.length && (
            <tr>
              <td colSpan={headers.length} className="px-3 py-8 text-center text-white/42">No data yet.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export function StatRows({ rows }: { rows: Array<[string, string]> }) {
  return (
    <div className="divide-y divide-white/8 rounded-xl border border-line">
      {rows.map(([label, value]) => (
        <div key={label} className="flex items-center justify-between gap-4 px-4 py-3">
          <div className="text-sm text-white/48">{label}</div>
          <div className="text-right text-sm font-medium text-white">{value}</div>
        </div>
      ))}
    </div>
  );
}
