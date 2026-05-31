import type { Touchpoint } from "@prisma/client";
import { MessageSquareText } from "lucide-react";
import { createTouchpoint } from "@/lib/actions";
import { formatDate } from "@/lib/format";
import { touchpointDirectionLabels, touchpointTypeLabels } from "@/lib/sales-options";
import { EmptyState } from "@/components/EmptyState";

export function TouchpointList({ opportunityId, touchpoints }: { opportunityId: string; touchpoints: Touchpoint[] }) {
  const addTouchpoint = createTouchpoint.bind(null, opportunityId);

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-card">
        <div className="flex items-center gap-2">
          <MessageSquareText className="h-5 w-5 text-orange-600" />
          <h2 className="text-lg font-semibold">Communication Touchpoints</h2>
        </div>
        <div className="mt-4 space-y-3">
          {touchpoints.length ? touchpoints.map((touchpoint) => (
            <article key={touchpoint.id} className="rounded-md border border-slate-200 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-950">{touchpoint.subject || touchpointTypeLabels[touchpoint.type]}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {touchpointTypeLabels[touchpoint.type]} | {touchpointDirectionLabels[touchpoint.direction]} | {formatDate(touchpoint.touchpointDate)}
                  </p>
                </div>
              </div>
              {touchpoint.description ? <p className="mt-3 whitespace-pre-line text-sm text-slate-700">{touchpoint.description}</p> : null}
            </article>
          )) : (
            <EmptyState title="No touchpoints yet" message="Track emails, WhatsApps, calls, brochure sends, info packs and follow-ups." />
          )}
        </div>
      </section>

      <form action={addTouchpoint} className="rounded-lg border border-slate-200 bg-white p-5 shadow-card">
        <h2 className="text-lg font-semibold">Add Touchpoint</h2>
        <label className="mt-4 block text-sm font-medium text-slate-700">
          Type
          <select name="type" className={inputClass}>{Object.entries(touchpointTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
        </label>
        <label className="mt-4 block text-sm font-medium text-slate-700">
          Direction
          <select name="direction" className={inputClass}>{Object.entries(touchpointDirectionLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
        </label>
        <label className="mt-4 block text-sm font-medium text-slate-700">Date<input name="touchpointDate" type="date" className={inputClass} /></label>
        <label className="mt-4 block text-sm font-medium text-slate-700">Subject<input name="subject" placeholder="Sent brochure, WhatsApp follow-up" className={inputClass} /></label>
        <label className="mt-4 block text-sm font-medium text-slate-700">Notes<textarea name="description" rows={4} className={inputClass} /></label>
        <button className="mt-4 w-full rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700">Save Touchpoint</button>
      </form>
    </div>
  );
}

const inputClass = "mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100";
