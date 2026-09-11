type Variant = 'success' | 'warning' | 'error' | 'info' | 'default';

const styles: Record<Variant, string> = {
  success: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  warning: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  error: 'bg-red-500/15 text-red-400 border-red-500/20',
  info: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  default: 'bg-slate-500/15 text-slate-400 border-slate-500/20',
};

export function Badge({ children, variant = 'default' }: { children: React.ReactNode; variant?: Variant }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${styles[variant]}`}>
      {children}
    </span>
  );
}
