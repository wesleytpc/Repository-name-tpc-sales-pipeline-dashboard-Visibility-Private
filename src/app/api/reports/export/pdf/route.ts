import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/format";
import { createSimplePdf } from "@/lib/pdf";
import { getReportMetrics } from "@/lib/report";
import { filterOpportunitiesForReport, normaliseReportFilters, type ReportDateBasis, type ReportPeriod } from "@/lib/report-filters";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const opportunities = await prisma.opportunity.findMany({
    include: { paymentRecords: true, tasks: true, paymentSchedules: true, contacts: true, proposals: true, touchpoints: true, salesDocuments: true },
  });
  const filters = normaliseReportFilters({
    period: (request.nextUrl.searchParams.get("period") || undefined) as ReportPeriod | undefined,
    dateBasis: (request.nextUrl.searchParams.get("dateBasis") || undefined) as ReportDateBasis | undefined,
    from: request.nextUrl.searchParams.get("from") || undefined,
    to: request.nextUrl.searchParams.get("to") || undefined,
    industry: request.nextUrl.searchParams.get("industry") || undefined,
    product: request.nextUrl.searchParams.get("product") || undefined,
    status: request.nextUrl.searchParams.get("status") || undefined,
  });
  const filteredOpportunities = filterOpportunitiesForReport(opportunities, filters);
  const metrics = getReportMetrics(filteredOpportunities);
  const generatedDate = new Date();

  const lines = [
    { text: "TPC Sales Pipeline Report", size: 20, bold: true, gapAfter: 10 },
    { text: `Generated: ${formatDate(generatedDate)}`, size: 10, gapAfter: 14 },
    { text: `Filtered leads: ${filteredOpportunities.length} of ${opportunities.length}`, size: 10 },
    { text: `Period: ${filters.period.replace("-", " ")} | Date based on: ${filters.dateBasis}`, size: 10, gapAfter: 14 },
    { text: "Executive Sales Summary", size: 14, bold: true, gapAfter: 6 },
    { text: `Active leads: ${metrics.active.length}` },
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
      text: `${label}: ${filteredOpportunities.filter((item) => item.stage === stage).length}`,
    })),
    { text: "", gapAfter: 8 },
    { text: "Final Wins", size: 14, bold: true, gapAfter: 6 },
    { text: `Leads won: ${metrics.won.length}` },
    { text: `Payment received leads: ${metrics.paymentReceived.length}` },
    { text: `Payment records captured: ${metrics.paymentsRecorded}` },
    { text: `Money received: ${formatCurrency(metrics.moneyReceived)}`, bold: true, gapAfter: 12 },
    { text: "Follow-Up Risks", size: 14, bold: true, gapAfter: 6 },
    { text: `Overdue follow-ups: ${metrics.overdueFollowUps.length}` },
    { text: `Overdue tasks: ${metrics.overdueTasks.length}` },
    { text: `Leads with no next step: ${metrics.noNextStep.length}` },
    { text: `Leads older than 30 days with no update: ${metrics.stale.length}` },
    { text: `Leads updated this month: ${metrics.thisMonthCount}`, gapAfter: 12 },
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
