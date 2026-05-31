import type { Opportunity, PaymentRecord, Proposal, MeetingNote, SalesDocument, Contact } from "@prisma/client";
import { CheckCircle2, CircleAlert } from "lucide-react";
import { getStageLabel } from "@/lib/pipeline";

type OpportunityWithChecks = Opportunity & {
  contacts: Contact[];
  meetingNotes: MeetingNote[];
  proposals: Proposal[];
  paymentRecords: PaymentRecord[];
  salesDocuments: SalesDocument[];
};

export function StageChecklist({ opportunity }: { opportunity: OpportunityWithChecks }) {
  const hasDecisionMaker = opportunity.contacts.some((contact) => contact.isDecisionMaker);
  const hasMeeting = opportunity.meetingNotes.length > 0;
  const hasProposal = opportunity.proposals.length > 0 || opportunity.salesDocuments.some((doc) => ["PROPOSAL", "QUOTE"].includes(doc.type));
  const hasInvoice = opportunity.salesDocuments.some((doc) => doc.type === "INVOICE");
  const hasPayment = opportunity.paymentRecords.length > 0;

  const checks = [
    { label: "Decision-maker identified", done: hasDecisionMaker, helper: "Add a decision-maker contact before relying on verbal approval." },
    { label: "Meeting or demo captured", done: hasMeeting, helper: "Add meeting notes or a transcript after client engagement." },
    { label: "Proposal or quote recorded", done: hasProposal, helper: "Capture the proposal/quote before moving commercial stages." },
    { label: "Invoice / PO / contract document tracked", done: hasInvoice || ["PO_CONTRACT_INVOICE_REQUESTED", "PAYMENT_RECEIVED"].includes(opportunity.stage), helper: "Track invoice, PO or contract when requested." },
    { label: "Payment record captured", done: hasPayment, helper: "Final win should have money received recorded." },
  ];

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Stage Checklist</h2>
          <p className="mt-1 text-sm text-slate-600">Current stage: {getStageLabel(opportunity.stage)}</p>
        </div>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {checks.map((check) => (
          <div key={check.label} className={`rounded-md border p-3 ${check.done ? "border-green-200 bg-green-50" : "border-orange-200 bg-orange-50"}`}>
            <div className="flex items-start gap-2">
              {check.done ? <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-700" /> : <CircleAlert className="mt-0.5 h-4 w-4 text-orange-700" />}
              <div>
                <p className="text-sm font-semibold text-slate-950">{check.label}</p>
                <p className="mt-1 text-xs text-slate-600">{check.done ? "Complete" : check.helper}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
