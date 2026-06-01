import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Edit } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { calculateWeightedValue, getStageBadgeClass, getStageLabel, isProposalStage } from "@/lib/pipeline";
import { formatCurrency, formatDate, formatPercent } from "@/lib/format";
import { ActivityLog } from "@/components/ActivityLog";
import { ContactList } from "@/components/ContactList";
import { FinancialSummary } from "@/components/FinancialSummary";
import { MeetingNotes } from "@/components/MeetingNotes";
import { PaymentRecords } from "@/components/PaymentRecords";
import { PaymentScheduleList } from "@/components/PaymentScheduleList";
import { PipelineJourney } from "@/components/PipelineJourney";
import { ProposalList } from "@/components/ProposalList";
import { RelationshipTimeline } from "@/components/RelationshipTimeline";
import { SalesDocumentList } from "@/components/SalesDocumentList";
import { StageChecklist } from "@/components/StageChecklist";
import { TaskList } from "@/components/TaskList";
import { TouchpointList } from "@/components/TouchpointList";

export const dynamic = "force-dynamic";

export default async function OpportunityDetailPage({ params }: { params: { id: string } }) {
  const opportunity = await prisma.opportunity.findUnique({
    where: { id: params.id },
    include: {
      activities: { orderBy: { activityDate: "desc" } },
      meetingNotes: { include: { attachments: true }, orderBy: { meetingDate: "desc" } },
      paymentRecords: { orderBy: { receivedDate: "desc" } },
      contacts: { orderBy: [{ isDecisionMaker: "desc" }, { createdAt: "desc" }] },
      tasks: { orderBy: [{ status: "asc" }, { dueDate: "asc" }] },
      proposals: { orderBy: { createdAt: "desc" } },
      paymentSchedules: { orderBy: { dueDate: "asc" } },
      touchpoints: { orderBy: { touchpointDate: "desc" } },
      salesDocuments: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!opportunity) notFound();
  const fundsReceived = opportunity.paymentRecords.reduce((sum, payment) => sum + payment.amount, 0);

  const fields = [
    ["Contact Person", opportunity.contactName],
    ["Email", opportunity.email],
    ["Phone", opportunity.phone],
    ["Industry", opportunity.industry],
    ["Product", opportunity.product],
    ["Product Category", opportunity.productCategory?.replace(/_/g, " ")],
    ["Lead Type", opportunity.opportunityType],
    ["Client Outcome Type", opportunity.outcomeType?.replace(/_/g, " ")],
    ["Lead Source", opportunity.leadSource?.replace(/_/g, " ")],
    ["Stage", getStageLabel(opportunity.stage)],
    ["Estimated Value", formatCurrency(opportunity.estimatedValue)],
    ["Funds Received", formatCurrency(fundsReceived)],
    ["Probability", formatPercent(opportunity.probability)],
    ["Weighted Value", formatCurrency(calculateWeightedValue(opportunity.estimatedValue, opportunity.probability))],
    ["Expected Close Date", formatDate(opportunity.expectedCloseDate)],
    ["Next Step", opportunity.nextStep],
    ["Next Step Date", formatDate(opportunity.nextStepDate)],
    ["Last Contact Date", formatDate(opportunity.lastContactDate)],
    ["Status", opportunity.status.replace("_", " ")],
    ["Lost Reason", opportunity.lostReason?.replace(/_/g, " ")],
    ["Created At", formatDate(opportunity.createdAt)],
    ["Updated At", formatDate(opportunity.updatedAt)],
  ];

  let winStatus = "Activity win: still needs movement toward commercial intent.";
  if (opportunity.stage === "PAYMENT_RECEIVED") winStatus = "Final win achieved: money in the bank.";
  else if (isProposalStage(opportunity.stage)) winStatus = "Strong pipeline win: commercial intent shown.";
  else if (["MEETING_HELD", "DEMO_COMPLETED"].includes(opportunity.stage)) winStatus = "Progress win: opportunity is moving.";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/opportunities" className="inline-flex items-center gap-2 text-sm font-medium text-orange-700 hover:text-orange-800">
            <ArrowLeft className="h-4 w-4" /> Back to Leads
          </Link>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">{opportunity.companyName}</h2>
        </div>
        <Link href={`/opportunities/${opportunity.id}/edit`} className="inline-flex items-center gap-2 rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700">
          <Edit className="h-4 w-4" /> Edit Lead
        </Link>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Lead Details</h2>
          <span className={`inline-flex rounded-full border px-3 py-1 text-sm font-medium ${getStageBadgeClass(opportunity.stage)}`}>{getStageLabel(opportunity.stage)}</span>
        </div>
        <dl className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {fields.map(([label, value]) => (
            <div key={label} className="rounded-md border border-slate-200 p-3">
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
              <dd className="mt-1 text-sm font-medium text-slate-900">{value || "-"}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-4 rounded-md border border-slate-200 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Notes</p>
          <p className="mt-1 whitespace-pre-line text-sm text-slate-700">{opportunity.notes || "-"}</p>
        </div>
      </section>

      <section className="rounded-lg border border-orange-200 bg-orange-50 p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-orange-700">Current Win Status</p>
        <p className="mt-1 text-lg font-semibold text-slate-950">{winStatus}</p>
      </section>

      <PipelineJourney stage={opportunity.stage} />

      <FinancialSummary opportunity={opportunity} paymentRecords={opportunity.paymentRecords} paymentSchedules={opportunity.paymentSchedules} />

      <StageChecklist opportunity={opportunity} />

      <RelationshipTimeline
        activities={opportunity.activities}
        meetingNotes={opportunity.meetingNotes}
        paymentRecords={opportunity.paymentRecords}
        proposals={opportunity.proposals}
        salesDocuments={opportunity.salesDocuments}
        touchpoints={opportunity.touchpoints}
      />

      <TaskList opportunityId={opportunity.id} tasks={opportunity.tasks} />

      <TouchpointList opportunityId={opportunity.id} touchpoints={opportunity.touchpoints} />

      <SalesDocumentList opportunityId={opportunity.id} documents={opportunity.salesDocuments} />

      <ContactList opportunityId={opportunity.id} contacts={opportunity.contacts} />

      <ProposalList opportunityId={opportunity.id} proposals={opportunity.proposals} />

      <PaymentScheduleList opportunityId={opportunity.id} schedules={opportunity.paymentSchedules} />

      <PaymentRecords opportunityId={opportunity.id} paymentRecords={opportunity.paymentRecords} />

      <MeetingNotes opportunityId={opportunity.id} meetingNotes={opportunity.meetingNotes} />

      <ActivityLog opportunityId={opportunity.id} activities={opportunity.activities} />
    </div>
  );
}
