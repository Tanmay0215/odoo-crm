import { SelectHTMLAttributes, InputHTMLAttributes } from "react";

const fieldClasses =
  "w-full h-10 px-3.5 bg-white/45 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700/70 focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all rounded-xl text-sm font-semibold outline-none text-foreground placeholder:text-slate-400 dark:placeholder:text-slate-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm";

export function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-1.5">
      {children}
    </label>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input {...props} className={`${fieldClasses} ${props.className ?? ""}`} />
  );
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className={`${fieldClasses} ${props.className ?? ""}`} />
  );
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="text-xs text-rose-500 dark:text-rose-400 mt-1.5 font-bold">
      {message}
    </p>
  );
}
