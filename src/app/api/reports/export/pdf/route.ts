import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/format";
import { createSimplePdf } from "@/lib/pdf";
import { getReportMetrics } from "@/lib/report";

export const dynamic = "force-dynamic";

export async function GET() {
  const opportunities = await prisma.opportunity.findMany({
    include: { paymentRecords: true, tasks: true, paymentSchedules: true, contacts: true, proposals: true, touchpoints: true, salesDocuments: true },
  });
  const metrics = getReportMetrics(opportunities);
  const generatedDate = new Date();

  const lines = [
    { text: "TPC Sales Pipeline Report", size: 20, bold: true, gapAfter: 10 },
    { text: `Generated: ${formatDate(generatedDate)}`, size: 10, gapAfter: 14 },
    { text: "Executive Sales Summary", size: 14, bold: true, gapAfter: 6 },
    { text: `Active opportunities: ${metrics.active.length}` },
    { text: `Active pipeline value: ${formatCurrency(metrics.activePipeline)}` },
    { text: `Weighted pipeline value: ${formatCurrency(metrics.weightedPipeline)}` },
    { text: `Quotes sent value: ${formatCurrency(metrics.quotesSentValue)}` },
    { text: `Revenue closed: ${formatCurrency(metrics.revenueClosed)}` },
    { text: `Money received: ${formatCurrency(metrics.moneyReceived)}`, bold: true, gapAfter: 12 },
    { text: `Expected cash-in: ${formatCurrency(metrics.expectedCashIn)}`, gapAfter: 12 },
    { text: "Progress Wins", size: 14, bold: true, gapAfter: 6 },
    { text: `Touchpoints logged: ${metrics.touchpointsLogged}` },
    { text: `Documents sent: ${metrics.documentsSent}` },
    ...metrics.progressStages.map(([label, stage]) => ({
      text: `${label}: ${opportunities.filter((item) => item.stage === stage).length}`,
    })),
    { text: "", gapAfter: 8 },
    { text: "Final Wins", size: 14, bold: true, gapAfter: 6 },
    { text: `Opportunities won: ${metrics.won.length}` },
    { text: `Payment received opportunities: ${metrics.paymentReceived.length}` },
    { text: `Payment records captured: ${metrics.paymentsRecorded}` },
    { text: `Money received: ${formatCurrency(metrics.moneyReceived)}`, bold: true, gapAfter: 12 },
    { text: "Follow-Up Risks", size: 14, bold: true, gapAfter: 6 },
    { text: `Overdue follow-ups: ${metrics.overdueFollowUps.length}` },
    { text: `Overdue tasks: ${metrics.overdueTasks.length}` },
    { text: `Opportunities with no next step: ${metrics.noNextStep.length}` },
    { text: `Opportunities older than 30 days with no update: ${metrics.stale.length}` },
    { text: `Opportunities updated this month: ${metrics.thisMonthCount}`, gapAfter: 12 },
    { text: "Pipeline Inspection", size: 14, bold: true, gapAfter: 6 },
    { text: `Proposal sent with no follow-up date: ${metrics.proposalWithoutFollowUp.length}` },
    { text: `Invoice requested with no payment: ${metrics.invoiceNoPayment.length}` },
    { text: `High-value deals with no next step: ${metrics.highValueNoNextStep.length}` },
    { text: `Overdue expected payments: ${metrics.overdueExpectedPayments.length}`, gapAfter: 12 },
    { text: "Suggested Management Summary", size: 14, bold: true, gapAfter: 6 },
    { text: metrics.summary },
  ];

  const pdf = createSimplePdf(lines);
  const date = generatedDate.toISOString().slice(0, 10);

  return new Response(pdf, {
    headers: {
      "Content-Disposition": `attachment; filename="tpc-sales-report-${date}.pdf"`,
      "Content-Type": "application/pdf",
      "Content-Length": String(pdf.length),
    },
  });
}
