import { prisma } from "@/lib/prisma";
import { calculateWeightedValue, getCurrentMonthStart, isOverdue } from "@/lib/pipeline";
import { formatCurrency } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const opportunities = await prisma.opportunity.findMany();
  const active = opportunities.filter((item) => item.status === "ACTIVE");
  const activePipeline = active.reduce((sum, item) => sum + item.estimatedValue, 0);
  const weightedPipeline = active.reduce((sum, item) => sum + calculateWeightedValue(item.estimatedValue, item.probability), 0);
  const proposalOpportunities = opportunities.filter((item) => item.stage === "PROPOSAL_SENT");
  const quotesSentValue = proposalOpportunities.reduce((sum, item) => sum + item.estimatedValue, 0);
  const won = opportunities.filter((item) => item.status === "WON");
  const revenueClosed = won.reduce((sum, item) => sum + item.estimatedValue, 0);
  const paymentReceived = opportunities.filter((item) => item.stage === "PAYMENT_RECEIVED");
  const moneyReceived = paymentReceived.reduce((sum, item) => sum + item.estimatedValue, 0);
  const overdueFollowUps = active.filter((item) => isOverdue(item.nextStepDate));
  const noNextStep = active.filter((item) => !item.nextStep && !item.nextStepDate);
  const staleDate = new Date();
  staleDate.setDate(staleDate.getDate() - 30);
  const stale = active.filter((item) => item.updatedAt < staleDate);

  const progressStages = [
    ["Decision-maker reached", "DECISION_MAKER_REACHED"],
    ["Need confirmed", "NEED_CONFIRMED"],
    ["Meeting held", "MEETING_HELD"],
    ["Demo completed", "DEMO_COMPLETED"],
    ["Proposal sent", "PROPOSAL_SENT"],
  ] as const;

  const thisMonth = getCurrentMonthStart();
  const thisMonthCount = opportunities.filter((item) => item.updatedAt >= thisMonth).length;
  const summary = `This month, I am managing ${active.length} active opportunities with a total pipeline value of ${formatCurrency(activePipeline)} and a weighted pipeline value of ${formatCurrency(weightedPipeline)}. ${proposalOpportunities.length} opportunities are currently at proposal stage, with ${formatCurrency(quotesSentValue)} in quoted value. ${overdueFollowUps.length} opportunities require overdue follow-up. The main focus for the next week is to move proposal-stage opportunities toward approval and convert short-term training opportunities into paid bookings.`;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Reports</h2>
        <p className="mt-1 text-sm text-slate-600">Management-ready view of pipeline value, progress wins, final wins and follow-up risk.</p>
      </div>

      <Section title="Executive Sales Summary">
        <Metric label="Active pipeline value" value={formatCurrency(activePipeline)} />
        <Metric label="Weighted pipeline value" value={formatCurrency(weightedPipeline)} />
        <Metric label="Quotes sent value" value={formatCurrency(quotesSentValue)} />
        <Metric label="Revenue closed" value={formatCurrency(revenueClosed)} />
        <Metric label="Money received" value={formatCurrency(moneyReceived)} highlight />
      </Section>

      <Section title="Progress Wins">
        {progressStages.map(([label, stage]) => (
          <Metric key={stage} label={label} value={opportunities.filter((item) => item.stage === stage).length} />
        ))}
      </Section>

      <Section title="Final Wins">
        <Metric label="Number of opportunities won" value={won.length} />
        <Metric label="Money received" value={formatCurrency(moneyReceived)} highlight />
        <Metric label="Payment received opportunities" value={paymentReceived.length} />
      </Section>

      <Section title="Follow-Up Risks">
        <Metric label="Overdue follow-ups" value={overdueFollowUps.length} danger />
        <Metric label="Opportunities with no next step" value={noNextStep.length} />
        <Metric label="Opportunities older than 30 days with no update" value={stale.length} />
        <Metric label="Opportunities updated this month" value={thisMonthCount} />
      </Section>

      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-card">
        <h3 className="text-lg font-semibold">Suggested Management Summary Text</h3>
        <textarea readOnly value={summary} className="mt-3 min-h-36 w-full rounded-md border border-slate-300 bg-slate-50 p-3 text-sm text-slate-800" />
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-card">
      <h3 className="text-lg font-semibold">{title}</h3>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{children}</div>
    </section>
  );
}

function Metric({ label, value, highlight, danger }: { label: string; value: string | number; highlight?: boolean; danger?: boolean }) {
  return (
    <div className={`rounded-md border p-4 ${highlight ? "border-green-200 bg-green-50" : danger ? "border-red-200 bg-red-50" : "border-slate-200 bg-slate-50"}`}>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}
