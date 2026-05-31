import type { Prisma } from "@prisma/client";
import { calculateWeightedValue, getCurrentMonthStart, isOverdue } from "@/lib/pipeline";
import { formatCurrency } from "@/lib/format";

export type ReportOpportunity = Prisma.OpportunityGetPayload<{
  include: { paymentRecords: true; tasks: true; paymentSchedules: true; contacts: true; proposals: true; touchpoints: true; salesDocuments: true };
}>;

export function getReportMetrics(opportunities: ReportOpportunity[]) {
  const active = opportunities.filter((item) => item.status === "ACTIVE");
  const activePipeline = active.reduce((sum, item) => sum + item.estimatedValue, 0);
  const weightedPipeline = active.reduce((sum, item) => sum + calculateWeightedValue(item.estimatedValue, item.probability), 0);
  const proposalOpportunities = opportunities.filter((item) => item.stage === "PROPOSAL_SENT");
  const quotesSentValue = proposalOpportunities.reduce((sum, item) => sum + item.estimatedValue, 0);
  const won = opportunities.filter((item) => item.status === "WON");
  const revenueClosed = won.reduce((sum, item) => sum + item.estimatedValue, 0);
  const paymentReceived = opportunities.filter((item) => item.stage === "PAYMENT_RECEIVED");
  const moneyReceived = opportunities.reduce(
    (sum, item) => sum + item.paymentRecords.reduce((paymentSum, payment) => paymentSum + payment.amount, 0),
    0,
  );
  const paymentsRecorded = opportunities.reduce((sum, item) => sum + item.paymentRecords.length, 0);
  const overdueFollowUps = active.filter((item) => isOverdue(item.nextStepDate));
  const noNextStep = active.filter((item) => !item.nextStep && !item.nextStepDate);
  const openTasks = opportunities.flatMap((item) => item.tasks.filter((task) => task.status !== "COMPLETED" && task.status !== "CANCELLED"));
  const overdueTasks = openTasks.filter((task) => isOverdue(task.dueDate));
  const proposalWithoutFollowUp = active.filter((item) => item.stage === "PROPOSAL_SENT" && !item.nextStepDate);
  const verbalNoInvoice = active.filter((item) => item.stage === "VERBAL_APPROVAL" && !item.proposals.length);
  const invoiceNoPayment = active.filter((item) => item.stage === "PO_CONTRACT_INVOICE_REQUESTED" && !item.paymentRecords.length);
  const highValueNoNextStep = active.filter((item) => item.estimatedValue >= 100000 && !item.nextStep && !item.nextStepDate);
  const expectedPayments = opportunities.flatMap((item) => item.paymentSchedules.filter((schedule) => !["PAID", "CANCELLED"].includes(schedule.status)));
  const expectedCashIn = expectedPayments.reduce((sum, schedule) => sum + schedule.expectedAmount, 0);
  const overdueExpectedPayments = expectedPayments.filter((schedule) => isOverdue(schedule.dueDate));
  const touchpointsLogged = opportunities.reduce((sum, item) => sum + item.touchpoints.length, 0);
  const documentsSent = opportunities.reduce((sum, item) => sum + item.salesDocuments.length, 0);
  const staleDate = new Date();
  staleDate.setDate(staleDate.getDate() - 30);
  const stale = active.filter((item) => item.updatedAt < staleDate);
  const thisMonth = getCurrentMonthStart();
  const thisMonthCount = opportunities.filter((item) => item.updatedAt >= thisMonth).length;

  const progressStages = [
    ["Decision-maker reached", "DECISION_MAKER_REACHED"],
    ["Need confirmed", "NEED_CONFIRMED"],
    ["Meeting held", "MEETING_HELD"],
    ["Demo completed", "DEMO_COMPLETED"],
    ["Proposal sent", "PROPOSAL_SENT"],
  ] as const;

  const summary = `This month, I am managing ${active.length} active opportunities with a total pipeline value of ${formatCurrency(activePipeline)} and a weighted pipeline value of ${formatCurrency(weightedPipeline)}. ${proposalOpportunities.length} opportunities are currently at proposal stage, with ${formatCurrency(quotesSentValue)} in quoted value. ${overdueFollowUps.length} opportunities require overdue follow-up. The main focus for the next week is to move proposal-stage opportunities toward approval and convert short-term training opportunities into paid bookings.`;

  return {
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
    openTasks,
    overdueTasks,
    proposalWithoutFollowUp,
    verbalNoInvoice,
    invoiceNoPayment,
    highValueNoNextStep,
    expectedPayments,
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
  };
}
