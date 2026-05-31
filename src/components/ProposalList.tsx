import type { Proposal } from "@prisma/client";
import { FileText } from "lucide-react";
import { createProposal } from "@/lib/actions";
import { formatCurrency, formatDate } from "@/lib/format";
import { EmptyState } from "@/components/EmptyState";

export function ProposalList({ opportunityId, proposals }: { opportunityId: string; proposals: Proposal[] }) {
  const addProposal = createProposal.bind(null, opportunityId);

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-card">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-orange-600" />
          <h2 className="text-lg font-semibold">Proposals & Quotes</h2>
        </div>
        <div className="mt-4 space-y-3">
          {proposals.length ? proposals.map((proposal) => (
            <article key={proposal.id} className="rounded-md border border-slate-200 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-950">{proposal.quoteNumber || "Proposal"}</p>
                  <p className="mt-1 text-sm text-slate-600">Sent: {formatDate(proposal.sentDate)} | Expires: {formatDate(proposal.expiryDate)}</p>
                </div>
                <p className="font-semibold text-slate-950">{formatCurrency(proposal.amount)}</p>
              </div>
              {proposal.fileName ? <p className="mt-2 text-sm text-slate-600">File: {proposal.fileName}</p> : null}
              {proposal.revisionNotes ? <p className="mt-3 whitespace-pre-line text-sm text-slate-700">{proposal.revisionNotes}</p> : null}
            </article>
          )) : (
            <EmptyState title="No proposals yet" message="Capture proposal value, quote numbers, expiry dates and proposal files." />
          )}
        </div>
      </section>

      <form action={addProposal} className="rounded-lg border border-slate-200 bg-white p-5 shadow-card">
        <h2 className="text-lg font-semibold">Add Proposal</h2>
        <label className="mt-4 block text-sm font-medium text-slate-700">Quote Number<input name="quoteNumber" className={inputClass} /></label>
        <label className="mt-4 block text-sm font-medium text-slate-700">Amount<input name="amount" type="number" min="0" step="0.01" className={inputClass} /></label>
        <label className="mt-4 block text-sm font-medium text-slate-700">Sent Date<input name="sentDate" type="date" className={inputClass} /></label>
        <label className="mt-4 block text-sm font-medium text-slate-700">Expiry Date<input name="expiryDate" type="date" className={inputClass} /></label>
        <label className="mt-4 block text-sm font-medium text-slate-700">Proposal File<input name="proposalFile" type="file" className={inputClass} /></label>
        <label className="mt-4 block text-sm font-medium text-slate-700">Revision Notes<textarea name="revisionNotes" rows={4} className={inputClass} /></label>
        <button className="mt-4 w-full rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700">Save Proposal</button>
      </form>
    </div>
  );
}

const inputClass = "mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100";
