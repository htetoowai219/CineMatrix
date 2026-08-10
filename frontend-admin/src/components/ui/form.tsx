import { type ReactNode, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";

const inputClasses =
  "w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-red-600/60 transition-all disabled:opacity-50";

export const Field = ({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
}) => (
  <div>
    <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1.5">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
    {hint && <p className="text-slate-600 text-[11px] mt-1">{hint}</p>}
  </div>
);

export const TextInput = (props: InputHTMLAttributes<HTMLInputElement>) => (
  <input {...props} className={`${inputClasses} ${props.className ?? ""}`} />
);

export const TextArea = (props: TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea {...props} className={`${inputClasses} resize-y ${props.className ?? ""}`} />
);

export const Select = (props: SelectHTMLAttributes<HTMLSelectElement>) => (
  <select {...props} className={`${inputClasses} appearance-none ${props.className ?? ""}`} />
);
