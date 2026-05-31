import Link from "next/link";
import { Download, KeyRound, Lock, LockKeyhole, Plus, ReceiptText, Upload } from "lucide-react";
import { DashboardCard } from "@/components/DashboardCard";
import { SlipCharts } from "@/components/slips/SlipCharts";
import { SlipExtractionPrompt } from "@/components/slips/SlipExtractionPrompt";
import { createSlipReceipt, importSlipReceipts, lockSlipsArea, unlockSlipsArea } from "@/lib/actions";
import { formatCurrency, formatDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { currentMonthKey, monthDateRange, monthLabel, slipCategoryLabels, slipExtractionPrompt, slipPaymentMethodLabels } from "@/lib/slips";
import { hasSlipsAccess } from "@/lib/slips-auth";

export const dynamic = "force-dynamic";

const inputClass =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100";

export default async function SlipsPage({
  searchParams,
}: {
  searchParams?: {
    month?: string;
    pin?: string;
    imported?: string;
  };
}) {
  const canViewSlips = hasSlipsAccess();

  if (!canViewSlips) {
    return (
      <main className="min-h-screen bg-tpc-soft px-4 py-8 text-slate-950">
        <div className="mx-auto max-w-md space-y-6">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Personal Slips</h2>
            <p className="mt-1 text-sm text-slate-600">Enter the 4-digit slips PIN to view personal spend tracking.</p>
          </div>

          <form action={unlockSlipsArea} className="rounded-lg border border-slate-200 bg-white p-5 shadow-card">
            <div className="flex items-center gap-2">
              <div className="rounded-md bg-orange-50 p-2 text-orange-600">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Slips PIN</h3>
                <p className="text-sm text-slate-600">This area is hidden from the business dashboard.</p>
              </div>
            </div>

            <label className="mt-5 block text-sm font-medium text-slate-700" htmlFor="pin">
              4-digit PIN
            </label>
            <input
              id="pin"
              name="pin"
              type="password"
              inputMode="numeric"
              pattern="[0-9]{4}"
              maxLength={4}
              required
              autoComplete="one-time-code"
              className={`${inputClass} mt-2 text-center text-2xl tracking-[0.4em]`}
            />
            {searchParams?.pin === "invalid" ? <p className="mt-3 text-sm font-medium text-red-600">Incorrect PIN. Please try again.</p> : null}
            <button className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700">
              <KeyRound className="h-4 w-4" />
              Unlock Slips
            </button>
          </form>
        </div>
      </main>
    );
  }

  const selectedMonth = searchParams?.month || currentMonthKey();
  const { start, end } = monthDateRange(selectedMonth);
  const receipts = await prisma.slipReceipt.findMany({
    where: {
      receiptDate: {
        gte: start,
        lt: end,
      },
    },
    include: { items: true },
    orderBy: { receiptDate: "desc" },
  });

  const allReceiptMonths = await prisma.slipReceipt.findMany({
    select: { receiptDate: true },
    orderBy: { receiptDate: "desc" },
  });
  const monthOptions = Array.from(new Set([selectedMonth, ...allReceiptMonths.map((receipt) => {
    const date = receipt.receiptDate;
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  })]));

  const totalSpend = receipts.reduce((sum, receipt) => sum + receipt.totalAmount, 0);
  const totalVat = receipts.reduce((sum, receipt) => sum + (receipt.vatAmount ?? 0), 0);
  const averageSlip = receipts.length ? totalSpend / receipts.length : 0;
  const topCategory = topGroup(receipts.map((receipt) => [slipCategoryLabels[receipt.category], receipt.totalAmount]));

  const categoryData = groupValues(receipts.map((receipt) => [slipCategoryLabels[receipt.category], receipt.totalAmount]));
  const merchantData = groupValues(receipts.map((receipt) => [receipt.merchant, receipt.totalAmount])).slice(0, 8);
  const paymentData = groupValues(receipts.map((receipt) => [slipPaymentMethodLabels[receipt.paymentMethod], receipt.totalAmount]));

  return (
    <main className="min-h-screen bg-tpc-soft px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-orange-600">Hidden Personal Area</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">Personal Slips</h2>
          <p className="mt-1 text-sm text-slate-600">
            Capture monthly slips from ChatGPT-extracted receipt data and track household spending by category, supplier and payment method.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/api/slips/export?month=${selectedMonth}`}
            className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Link>
          <form action={lockSlipsArea}>
            <button className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-slate-950 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800">
              <LockKeyhole className="h-4 w-4" />
              Lock Slips
            </button>
          </form>
        </div>
      </div>

      <form className="rounded-lg border border-slate-200 bg-white p-4 shadow-card">
        <label htmlFor="month" className="text-sm font-medium text-slate-700">
          Month
        </label>
        <div className="mt-2 flex flex-wrap gap-2">
          <select id="month" name="month" defaultValue={selectedMonth} className={`${inputClass} max-w-xs`}>
            {monthOptions.map((month) => (
              <option key={month} value={month}>
                {monthLabel(month)}
              </option>
            ))}
          </select>
          <button className="rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700">View Month</button>
        </div>
      </form>

      {searchParams?.imported ? (
        <p className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">Receipt data imported.</p>
      ) : null}

      <section className="grid gap-4 md:grid-cols-4">
        <DashboardCard title="Monthly Spend" value={formatCurrency(totalSpend)} icon={ReceiptText} note={monthLabel(selectedMonth)} />
        <DashboardCard title="Number of Slips" value={receipts.length} icon={ReceiptText} note="Receipts captured for this month." />
        <DashboardCard title="Average Slip" value={formatCurrency(averageSlip)} icon={ReceiptText} note="Average spend per receipt." />
        <DashboardCard title="Top Category" value={topCategory?.name ?? "-"} icon={ReceiptText} note={topCategory ? formatCurrency(topCategory.value) : "No slips yet."} />
      </section>

      <SlipCharts categoryData={categoryData} merchantData={merchantData} paymentData={paymentData} />

      <SlipExtractionPrompt prompt={slipExtractionPrompt} />

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <form action={createSlipReceipt} className="rounded-lg border border-slate-200 bg-white p-5 shadow-card">
          <div className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-orange-600" />
            <h3 className="text-lg font-semibold">Add Slip Manually</h3>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <input name="receiptDate" type="date" className={inputClass} />
            <input name="merchant" required placeholder="Shop / supplier" className={inputClass} />
            <select name="category" defaultValue="GROCERIES" className={inputClass}>
              {Object.entries(slipCategoryLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            <select name="paymentMethod" defaultValue="CARD" className={inputClass}>
              {Object.entries(slipPaymentMethodLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            <input name="totalAmount" required type="number" min="0" step="0.01" placeholder="Total amount" className={inputClass} />
            <input name="vatAmount" type="number" min="0" step="0.01" placeholder="VAT amount" className={inputClass} />
            <input name="capturedBy" placeholder="Captured by" className={inputClass} />
          </div>
          <textarea name="items" rows={4} placeholder="Items bought, one per line" className={`${inputClass} mt-3`} />
          <textarea name="notes" rows={3} placeholder="Notes" className={`${inputClass} mt-3`} />
          <button className="mt-3 rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700">Add Slip</button>
        </form>

        <form action={importSlipReceipts} className="rounded-lg border border-slate-200 bg-white p-5 shadow-card">
          <div className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-orange-600" />
            <h3 className="text-lg font-semibold">Paste ChatGPT / CSV Output</h3>
          </div>
          <p className="mt-2 text-sm text-slate-600">
            Paste CSV or JSON extracted by ChatGPT. Required columns: date, merchant, category, paymentMethod, totalAmount.
          </p>
          <textarea
            name="structuredText"
            rows={12}
            required
            placeholder={"date,merchant,category,paymentMethod,totalAmount,vatAmount,notes,items\n2026-05-31,Checkers,GROCERIES,CARD,842.50,109.89,Monthly groceries,\"Milk; Bread; Chicken\""}
            className={`${inputClass} mt-4 font-mono text-xs`}
          />
          <button className="mt-3 rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700">Import Slips</button>
        </form>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-card">
        <h3 className="text-lg font-semibold">Slips for {monthLabel(selectedMonth)}</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Shop / Supplier</th>
                <th className="px-3 py-2">Category</th>
                <th className="px-3 py-2">Payment</th>
                <th className="px-3 py-2 text-right">Total</th>
                <th className="px-3 py-2 text-right">VAT</th>
                <th className="px-3 py-2">Notes</th>
              </tr>
            </thead>
            <tbody>
              {receipts.map((receipt) => (
                <tr key={receipt.id} className="border-b border-slate-100">
                  <td className="px-3 py-3">{formatDate(receipt.receiptDate)}</td>
                  <td className="px-3 py-3 font-medium text-slate-950">{receipt.merchant}</td>
                  <td className="px-3 py-3">{slipCategoryLabels[receipt.category]}</td>
                  <td className="px-3 py-3">{slipPaymentMethodLabels[receipt.paymentMethod]}</td>
                  <td className="px-3 py-3 text-right font-semibold">{formatCurrency(receipt.totalAmount)}</td>
                  <td className="px-3 py-3 text-right">{receipt.vatAmount ? formatCurrency(receipt.vatAmount) : "-"}</td>
                  <td className="px-3 py-3 text-slate-600">{receipt.notes || receipt.items.map((item) => item.description).join("; ") || "-"}</td>
                </tr>
              ))}
              {!receipts.length ? (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-slate-500">No slips captured for this month yet.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-sm text-slate-500">VAT total for the selected month: {formatCurrency(totalVat)}</p>
      </section>
      </div>
    </main>
  );
}

function groupValues(rows: Array<[string, number]>) {
  const map = new Map<string, number>();
  for (const [name, value] of rows) {
    map.set(name, (map.get(name) ?? 0) + value);
  }
  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

function topGroup(rows: Array<[string, number]>) {
  return groupValues(rows)[0];
}
