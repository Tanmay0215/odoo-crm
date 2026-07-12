import { SelectHTMLAttributes, InputHTMLAttributes } from "react";

const fieldClasses =
  "w-full h-10 px-3 bg-neutral-950 border border-neutral-800 hover:border-neutral-700 focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/30 transition-all rounded-lg text-sm font-medium outline-none text-white placeholder:text-neutral-600 disabled:opacity-50 disabled:cursor-not-allowed";

export function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">
      {children}
    </label>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${fieldClasses} ${props.className ?? ""}`} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${fieldClasses} ${props.className ?? ""}`} />;
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-red-400 mt-1 font-medium">{message}</p>;
}
