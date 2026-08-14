// Colored pill badges used across admin tables.
const StatusBadge = ({ label }: { label: string }) => {
  const base = "inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border";

  const styles: Record<string, string> = {
    UPCOMING: "text-amber-400 bg-amber-950/40 border-amber-600/40",
    NOW_SHOWING: "text-emerald-400 bg-emerald-950/40 border-emerald-600/40",
    ARCHIVED: "text-slate-400 bg-slate-800/60 border-slate-700",
    PENDING_APPROVAL: "text-sky-400 bg-sky-950/40 border-sky-600/40",
    active: "text-emerald-400 bg-emerald-950/40 border-emerald-600/40",
    pending: "text-amber-400 bg-amber-950/40 border-amber-600/40",
    rejected: "text-rose-400 bg-rose-950/40 border-rose-600/40",
    inactive: "text-slate-400 bg-slate-800/60 border-slate-700",
    admin: "text-red-400 bg-red-950/40 border-red-600/40",
    confirmed: "text-emerald-400 bg-emerald-950/40 border-emerald-600/40",
    cancelled: "text-slate-400 bg-slate-800/60 border-slate-700",
    cinema_owner: "text-violet-400 bg-violet-950/40 border-violet-600/40",
    cinema_staff: "text-sky-400 bg-sky-950/40 border-sky-600/40",
  };

  const normalized = label.toLowerCase().replace(/\s+/g, "_");
  const style = styles[normalized] ?? styles[normalized.toUpperCase()] ?? styles.inactive;

  return (
    <span className={`${base} ${style}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
};

export default StatusBadge;
