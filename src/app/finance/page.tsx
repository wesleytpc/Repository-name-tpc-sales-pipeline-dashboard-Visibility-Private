import { KeyRound, Lock, Percent, Plus, ShieldCheck, UsersRound, WalletCards } from "lucide-react";
import { DashboardCard } from "@/components/DashboardCard";
import { createSalesperson, lockFinanceArea, unlockFinanceArea } from "@/lib/actions";
import { hasFinanceAccess } from "@/lib/finance-auth";
import { formatDate, formatPercent } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const inputClass =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100";

async function ensureDefaultSalespeople() {
  await Promise.all([
    prisma.salesperson.upsert({
      where: { slug: "wesley" },
      update: {},
      create: {
        slug: "wesley",
        fullName: "Wesley",
        defaultCommissionRate: 0,
        notes: "Commission profile for Wesley. Final commission rules to be added once the contract structure is confirmed.",
      },
    }),
    prisma.salesperson.upsert({
      where: { slug: "helena" },
      update: {},
      create: {
        slug: "helena",
        fullName: "Helena",
        defaultCommissionRate: 0,
        notes: "Commission profile for Helena. Final commission rules to be added once the contract structure is confirmed.",
      },
    }),
  ]);
}

export default async function FinancePage({
  searchParams,
}: {
  searchParams?: {
    pin?: string;
  };
}) {
  const canViewFinance = hasFinanceAccess();

  if (!canViewFinance) {
    return (
      <div className="mx-auto max-w-md space-y-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Finance</h2>
          <p className="mt-1 text-sm text-slate-600">Enter the 4-digit Finance PIN to view commission profiles.</p>
        </div>

        <form action={unlockFinanceArea} className="rounded-lg border border-slate-200 bg-white p-5 shadow-card">
          <div className="flex items-center gap-2">
            <div className="rounded-md bg-orange-50 p-2 text-orange-600">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Finance PIN</h3>
              <p className="text-sm text-slate-600">This protects the commission area from casual viewing.</p>
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
            Unlock Finance
          </button>
        </form>

        <section className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">
          Set the PIN in your `.env` file with `FINANCE_PIN="1234"`. Change `1234` to your own 4-digit number.
        </section>
      </div>
    );
  }

  await ensureDefaultSalespeople();

  const salespeople = await prisma.salesperson.findMany({
    orderBy: [{ status: "asc" }, { fullName: "asc" }],
  });

  const activeCount = salespeople.filter((person) => person.status === "ACTIVE").length;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Finance</h2>
            <p className="mt-1 text-sm text-slate-600">
              Private commission profile area for tracking who earns commission and preparing the future commission structure.
            </p>
          </div>
          <form action={lockFinanceArea}>
            <button className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              <Lock className="h-4 w-4" />
              Lock Finance
            </button>
          </form>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <DashboardCard title="Commission Profiles" value={salespeople.length} icon={UsersRound} note="Salespeople set up for future commission tracking." />
        <DashboardCard title="Active Profiles" value={activeCount} icon={ShieldCheck} note="Profiles currently available for commission calculations." />
        <DashboardCard title="Default Rate" value={formatPercent(0)} icon={Percent} note="Rates are intentionally pending until the commission contract is confirmed." />
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">Commission Profiles</h3>
            <p className="mt-1 text-sm text-slate-600">
              Wesley and Helena are set up now. Later we can connect profiles to deals, products, deposits, subscriptions and monthly payouts.
            </p>
          </div>
          <div className="rounded-md bg-orange-50 p-2 text-orange-600">
            <WalletCards className="h-5 w-5" />
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {salespeople.map((person) => (
            <article key={person.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-base font-semibold text-slate-950">{person.fullName}</h4>
                  <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500">{person.status.replace(/_/g, " ")}</p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-slate-800 ring-1 ring-slate-200">
                  {formatPercent(person.defaultCommissionRate)}
                </span>
              </div>
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="font-medium text-slate-500">Email</dt>
                  <dd className="mt-1 text-slate-900">{person.email || "-"}</dd>
                </div>
                <div>
                  <dt className="font-medium text-slate-500">Phone</dt>
                  <dd className="mt-1 text-slate-900">{person.phone || "-"}</dd>
                </div>
                <div>
                  <dt className="font-medium text-slate-500">Created</dt>
                  <dd className="mt-1 text-slate-900">{formatDate(person.createdAt)}</dd>
                </div>
                <div>
                  <dt className="font-medium text-slate-500">Updated</dt>
                  <dd className="mt-1 text-slate-900">{formatDate(person.updatedAt)}</dd>
                </div>
              </dl>
              {person.notes ? <p className="mt-4 whitespace-pre-line text-sm text-slate-700">{person.notes}</p> : null}
            </article>
          ))}
        </div>
      </section>

      <form action={createSalesperson} className="rounded-lg border border-slate-200 bg-white p-5 shadow-card">
        <div className="flex items-center gap-2">
          <Plus className="h-5 w-5 text-orange-600" />
          <h3 className="text-lg font-semibold">Add Future Salesperson</h3>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <input name="fullName" required placeholder="Salesperson name" className={inputClass} />
          <input name="email" type="email" placeholder="Email" className={inputClass} />
          <input name="phone" placeholder="Phone" className={inputClass} />
          <input name="defaultCommissionRate" type="number" min="0" max="100" step="0.1" placeholder="Default commission %" className={inputClass} />
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-[200px_1fr]">
          <select name="status" defaultValue="ACTIVE" className={inputClass}>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
          <textarea name="notes" rows={3} placeholder="Notes about future commission rules, products or payment terms." className={inputClass} />
        </div>
        <button className="mt-3 rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700">Add Profile</button>
      </form>

      <section className="rounded-lg border border-orange-200 bg-orange-50 p-5">
        <h3 className="text-base font-semibold text-orange-950">Commission Structure To Add Next</h3>
        <p className="mt-2 text-sm text-orange-950">
          Once the contract is confirmed, this area can calculate commissions by product, salesperson, payment type, deposit, subscription month,
          development milestone and final payment received.
        </p>
      </section>
    </div>
  );
}
