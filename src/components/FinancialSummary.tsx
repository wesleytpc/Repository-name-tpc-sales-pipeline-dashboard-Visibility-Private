import type { Opportunity, PaymentRecord, PaymentSchedule } from "@prisma/client";
import { WalletCards } from "lucide-react";
import { formatCurrency } from "@/lib/format";

export function FinancialSummary({
  opportunity,
  paymentRecords,
  paymentSchedules,
}: {
  opportunity: Opportunity;
  paymentRecords: PaymentRecord[];
  paymentSchedules: PaymentSchedule[];
}) {
  const paid = paymentRecords.reduce((sum, payment) => sum + payment.amount, 0);
  const expected = paymentSchedules.filter((item) => item.status !== "CANCELLED").reduce((sum, item) => sum + item.expectedAmount, 0);
  const basis = Math.max(opportunity.estimatedValue, expected);
  const outstanding = Math.max(0, basis - paid);
  const paidPercent = basis > 0 ? Math.round((paid / basis) * 100) : 0;

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-card">
      <div className="flex items-center gap-2">
        <WalletCards className="h-5 w-5 text-green-600" />
        <h2 className="text-lg font-semibold">Financial Position</h2>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Estimated Deal Value" value={formatCurrency(opportunity.estimatedValue)} />
        <Metric label="Expected Scheduled Value" value={formatCurrency(expected)} />
        <Metric label="Paid So Far" value={formatCurrency(paid)} highlight />
        <Metric label="Outstanding Balance" value={formatCurrency(outstanding)} danger={outstanding > 0} />
      </div>
      <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-green-500" style={{ width: `${Math.min(100, paidPercent)}%` }} />
      </div>
      <p className="mt-2 text-sm text-slate-600">{paidPercent}% of the tracked value has been received.</p>
    </section>
  );
}

function Metric({ label, value, highlight, danger }: { label: string; value: string; highlight?: boolean; danger?: boolean }) {
  return (
    <div className={`rounded-md border p-4 ${highlight ? "border-green-200 bg-green-50" : danger ? "border-orange-200 bg-orange-50" : "border-slate-200 bg-slate-50"}`}>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-lg font-semibold text-slate-950">{value}</p>
    </div>
  );
}
