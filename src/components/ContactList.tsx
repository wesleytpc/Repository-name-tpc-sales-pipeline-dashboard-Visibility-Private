import type { Contact } from "@prisma/client";
import { UserRound } from "lucide-react";
import { createContact } from "@/lib/actions";
import { influenceTypeLabels } from "@/lib/sales-options";
import { EmptyState } from "@/components/EmptyState";

export function ContactList({ opportunityId, contacts }: { opportunityId: string; contacts: Contact[] }) {
  const addContact = createContact.bind(null, opportunityId);

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-card">
        <div className="flex items-center gap-2">
          <UserRound className="h-5 w-5 text-orange-600" />
          <h2 className="text-lg font-semibold">Contacts & Decision-Makers</h2>
        </div>
        <div className="mt-4 space-y-3">
          {contacts.length ? contacts.map((contact) => (
            <article key={contact.id} className="rounded-md border border-slate-200 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-950">{contact.fullName}</p>
                  <p className="mt-1 text-sm text-slate-600">{contact.role || "-"} | {influenceTypeLabels[contact.influenceType]}</p>
                  <p className="mt-1 text-sm text-slate-600">{contact.email || "-"} | {contact.phone || "-"}</p>
                </div>
                {contact.isDecisionMaker ? <span className="rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700">Decision-maker</span> : null}
              </div>
              {contact.notes ? <p className="mt-3 whitespace-pre-line text-sm text-slate-700">{contact.notes}</p> : null}
            </article>
          )) : (
            <EmptyState title="No contacts yet" message="Add decision-makers, champions, finance contacts and blockers for this lead." />
          )}
        </div>
      </section>

      <form action={addContact} className="rounded-lg border border-slate-200 bg-white p-5 shadow-card">
        <h2 className="text-lg font-semibold">Add Contact</h2>
        <label className="mt-4 block text-sm font-medium text-slate-700">Name *<input name="fullName" required className={inputClass} /></label>
        <label className="mt-4 block text-sm font-medium text-slate-700">Role / Title<input name="role" className={inputClass} /></label>
        <label className="mt-4 block text-sm font-medium text-slate-700">Email<input name="email" type="email" className={inputClass} /></label>
        <label className="mt-4 block text-sm font-medium text-slate-700">Phone<input name="phone" className={inputClass} /></label>
        <label className="mt-4 block text-sm font-medium text-slate-700">
          Influence Type
          <select name="influenceType" className={inputClass}>
            {Object.entries(influenceTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label className="mt-4 flex items-center gap-2 text-sm font-medium text-slate-700">
          <input name="isDecisionMaker" type="checkbox" className="h-4 w-4 rounded border-slate-300" />
          Decision-maker
        </label>
        <label className="mt-4 block text-sm font-medium text-slate-700">Notes<textarea name="notes" rows={3} className={inputClass} /></label>
        <button className="mt-4 w-full rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700">Save Contact</button>
      </form>
    </div>
  );
}

const inputClass = "mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100";
