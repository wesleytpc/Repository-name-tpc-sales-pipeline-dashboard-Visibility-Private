import type { LucideIcon } from "lucide-react";

export function DashboardCard({
  title,
  value,
  icon: Icon,
  note,
}: {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  note?: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{value}</p>
        </div>
        {Icon ? (
          <div className="rounded-md bg-orange-50 p-2 text-orange-600">
            <Icon className="h-5 w-5" />
          </div>
        ) : null}
      </div>
      {note ? <p className="mt-3 text-xs text-slate-500">{note}</p> : null}
    </div>
  );
}
