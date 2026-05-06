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
    <div className="overflow-hidden rounded-xl border border-obsidian-strong bg-obsidian-800">
      <table className="min-w-full border-collapse text-sm">
        <thead className="sticky top-0 bg-obsidian-800 text-left text-[rgba(255,255,255,0.45)]">
          <tr>
            {headers.map((header, index) => (
              <th key={header} className="border-b border-obsidian-strong px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider">
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
            <tr key={index} className="border-b border-obsidian-strong transition-colors last:border-0 hover:bg-obsidian-700">
              {row.map((cell, cellIndex) => <td key={`${index}-${cellIndex}`} className="whitespace-nowrap px-5 py-3.5 font-mono text-sm text-[rgba(255,255,255,0.7)]">{formatCell(cell, headers[cellIndex])}</td>)}
            </tr>
          ))}
          {!rows.length && (
            <tr>
              <td colSpan={headers.length} className="px-3 py-8 text-center text-obsidian-subtle">No data yet.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function formatCell(cell: string | number, header: string): string | number {
  if (typeof cell !== "number") return cell;
  return countHeaders.has(header.toLowerCase())
    ? new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Math.round(cell))
    : cell;
}

const countHeaders = new Set([
  "sets",
  "sessions",
  "exercises",
  "prs",
  "reps",
  "workouts",
  "active days",
  "photos",
  "analyses"
]);

export function StatRows({ rows }: { rows: Array<[string, string]> }) {
  return (
    <div className="divide-y divide-white/10 rounded-xl border border-obsidian-strong bg-obsidian-800">
      {rows.map(([label, value]) => (
        <div key={label} className="flex items-center justify-between gap-4 px-4 py-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-obsidian-muted">{label}</div>
          <div className="text-right font-mono text-sm text-white/70">{value}</div>
        </div>
      ))}
    </div>
  );
}
