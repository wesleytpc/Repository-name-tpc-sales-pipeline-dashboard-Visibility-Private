import type { PaymentSchedule } from "@prisma/client";
import { CalendarClock } from "lucide-react";
import { createPaymentSchedule } from "@/lib/actions";
import { formatCurrency, formatDate } from "@/lib/format";
import { paymentScheduleStatusLabels } from "@/lib/sales-options";
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

export function PaymentScheduleList({ opportunityId, schedules }: { opportunityId: string; schedules: PaymentSchedule[] }) {
  const addSchedule = createPaymentSchedule.bind(null, opportunityId);
  const expectedTotal = schedules.filter((item) => item.status !== "CANCELLED").reduce((sum, item) => sum + item.expectedAmount, 0);

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-orange-600" />
            <h2 className="text-lg font-semibold">Payment Schedule</h2>
          </div>
          <span className="rounded-md bg-orange-50 px-3 py-2 text-sm font-semibold text-orange-700">Expected: {formatCurrency(expectedTotal)}</span>
        </div>
        <div className="mt-4 space-y-3">
          {schedules.length ? schedules.map((schedule) => (
            <article key={schedule.id} className="rounded-md border border-slate-200 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-950">{schedule.paymentType.replace(/_/g, " ")}</p>
                  <p className="mt-1 text-sm text-slate-600">Due: {formatDate(schedule.dueDate)} | {paymentScheduleStatusLabels[schedule.status]}</p>
                </div>
                <p className="font-semibold text-slate-950">{formatCurrency(schedule.expectedAmount)}</p>
              </div>
              {schedule.notes ? <p className="mt-3 whitespace-pre-line text-sm text-slate-700">{schedule.notes}</p> : null}
            </article>
          )) : (
            <EmptyState title="No payment schedule yet" message="Add expected deposits, milestone payments, retainers or subscription payments." />
          )}
        </div>
      </section>

      <form action={addSchedule} className="rounded-lg border border-slate-200 bg-white p-5 shadow-card">
        <h2 className="text-lg font-semibold">Add Expected Payment</h2>
        <label className="mt-4 block text-sm font-medium text-slate-700">
          Payment Type
          <select name="paymentType" className={inputClass}>{paymentTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
        </label>
        <label className="mt-4 block text-sm font-medium text-slate-700">Expected Amount<input name="expectedAmount" required type="number" min="0.01" step="0.01" className={inputClass} /></label>
        <label className="mt-4 block text-sm font-medium text-slate-700">Due Date<input name="dueDate" type="date" className={inputClass} /></label>
        <label className="mt-4 block text-sm font-medium text-slate-700">
          Status
          <select name="status" className={inputClass}>{Object.entries(paymentScheduleStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
        </label>
        <label className="mt-4 block text-sm font-medium text-slate-700">Notes<textarea name="notes" rows={4} className={inputClass} /></label>
        <button className="mt-4 w-full rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700">Save Schedule</button>
      </form>
    </div>
  );
}

const inputClass = "mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100";
