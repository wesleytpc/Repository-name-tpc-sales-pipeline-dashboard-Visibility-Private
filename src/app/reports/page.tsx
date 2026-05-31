import Link from "next/link";
import { Download } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/format";
import { getReportMetrics } from "@/lib/report";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const opportunities = await prisma.opportunity.findMany({
    include: { paymentRecords: true, tasks: true, paymentSchedules: true, contacts: true, proposals: true, touchpoints: true, salesDocuments: true },
  });
  const {
    active,
    activePipeline,
    weightedPipeline,
    proposalOpportunities,
    quotesSentValue,
    won,
    revenueClosed,
    paymentReceived,
    moneyReceived,
    paymentsRecorded,
    overdueTasks,
    proposalWithoutFollowUp,
    verbalNoInvoice,
    invoiceNoPayment,
    highValueNoNextStep,
    expectedCashIn,
    overdueExpectedPayments,
    touchpointsLogged,
    documentsSent,
    overdueFollowUps,
    noNextStep,
    stale,
    thisMonthCount,
    progressStages,
    summary,
  } = getReportMetrics(opportunities);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Reports</h2>
          <p className="mt-1 text-sm text-slate-600">Management-ready view of pipeline value, progress wins, final wins and follow-up risk.</p>
        </div>
        <Link
          href="/api/reports/export/pdf"
          className="inline-flex items-center gap-2 rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
        >
          <Download className="h-4 w-4" />
          Export PDF
        </Link>
      </div>

      <Section title="Executive Sales Summary">
        <Metric label="Active pipeline value" value={formatCurrency(activePipeline)} />
        <Metric label="Weighted pipeline value" value={formatCurrency(weightedPipeline)} />
        <Metric label="Quotes sent value" value={formatCurrency(quotesSentValue)} />
        <Metric label="Revenue closed" value={formatCurrency(revenueClosed)} />
        <Metric label="Money received" value={formatCurrency(moneyReceived)} highlight />
        <Metric label="Expected cash-in" value={formatCurrency(expectedCashIn)} />
      </Section>

      <Section title="Progress Wins">
        <Metric label="Touchpoints logged" value={touchpointsLogged} />
        <Metric label="Documents sent" value={documentsSent} />
        {progressStages.map(([label, stage]) => (
          <Metric key={stage} label={label} value={opportunities.filter((item) => item.stage === stage).length} />
        ))}
      </Section>

      <Section title="Final Wins">
        <Metric label="Number of opportunities won" value={won.length} />
        <Metric label="Money received" value={formatCurrency(moneyReceived)} highlight />
        <Metric label="Payment received opportunities" value={paymentReceived.length} />
        <Metric label="Payment records captured" value={paymentsRecorded} />
      </Section>

      <Section title="Follow-Up Risks">
        <Metric label="Overdue follow-ups" value={overdueFollowUps.length} danger />
        <Metric label="Overdue tasks" value={overdueTasks.length} danger />
        <Metric label="Opportunities with no next step" value={noNextStep.length} />
        <Metric label="Opportunities older than 30 days with no update" value={stale.length} />
        <Metric label="Opportunities updated this month" value={thisMonthCount} />
      </Section>

      <Section title="Pipeline Inspection">
        <Metric label="Proposal sent with no follow-up date" value={proposalWithoutFollowUp.length} danger />
        <Metric label="Verbal approvals with no proposal record" value={verbalNoInvoice.length} />
        <Metric label="Invoice requested with no payment" value={invoiceNoPayment.length} danger />
        <Metric label="High-value deals with no next step" value={highValueNoNextStep.length} danger />
        <Metric label="Overdue expected payments" value={overdueExpectedPayments.length} danger />
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
