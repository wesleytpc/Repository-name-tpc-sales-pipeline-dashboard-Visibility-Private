import { Banknote, BriefcaseBusiness, CalendarClock, CheckCircle2, FileText, ListTodo, MoveUpRight, ReceiptText, TrendingUp } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { calculateWeightedValue, getCurrentWeekStart, isOverdue, isRevenueStage } from "@/lib/pipeline";
import { formatCurrency } from "@/lib/format";
import { ConversionFunnel } from "@/components/ConversionFunnel";
import { DashboardCard } from "@/components/DashboardCard";
import { PipelineCharts } from "@/components/PipelineCharts";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const opportunities = await prisma.opportunity.findMany({
    include: { paymentRecords: true, tasks: true, paymentSchedules: true },
    orderBy: { updatedAt: "desc" },
  });
  const active = opportunities.filter((item) => item.status === "ACTIVE");

  const totalPipeline = active.reduce((sum, item) => sum + item.estimatedValue, 0);
  const weightedPipeline = active.reduce((sum, item) => sum + calculateWeightedValue(item.estimatedValue, item.probability), 0);
  const proposalValue = opportunities.filter((item) => item.stage === "PROPOSAL_SENT").reduce((sum, item) => sum + item.estimatedValue, 0);
  const revenueClosed = opportunities.filter((item) => item.status === "WON" || isRevenueStage(item.stage)).reduce((sum, item) => sum + item.estimatedValue, 0);
  const moneyReceived = opportunities.reduce(
    (sum, item) => sum + item.paymentRecords.reduce((paymentSum, payment) => paymentSum + payment.amount, 0),
    0,
  );
  const overdue = active.filter((item) => isOverdue(item.nextStepDate)).length;
  const overdueTasks = opportunities.flatMap((item) => item.tasks).filter((task) => task.status !== "COMPLETED" && task.status !== "CANCELLED" && isOverdue(task.dueDate)).length;
  const expectedCashIn = opportunities.flatMap((item) => item.paymentSchedules).filter((schedule) => !["PAID", "CANCELLED"].includes(schedule.status)).reduce((sum, schedule) => sum + schedule.expectedAmount, 0);
  const movedThisWeek = active.filter((item) => item.updatedAt >= getCurrentWeekStart()).length;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardCard title="Active Opportunities" value={active.length} icon={BriefcaseBusiness} />
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
        <PipelineCharts opportunities={opportunities} />
        <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-card">
          <h2 className="text-lg font-semibold">Win Definition</h2>
          <div className="mt-4 rounded-md bg-slate-950 p-4 text-white">
            <p className="text-xs uppercase tracking-wide text-orange-300">Final Win</p>
            <p className="mt-1 text-xl font-semibold">Money in the bank.</p>
          </div>
          <h3 className="mt-5 text-sm font-semibold text-slate-700">Progress Wins</h3>
          <ul className="mt-2 space-y-2 text-sm text-slate-600">
            {["Decision-maker reached", "Need confirmed", "Meeting held", "Demo completed", "Proposal sent", "Verbal approval", "PO / invoice requested"].map((item) => (
              <li key={item} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 rounded-full bg-orange-500" />{item}</li>
            ))}
          </ul>
          <p className="mt-5 rounded-md bg-orange-50 p-3 text-sm text-orange-800">
            A meeting, lead or positive response is progress. The final win is payment received.
          </p>
        </aside>
      </section>

      <ConversionFunnel opportunities={opportunities} />
    </div>
  );
}
