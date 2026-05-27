import type { Activity } from "@prisma/client";
import { createActivity } from "@/lib/actions";
import { formatDate } from "@/lib/format";
import { EmptyState } from "@/components/EmptyState";

export function ActivityLog({ opportunityId, activities }: { opportunityId: string; activities: Activity[] }) {
  const addActivity = createActivity.bind(null, opportunityId);

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-card">
        <h2 className="text-lg font-semibold">Activity Log</h2>
        <div className="mt-4 space-y-3">
          {activities.length ? activities.map((activity) => (
            <div key={activity.id} className="rounded-md border border-slate-200 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">{activity.type.replace("_", " ")}</span>
                <span className="text-xs text-slate-500">{formatDate(activity.activityDate)}</span>
              </div>
              <p className="mt-2 text-sm text-slate-700">{activity.description || "No description added."}</p>
              <p className="mt-2 text-xs text-slate-500">Created {formatDate(activity.createdAt)}</p>
            </div>
          )) : (
            <EmptyState title="No activities yet" message="Add calls, meetings, demos, notes and payment updates as the opportunity moves forward." />
          )}
        </div>
      </div>

      <form action={addActivity} className="rounded-lg border border-slate-200 bg-white p-5 shadow-card">
        <h2 className="text-lg font-semibold">Add Activity</h2>
        <label className="mt-4 block text-sm font-medium text-slate-700">
          Type
          <select name="type" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
            {["CALL", "EMAIL", "MEETING", "DEMO", "PROPOSAL_SENT", "FOLLOW_UP", "NOTE", "PAYMENT_RECEIVED"].map((type) => (
              <option key={type} value={type}>{type.replace("_", " ")}</option>
            ))}
          </select>
        </label>
        <label className="mt-4 block text-sm font-medium text-slate-700">
          Activity Date
          <input name="activityDate" type="date" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </label>
        <label className="mt-4 block text-sm font-medium text-slate-700">
          Description
          <textarea name="description" rows={5} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </label>
        <button type="submit" className="mt-4 w-full rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700">
          Add Activity
        </button>
      </form>
    </div>
  );
}
