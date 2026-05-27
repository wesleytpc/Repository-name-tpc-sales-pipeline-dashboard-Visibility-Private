import Link from "next/link";
import { Inbox } from "lucide-react";

export function EmptyState({
  title = "No records found",
  message,
  actionHref,
  actionLabel,
}: {
  title?: string;
  message: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
      <Inbox className="mx-auto h-10 w-10 text-slate-400" />
      <h2 className="mt-3 text-base font-semibold text-slate-950">{title}</h2>
      <p className="mx-auto mt-1 max-w-md text-sm text-slate-600">{message}</p>
      {actionHref && actionLabel ? (
        <Link href={actionHref} className="mt-4 inline-flex rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700">
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
