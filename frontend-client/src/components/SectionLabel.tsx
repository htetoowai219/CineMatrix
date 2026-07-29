const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center gap-2 mb-1.5">
    <span className="w-6 h-0.5 bg-red-500" />
    <span className="text-red-500 text-xs font-bold uppercase tracking-widest block">
      {children}
    </span>
  </div>
);

export default SectionLabel;
