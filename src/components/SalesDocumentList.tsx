import type { SalesDocument } from "@prisma/client";
import { FolderOpen } from "lucide-react";
import { createSalesDocument } from "@/lib/actions";
import { formatDate } from "@/lib/format";
import { salesDocumentTypeLabels } from "@/lib/sales-options";
import { EmptyState } from "@/components/EmptyState";

export function SalesDocumentList({ opportunityId, documents }: { opportunityId: string; documents: SalesDocument[] }) {
  const addDocument = createSalesDocument.bind(null, opportunityId);

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-card">
        <div className="flex items-center gap-2">
          <FolderOpen className="h-5 w-5 text-orange-600" />
          <h2 className="text-lg font-semibold">Documents Sent</h2>
        </div>
        <div className="mt-4 space-y-3">
          {documents.length ? documents.map((document) => (
            <article key={document.id} className="rounded-md border border-slate-200 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-950">{document.title}</p>
                  <p className="mt-1 text-sm text-slate-600">{salesDocumentTypeLabels[document.type]} | Sent: {formatDate(document.sentDate)}</p>
                  <p className="mt-1 text-sm text-slate-600">Recipient: {document.recipient || "-"}</p>
                </div>
              </div>
              {document.fileName ? <p className="mt-2 text-sm text-slate-600">File: {document.fileName}</p> : null}
              {document.notes ? <p className="mt-3 whitespace-pre-line text-sm text-slate-700">{document.notes}</p> : null}
            </article>
          )) : (
            <EmptyState title="No documents sent yet" message="Track brochures, course outlines, info packs, quotes, invoices and contracts sent to the client." />
          )}
        </div>
      </section>

      <form action={addDocument} className="rounded-lg border border-slate-200 bg-white p-5 shadow-card">
        <h2 className="text-lg font-semibold">Add Sent Document</h2>
        <label className="mt-4 block text-sm font-medium text-slate-700">
          Type
          <select name="type" className={inputClass}>{Object.entries(salesDocumentTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
        </label>
        <label className="mt-4 block text-sm font-medium text-slate-700">Title *<input name="title" required placeholder="AI course brochure, mining training quote" className={inputClass} /></label>
        <label className="mt-4 block text-sm font-medium text-slate-700">Sent Date<input name="sentDate" type="date" className={inputClass} /></label>
        <label className="mt-4 block text-sm font-medium text-slate-700">Recipient<input name="recipient" className={inputClass} /></label>
        <label className="mt-4 block text-sm font-medium text-slate-700">File<input name="documentFile" type="file" className={inputClass} /></label>
        <label className="mt-4 block text-sm font-medium text-slate-700">Notes<textarea name="notes" rows={4} className={inputClass} /></label>
        <button className="mt-4 w-full rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700">Save Document</button>
      </form>
    </div>
  );
}

const inputClass = "mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100";
