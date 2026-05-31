import type { Opportunity } from "@prisma/client";
import { formatCurrency } from "@/lib/format";

const funnelSteps = [
  { label: "Leads", stages: ["LEAD_IDENTIFIED", "CONTACT_MADE"] },
  { label: "Decision-Maker / Need", stages: ["DECISION_MAKER_REACHED", "NEED_CONFIRMED"] },
  { label: "Meetings / Demos", stages: ["MEETING_HELD", "DEMO_COMPLETED"] },
  { label: "Proposals", stages: ["PROPOSAL_SENT", "NEGOTIATION_FOLLOW_UP"] },
  { label: "Approvals / PO", stages: ["VERBAL_APPROVAL", "PO_CONTRACT_INVOICE_REQUESTED"] },
  { label: "Money Received", stages: ["PAYMENT_RECEIVED"] },
];

export function ConversionFunnel({ opportunities }: { opportunities: Opportunity[] }) {
  const maxCount = Math.max(1, ...funnelSteps.map((step) => opportunities.filter((item) => step.stages.includes(item.stage)).length));

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-card">
      <h2 className="text-lg font-semibold">Pipeline Conversion Funnel</h2>
      <p className="mt-1 text-sm text-slate-600">Where opportunities are sitting from first lead to money in the bank.</p>
      <div className="mt-5 space-y-3">
        {funnelSteps.map((step) => {
          const items = opportunities.filter((item) => step.stages.includes(item.stage));
          const value = items.reduce((sum, item) => sum + item.estimatedValue, 0);
          const width = `${Math.max(12, (items.length / maxCount) * 100)}%`;

          return (
            <div key={step.label}>
              <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                <span className="font-medium text-slate-700">{step.label}</span>
                <span className="text-slate-500">{items.length} | {formatCurrency(value)}</span>
              </div>
              <div className="h-9 rounded-md bg-slate-100">
                <div className="flex h-full items-center rounded-md bg-orange-500 px-3 text-xs font-semibold text-white" style={{ width }}>
                  {items.length} deals
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
