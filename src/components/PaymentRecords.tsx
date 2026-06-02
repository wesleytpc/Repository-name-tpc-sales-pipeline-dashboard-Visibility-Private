import type { PaymentRecord } from "@prisma/client";
import { Banknote, CalendarDays, ReceiptText } from "lucide-react";
import { createPaymentRecord } from "@/lib/actions";
import { formatCurrency, formatDate } from "@/lib/format";
import { EmptyState } from "@/components/EmptyState";

const paymentTypes = [
  ["DEPOSIT", "Deposit"],
  ["DEVELOPMENT_MILESTONE", "Development Milestone"],
  ["SUBSCRIPTION", "Subscription"],
  ["RETAINER", "Retainer"],
  ["FINAL_PAYMENT", "Final Payment"],
  ["PART_PAYMENT", "Part Payment"],
  ["OTHER", "Other"],
] as const;

export function PaymentRecords({
  opportunityId,
  paymentRecords,
}: {
  opportunityId: string;
  paymentRecords: PaymentRecord[];
}) {
  const addPaymentRecord = createPaymentRecord.bind(null, opportunityId);
  const totalReceived = paymentRecords.reduce((sum, payment) => sum + payment.amount, 0);

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Banknote className="h-5 w-5 text-green-600" />
            <h2 className="text-lg font-semibold">Incoming Payments</h2>
          </div>
          <div className="rounded-md bg-green-50 px-3 py-2 text-sm font-semibold text-green-700">
            Received: {formatCurrency(totalReceived)}
          </div>
        </div>

        <p className="mt-2 text-sm text-slate-600">
          Track money already received against this lead, even when the full deal is still in progress.
        </p>

        <div className="mt-4 space-y-3">
          {paymentRecords.length ? (
            paymentRecords.map((payment) => (
              <article key={payment.id} className="rounded-md border border-slate-200 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-slate-950">{formatCurrency(payment.amount)}</p>
                    <p className="mt-1 text-sm font-medium text-slate-700">{payment.paymentType.replace(/_/g, " ")}</p>
                  </div>
                  <p className="flex items-center gap-2 text-xs text-slate-500">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {formatDate(payment.receivedDate)}
                  </p>
                </div>
                {payment.reference ? (
                  <p className="mt-3 flex items-center gap-2 text-sm text-slate-600">
                    <ReceiptText className="h-4 w-4 text-slate-400" />
                    {payment.reference}
                  </p>
                ) : null}
                {payment.notes ? <p className="mt-3 whitespace-pre-line text-sm text-slate-700">{payment.notes}</p> : null}
              </article>
            ))
          ) : (
            <EmptyState
              title="No payments recorded"
              message="Add deposits, development milestones, subscriptions or final payments as money comes in."
            />
          )}
        </div>
      </div>

      <form action={addPaymentRecord} className="rounded-lg border border-slate-200 bg-white p-5 shadow-card">
        <h2 className="text-lg font-semibold">Add Payment</h2>
        <p className="mt-1 text-sm text-slate-600">Use this for deposits, subscriptions, milestones and other funds received.</p>

        <label className="mt-4 block text-sm font-medium text-slate-700">
          Payment Type
          <select name="paymentType" className={inputClass}>
            {paymentTypes.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>

        <label className="mt-4 block text-sm font-medium text-slate-700">
          Amount Received *
          <input name="amount" type="number" min="0.01" step="0.01" required className={inputClass} />
        </label>

        <label className="mt-4 block text-sm font-medium text-slate-700">
          Date Received
          <input name="receivedDate" type="date" className={inputClass} />
        </label>

        <label className="mt-4 block text-sm font-medium text-slate-700">
          Reference
          <input name="reference" placeholder="Invoice, PO, bank ref, subscription ref" className={inputClass} />
        </label>

        <label className="mt-4 block text-sm font-medium text-slate-700">
          Notes
          <textarea name="notes" rows={4} placeholder="Deposit paid, first month received, milestone one paid, etc." className={inputClass} />
        </label>

        <button type="submit" className="mt-4 w-full rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700">
          Save Payment
        </button>
      </form>
    </div>
  );
}

const inputClass = "mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100";
