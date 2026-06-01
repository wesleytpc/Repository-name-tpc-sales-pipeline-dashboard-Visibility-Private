import { Banknote, BriefcaseBusiness, CalendarClock, CheckCircle2, FileText, ListTodo, MoveUpRight, ReceiptText, TrendingUp } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { calculateWeightedValue, getCurrentWeekStart, isOverdue, isRevenueStage } from "@/lib/pipeline";
import { formatCurrency, toInputDate } from "@/lib/format";
import { ConversionFunnel } from "@/components/ConversionFunnel";
import { DashboardCard } from "@/components/DashboardCard";
import { PipelineCharts } from "@/components/PipelineCharts";

export const dynamic = "force-dynamic";

type DashboardDateBasis = "updatedAt" | "createdAt" | "expectedCloseDate" | "lastContactDate" | "nextStepDate";
type DashboardPeriod = "all" | "this-month" | "last-month" | "this-quarter" | "this-year" | "next-30" | "custom";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: {
    period?: DashboardPeriod;
    dateBasis?: DashboardDateBasis;
    from?: string;
    to?: string;
    industry?: string;
    product?: string;
    status?: string;
  };
}) {
  const opportunities = await prisma.opportunity.findMany({
    include: { paymentRecords: true, tasks: true, paymentSchedules: true },
    orderBy: { updatedAt: "desc" },
  });

  const period = searchParams?.period ?? "all";
  const dateBasis = searchParams?.dateBasis ?? "updatedAt";
  const { startDate, endDate } = getDashboardDateRange(period, searchParams?.from, searchParams?.to);
  const industries = Array.from(new Set(opportunities.map((item) => item.industry).filter(Boolean))).sort() as string[];
  const products = Array.from(new Set(opportunities.map((item) => item.product).filter(Boolean))).sort() as string[];

  const filteredOpportunities = opportunities.filter((item) => {
    const date = getOpportunityDate(item, dateBasis);
    return (!searchParams?.industry || item.industry === searchParams.industry)
      && (!searchParams?.product || item.product === searchParams.product)
      && (!searchParams?.status || item.status === searchParams.status)
      && (!startDate || (date && date >= startDate))
      && (!endDate || (date && date < endDate));
  });

  const active = filteredOpportunities.filter((item) => item.status === "ACTIVE");

  const totalPipeline = active.reduce((sum, item) => sum + item.estimatedValue, 0);
  const weightedPipeline = active.reduce((sum, item) => sum + calculateWeightedValue(item.estimatedValue, item.probability), 0);
  const proposalValue = filteredOpportunities.filter((item) => item.stage === "PROPOSAL_SENT").reduce((sum, item) => sum + item.estimatedValue, 0);
  const revenueClosed = filteredOpportunities.filter((item) => item.status === "WON" || isRevenueStage(item.stage)).reduce((sum, item) => sum + item.estimatedValue, 0);
  const moneyReceived = filteredOpportunities.reduce(
    (sum, item) => sum + item.paymentRecords.reduce((paymentSum, payment) => paymentSum + payment.amount, 0),
    0,
  );
  const overdue = active.filter((item) => isOverdue(item.nextStepDate)).length;
  const overdueTasks = filteredOpportunities.flatMap((item) => item.tasks).filter((task) => task.status !== "COMPLETED" && task.status !== "CANCELLED" && isOverdue(task.dueDate)).length;
  const expectedCashIn = filteredOpportunities.flatMap((item) => item.paymentSchedules).filter((schedule) => !["PAID", "CANCELLED"].includes(schedule.status)).reduce((sum, schedule) => sum + schedule.expectedAmount, 0);
  const movedThisWeek = active.filter((item) => item.updatedAt >= getCurrentWeekStart()).length;

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Dashboard Filters</h2>
            <p className="mt-1 text-sm text-slate-600">Focus the dashboard by date period, industry, product and lead status.</p>
          </div>
          <a href="/dashboard" className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Reset Filters
          </a>
        </div>
        <form className="mt-4 grid gap-3 md:grid-cols-3 xl:grid-cols-7">
          <label className="text-sm font-medium text-slate-700">
            Time Period
            <select name="period" defaultValue={period} className={filterClass}>
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
            <select name="dateBasis" defaultValue={dateBasis} className={filterClass}>
              <option value="updatedAt">Last updated</option>
              <option value="createdAt">Created date</option>
              <option value="expectedCloseDate">Expected close</option>
              <option value="lastContactDate">Last contact</option>
              <option value="nextStepDate">Next step date</option>
            </select>
          </label>
          <label className="text-sm font-medium text-slate-700">
            From
            <input name="from" type="date" defaultValue={searchParams?.from ?? (period === "custom" ? "" : toInputDate(startDate))} className={filterClass} />
          </label>
          <label className="text-sm font-medium text-slate-700">
            To
            <input name="to" type="date" defaultValue={searchParams?.to ?? ""} className={filterClass} />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Industry
            <select name="industry" defaultValue={searchParams?.industry ?? ""} className={filterClass}>
              <option value="">All industries</option>
              {industries.map((industry) => <option key={industry} value={industry}>{industry}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium text-slate-700">
            Product
            <select name="product" defaultValue={searchParams?.product ?? ""} className={filterClass}>
              <option value="">All products</option>
              {products.map((product) => <option key={product} value={product}>{product}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium text-slate-700">
            Status
            <select name="status" defaultValue={searchParams?.status ?? ""} className={filterClass}>
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

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardCard title="Active Leads" value={active.length} icon={BriefcaseBusiness} />
        <DashboardCard title="Total Pipeline Value" value={formatCurrency(totalPipeline)} icon={TrendingUp} />
        <DashboardCard title="Weighted Pipeline Value" value={formatCurrency(weightedPipeline)} icon={MoveUpRight} />
        <DashboardCard title="Quotes / Proposals Sent Value" value={formatCurrency(proposalValue)} icon={FileText} />
        <DashboardCard title="Revenue Closed" value={formatCurrency(revenueClosed)} icon={ReceiptText} />
        <DashboardCard title="Money Received" value={formatCurrency(moneyReceived)} icon={Banknote} note="Recorded deposits, subscriptions, milestones and final payments." />
        <DashboardCard title="Expected Cash-In" value={formatCurrency(expectedCashIn)} icon={ReceiptText} note="Open expected payments and milestones." />
        <DashboardCard title="Overdue Follow-Ups" value={overdue} icon={CalendarClock} />
        <DashboardCard title="Overdue Tasks" value={overdueTasks} icon={ListTodo} />
        <DashboardCard title="Moved Forward This Week" value={movedThisWeek} icon={CheckCircle2} />
      </section>

      <section className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <PipelineCharts opportunities={filteredOpportunities} />
        <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-card">
          <h2 className="text-lg font-semibold">Win Definition</h2>
          <div className="mt-4 rounded-md bg-slate-950 p-4 text-white">
            <p className="text-xs uppercase tracking-wide text-orange-300">Final Win</p>
            <p className="mt-1 text-xl font-semibold">Money in the bank.</p>
          </div>
          <h3 className="mt-5 text-sm font-semibold text-slate-700">Progress Wins</h3>
          <ul className="mt-2 space-y-2 text-sm text-slate-600">
            {["Decision-maker reached", "Need confirmed", "Meeting held", "Demo completed", "Proposal sent", "PO / invoice requested"].map((item) => (
              <li key={item} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 rounded-full bg-orange-500" />{item}</li>
            ))}
          </ul>
          <p className="mt-5 rounded-md bg-orange-50 p-3 text-sm text-orange-800">
            A meeting, lead or positive response is progress. The final win is payment received.
          </p>
        </aside>
      </section>

      <ConversionFunnel opportunities={filteredOpportunities} />
    </div>
  );
}

const filterClass = "mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100";

function getDashboardDateRange(period: DashboardPeriod, from?: string, to?: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let startDate: Date | null = null;
  let endDate: Date | null = null;

  if (period === "this-month") {
    startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    endDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  } else if (period === "last-month") {
    startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    endDate = new Date(today.getFullYear(), today.getMonth(), 1);
  } else if (period === "this-quarter") {
    const quarterStartMonth = Math.floor(today.getMonth() / 3) * 3;
    startDate = new Date(today.getFullYear(), quarterStartMonth, 1);
    endDate = new Date(today.getFullYear(), quarterStartMonth + 3, 1);
  } else if (period === "this-year") {
    startDate = new Date(today.getFullYear(), 0, 1);
    endDate = new Date(today.getFullYear() + 1, 0, 1);
  } else if (period === "next-30") {
    startDate = today;
    endDate = new Date(today);
    endDate.setDate(endDate.getDate() + 31);
  } else if (period === "custom") {
    startDate = from ? parseInputDate(from) : null;
    endDate = to ? parseInputDate(to, true) : null;
  }

  return { startDate, endDate };
}

function parseInputDate(value: string, endOfDay = false) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  if (endOfDay) date.setDate(date.getDate() + 1);
  return date;
}

function getOpportunityDate(
  opportunity: {
    updatedAt: Date;
    createdAt: Date;
    expectedCloseDate: Date | null;
    lastContactDate: Date | null;
    nextStepDate: Date | null;
  },
  basis: DashboardDateBasis,
) {
  return opportunity[basis] ?? null;
}
