export function AnalyticsTable({ headers, rows }: { headers: string[]; rows: Array<Array<string | number>> }) {
  return (
    <div className="overflow-auto rounded-xl border border-line">
      <table className="min-w-full border-collapse text-sm">
        <thead className="sticky top-0 bg-ink text-white/52">
          <tr>
            {headers.map((header) => <th key={header} className="border-b border-line px-3 py-2 text-left font-medium">{header}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
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
