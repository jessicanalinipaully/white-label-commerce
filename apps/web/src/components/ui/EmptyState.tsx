import Link from 'next/link';

interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  icon?: React.ReactNode;
}

export function EmptyState({ title, description, actionLabel, actionHref, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-4">
      {icon && <div className="mb-6 text-slate-600 text-6xl">{icon}</div>}
      <h2 className="text-2xl font-bold text-slate-200 mb-3">{title}</h2>
      {description && <p className="text-slate-400 max-w-md mb-6">{description}</p>}
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="inline-flex items-center px-6 py-3 rounded-xl bg-primary hover:bg-primary-hover text-white font-semibold transition-colors"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
