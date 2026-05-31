import type { PipelineStage } from "@prisma/client";
import { CheckCircle2, Circle, CircleDollarSign } from "lucide-react";
import { getStageLabel, pipelineStages, stageProbabilities } from "@/lib/pipeline";

const journeyStages = pipelineStages.filter((stage) => stage !== "LOST_NO_FIT");

export function PipelineJourney({ stage }: { stage: PipelineStage }) {
  const currentProbability = stageProbabilities[stage] ?? 0;

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Pipeline Journey</h2>
          <p className="mt-1 text-sm text-slate-600">A visual view of the client moving from activity to money in the bank.</p>
        </div>
        <span className="rounded-full bg-orange-50 px-3 py-1 text-sm font-semibold text-orange-700">{getStageLabel(stage)}</span>
      </div>
      <div className="mt-5 overflow-x-auto pb-2">
        <div className="flex min-w-[980px] items-start">
          {journeyStages.map((item, index) => {
            const probability = stageProbabilities[item];
            const complete = probability < currentProbability || stage === "PAYMENT_RECEIVED";
            const current = item === stage;
            const payment = item === "PAYMENT_RECEIVED";
            const Icon = payment ? CircleDollarSign : complete || current ? CheckCircle2 : Circle;

            return (
              <div key={item} className="flex flex-1 items-start">
                <div className="flex min-w-24 flex-col items-center text-center">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full border ${
                    payment && complete
                      ? "border-green-500 bg-green-50 text-green-700"
                      : current
                        ? "border-orange-500 bg-orange-50 text-orange-700"
                        : complete
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-300 bg-white text-slate-400"
                  }`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className={`mt-2 text-xs font-medium ${current ? "text-orange-700" : complete ? "text-slate-900" : "text-slate-500"}`}>{getStageLabel(item)}</p>
                </div>
                {index < journeyStages.length - 1 ? (
                  <div className={`mt-5 h-0.5 flex-1 ${complete ? "bg-slate-900" : "bg-slate-200"}`} />
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
