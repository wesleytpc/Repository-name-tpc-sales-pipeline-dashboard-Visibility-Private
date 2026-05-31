import Link from "next/link";
import type { Opportunity } from "@prisma/client";
import { calculateWeightedValue, getStageLabel, pipelineStages } from "@/lib/pipeline";
import { formatCurrency, formatDate } from "@/lib/format";

const boardStages = pipelineStages.filter((stage) => stage !== "LOST_NO_FIT");

export function PipelineBoard({ opportunities }: { opportunities: Opportunity[] }) {
  const active = opportunities.filter((item) => item.status === "ACTIVE" || item.status === "WON");

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Pipeline Board</h2>
          <p className="mt-1 text-sm text-slate-600">See where each client sits from first activity to money in the bank.</p>
        </div>
      </div>
      <div className="mt-5 overflow-x-auto pb-2">
        <div className="grid min-w-[1280px] grid-cols-6 gap-3 xl:grid-cols-11">
          {boardStages.map((stage) => {
            const stageItems = active.filter((item) => item.stage === stage);
            const total = stageItems.reduce((sum, item) => sum + item.estimatedValue, 0);
            const weighted = stageItems.reduce((sum, item) => sum + calculateWeightedValue(item.estimatedValue, item.probability), 0);

            return (
              <div key={stage} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="min-h-20">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-600">{getStageLabel(stage)}</h3>
                  <p className="mt-1 text-sm font-semibold text-slate-950">{stageItems.length} deals</p>
                  <p className="text-xs text-slate-500">{formatCurrency(total)}</p>
                  <p className="text-xs text-slate-500">Weighted {formatCurrency(weighted)}</p>
                </div>
                <div className="mt-3 space-y-2">
                  {stageItems.slice(0, 6).map((item) => (
                    <Link key={item.id} href={`/opportunities/${item.id}`} className="block rounded-md border border-slate-200 bg-white p-3 hover:border-orange-200 hover:bg-orange-50">
                      <p className="text-sm font-semibold text-slate-950">{item.companyName}</p>
                      <p className="mt-1 text-xs text-slate-600">{item.product || "No product"}</p>
                      <p className="mt-2 text-xs font-medium text-slate-900">{formatCurrency(item.estimatedValue)}</p>
                      <p className="mt-1 text-xs text-slate-500">Next: {item.nextStep || "-"} | {formatDate(item.nextStepDate)}</p>
                    </Link>
                  ))}
                  {stageItems.length > 6 ? <p className="text-xs text-slate-500">+ {stageItems.length - 6} more</p> : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
