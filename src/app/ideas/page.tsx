import { Lightbulb } from "lucide-react";
import type { IdeaStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createIdea, updateIdeaStatus } from "@/lib/actions";
import { formatDate } from "@/lib/format";
import { ideaCategoryLabels, ideaPriorityLabels, ideaStatusLabels } from "@/lib/sales-options";

export const dynamic = "force-dynamic";

export default async function IdeasPage() {
  const [ideas, opportunities] = await Promise.all([
    prisma.idea.findMany({ orderBy: { updatedAt: "desc" } }),
    prisma.opportunity.findMany({ orderBy: { companyName: "asc" }, select: { id: true, companyName: true } }),
  ]);

  const statuses = Object.keys(ideaStatusLabels) as IdeaStatus[];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Ideas Board</h2>
        <p className="mt-1 text-sm text-slate-600">A whiteboard space for sales campaigns, follow-up angles, product thinking and training ideas.</p>
      </div>

      <form action={createIdea} className="rounded-lg border border-slate-200 bg-white p-5 shadow-card">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-orange-600" />
          <h3 className="text-lg font-semibold">Capture Idea</h3>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <input name="title" required placeholder="Idea title" className={inputClass} />
          <select name="category" className={inputClass}>{Object.entries(ideaCategoryLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
          <select name="priority" className={inputClass}>{Object.entries(ideaPriorityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
          <select name="opportunityId" className={inputClass}>
            <option value="">No linked client</option>
            {opportunities.map((opportunity) => <option key={opportunity.id} value={opportunity.id}>{opportunity.companyName}</option>)}
          </select>
        </div>
        <textarea name="notes" rows={4} placeholder="What is the idea, why it matters, and what could be done next?" className={`${inputClass} mt-3`} />
        <button className="mt-3 rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700">Add Idea</button>
      </form>

      <section className="grid gap-4 xl:grid-cols-5">
        {statuses.map((status) => (
          <div key={status} className="rounded-lg border border-slate-200 bg-white p-4 shadow-card">
            <h3 className="text-sm font-semibold text-slate-950">{ideaStatusLabels[status]}</h3>
            <div className="mt-3 space-y-3">
              {ideas.filter((idea) => idea.status === status).map((idea) => (
                <article key={idea.id} className="rounded-md border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-950">{idea.title}</p>
                    <span className="rounded-full bg-orange-50 px-2 py-1 text-xs font-medium text-orange-700">{ideaPriorityLabels[idea.priority]}</span>
                  </div>
                  <p className="mt-2 text-xs font-medium text-slate-500">{ideaCategoryLabels[idea.category]} | {formatDate(idea.createdAt)}</p>
                  {idea.notes ? <p className="mt-2 whitespace-pre-line text-sm text-slate-700">{idea.notes}</p> : null}
                  <form action={async (formData) => {
                    "use server";
                    await updateIdeaStatus(idea.id, formData.get("status") as IdeaStatus);
                  }} className="mt-3">
                    <select name="status" defaultValue={idea.status} className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs">
                      {statuses.map((item) => <option key={item} value={item}>{ideaStatusLabels[item]}</option>)}
                    </select>
                    <button className="mt-2 w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs font-medium text-slate-700 hover:bg-white">Move</button>
                  </form>
                </article>
              ))}
              {!ideas.some((idea) => idea.status === status) ? <p className="text-sm text-slate-500">No ideas here.</p> : null}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

const inputClass = "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100";
