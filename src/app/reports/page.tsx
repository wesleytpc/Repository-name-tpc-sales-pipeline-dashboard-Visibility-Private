import Link from "next/link";
import { Download } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/format";
import { getReportMetrics } from "@/lib/report";
import {
  filterOpportunitiesForReport,
  getDefaultFromDate,
  getReportFilterOptions,
  getReportFilterQuery,
  normaliseReportFilters,
  type ReportDateBasis,
  type ReportPeriod,
} from "@/lib/report-filters";

export const dynamic = "force-dynamic";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams?: {
    period?: ReportPeriod;
    dateBasis?: ReportDateBasis;
    from?: string;
    to?: string;
    industry?: string;
    product?: string;
    status?: string;
  };
}) {
  const opportunities = await prisma.opportunity.findMany({
    include: { paymentRecords: true, tasks: true, paymentSchedules: true, contacts: true, proposals: true, touchpoints: true, salesDocuments: true },
  });
  const filters = normaliseReportFilters(searchParams);
  const { industries, products } = getReportFilterOptions(opportunities);
  const filteredOpportunities = filterOpportunitiesForReport(opportunities, searchParams);
  const exportQuery = getReportFilterQuery(searchParams);
  const exportHref = `/api/reports/export/pdf${exportQuery ? `?${exportQuery}` : ""}`;
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
  } = getReportMetrics(filteredOpportunities);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Reports</h2>
          <p className="mt-1 text-sm text-slate-600">Management-ready view of pipeline value, progress wins, final wins and follow-up risk.</p>
        </div>
        <Link
          href={exportHref}
          className="inline-flex items-center gap-2 rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
        >
          <Download className="h-4 w-4" />
          Export PDF
        </Link>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">Report Filters</h3>
            <p className="mt-1 text-sm text-slate-600">Filter the report by date period, industry, product and lead status before exporting.</p>
          </div>
          <Link href="/reports" className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Reset Filters
          </Link>
        </div>
        <form className="mt-4 grid gap-3 md:grid-cols-3 xl:grid-cols-7">
          <label className="text-sm font-medium text-slate-700">
            Time Period
            <select name="period" defaultValue={filters.period} className={filterClass}>
              <option value="all">All time</option>
              <option value="this-month">This month</option>
              <option value="last-month">Last month</option>
              <option value="this-quarter">This quarter</option>
              <option value="this-year">This year</option>
              <option value="next-30">Next 30 days</option>
              <option value="custom">Custom dates</option>
            </select>
          </label>
          <label className="text-sm font-medium text-slate-700">
            Date Based On
            <select name="dateBasis" defaultValue={filters.dateBasis} className={filterClass}>
              <option value="updatedAt">Last updated</option>
              <option value="createdAt">Created date</option>
              <option value="expectedCloseDate">Expected close</option>
              <option value="lastContactDate">Last contact</option>
              <option value="nextStepDate">Next step date</option>
            </select>
          </label>
          <label className="text-sm font-medium text-slate-700">
            From
            <input name="from" type="date" defaultValue={getDefaultFromDate(searchParams)} className={filterClass} />
          </label>
          <label className="text-sm font-medium text-slate-700">
            To
            <input name="to" type="date" defaultValue={filters.to} className={filterClass} />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Industry
            <select name="industry" defaultValue={filters.industry} className={filterClass}>
              <option value="">All industries</option>
              {industries.map((industry) => <option key={industry} value={industry}>{industry}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium text-slate-700">
            Product
            <select name="product" defaultValue={filters.product} className={filterClass}>
              <option value="">All products</option>
              {products.map((product) => <option key={product} value={product}>{product}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium text-slate-700">
            Status
            <select name="status" defaultValue={filters.status} className={filterClass}>
              <option value="">All statuses</option>
              {["ACTIVE", "WON", "LOST", "ON_HOLD"].map((status) => <option key={status} value={status}>{status.replace("_", " ")}</option>)}
            </select>
          </label>
          <div className="md:col-span-3 xl:col-span-7">
            <button className="rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700">
              Apply Filters
            </button>
            <span className="ml-3 text-sm text-slate-500">{filteredOpportunities.length} of {opportunities.length} leads shown</span>
          </div>
        </form>
      </section>

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
          <Metric key={stage} label={label} value={filteredOpportunities.filter((item) => item.stage === stage).length} />
        ))}
      </Section>

      <Section title="Final Wins">
        <Metric label="Number of leads won" value={won.length} />
        <Metric label="Money received" value={formatCurrency(moneyReceived)} highlight />
        <Metric label="Payment received leads" value={paymentReceived.length} />
        <Metric label="Payment records captured" value={paymentsRecorded} />
      </Section>

      <Section title="Follow-Up Risks">
        <Metric label="Overdue follow-ups" value={overdueFollowUps.length} danger />
        <Metric label="Overdue tasks" value={overdueTasks.length} danger />
        <Metric label="Leads with no next step" value={noNextStep.length} />
        <Metric label="Leads older than 30 days with no update" value={stale.length} />
        <Metric label="Leads updated this month" value={thisMonthCount} />
      </Section>

      <Section title="Pipeline Inspection">
        <Metric label="Proposal sent with no follow-up date" value={proposalWithoutFollowUp.length} danger />
        <Metric label="PO / invoice stage with no payment" value={verbalNoInvoice.length} />
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

const filterClass = "mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100";

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
