interface BarDatum {
  label: string;
  value: number;
  color?: string;
  currency?: string;
}

export interface BarDatumValue extends BarDatum {
  color: string;
}

// Horizontal bar list, used for distributions and top-N breakdowns.
export function HBarList({
  data,
  formatValue,
}: {
  data: BarDatum[];
  formatValue?: (v: number, d: BarDatum) => string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="flex flex-col gap-2.5">
      {data.map((d) => (
        <div key={d.label} className="flex items-center gap-2.5">
          <span className="w-20 text-right text-[10px] text-slate-500 truncate shrink-0">
            {d.label}
          </span>
          <div className="flex-1 h-5 bg-slate-950 border border-slate-800 rounded-md overflow-hidden">
            <div
              className="h-full rounded-r-md transition-all"
              style={{
                width: `${Math.round((d.value / max) * 100)}%`,
                backgroundColor: d.color ?? "#dc2626",
              }}
            />
          </div>
          <span className="w-14 text-left text-[10px] text-slate-200 font-bold shrink-0">
            {formatValue ? formatValue(d.value, d) : d.value}
          </span>
        </div>
      ))}
    </div>
  );
}

// Vertical bar chart for time-series (e.g. bookings per day).
export function VerticalBarChart({
  data,
  formatValue,
  barHeight = 120,
}: {
  data: BarDatum[];
  formatValue?: (v: number) => string;
  barHeight?: number;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="flex items-end gap-2" style={{ height: barHeight + 34 }}>
      {data.map((d) => (
        <div
          key={d.label}
          className="flex-1 flex flex-col items-center justify-end gap-1.5 h-full min-w-0"
        >
          <span className="text-[10px] text-slate-400 font-bold leading-none">
            {formatValue ? formatValue(d.value) : d.value}
          </span>
          <div
            className="w-full max-w-[42px] rounded-t-md transition-all"
            style={{
              height: Math.max(2, Math.round((d.value / max) * barHeight)),
              backgroundColor: d.color ?? "#dc2626",
            }}
          />
          <span className="text-[10px] text-slate-500 truncate w-full text-center leading-none">
            {d.label}
          </span>
        </div>
      ))}
    </div>
  );
}
