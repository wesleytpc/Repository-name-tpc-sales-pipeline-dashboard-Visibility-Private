import { ArrowRight, LockKeyhole, TrendingUp } from "lucide-react";
import { loginPipeline } from "@/lib/actions";

export const dynamic = "force-dynamic";

const inputClass =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100";

export default function LoginPage({
  searchParams,
}: {
  searchParams?: {
    error?: string;
    loggedOut?: string;
  };
}) {
  const errorMessage =
    searchParams?.error === "invalid"
      ? "The username or password is incorrect."
      : searchParams?.error === "not-configured"
        ? "Dashboard access is not configured yet."
        : null;

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center">
        <section className="grid w-full overflow-hidden rounded-xl border border-white/10 bg-white shadow-2xl md:grid-cols-[1.1fr_0.9fr]">
          <div className="bg-slate-950 p-8 text-white sm:p-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-400/40 bg-orange-500/10 px-3 py-1 text-sm font-medium text-orange-200">
              <TrendingUp className="h-4 w-4" />
              TPC Sales Pipeline
            </div>
            <h1 className="mt-8 max-w-xl text-3xl font-semibold tracking-tight sm:text-4xl">
              Track activity, pipeline movement and money in the bank.
            </h1>
            <p className="mt-4 max-w-lg text-sm leading-6 text-slate-300">
              Sign in to view opportunities, client notes, meeting inbox items, reports and the commission workspace.
            </p>
            <div className="mt-10 grid gap-3 text-sm text-slate-300 sm:grid-cols-3">
              <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                <p className="font-semibold text-white">Activity</p>
                <p className="mt-1">Lead, contact and follow-up tracking.</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                <p className="font-semibold text-white">Movement</p>
                <p className="mt-1">Stage progress and proposal visibility.</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                <p className="font-semibold text-white">Revenue</p>
                <p className="mt-1">Payments, reports and final wins.</p>
              </div>
            </div>
          </div>

          <div className="p-8 text-slate-950 sm:p-10">
            <div className="flex items-center gap-3">
              <div className="rounded-md bg-orange-50 p-2 text-orange-600">
                <LockKeyhole className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Sign In</h2>
                <p className="text-sm text-slate-600">Use your dashboard login details.</p>
              </div>
            </div>

            {searchParams?.loggedOut ? (
              <p className="mt-5 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm font-medium text-green-700">
                You have been logged out.
              </p>
            ) : null}
            {errorMessage ? (
              <p className="mt-5 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{errorMessage}</p>
            ) : null}

            <form action={loginPipeline} className="mt-6 space-y-4">
              <div>
                <label htmlFor="username" className="text-sm font-medium text-slate-700">
                  Username
                </label>
                <input id="username" name="username" required autoComplete="username" className={`${inputClass} mt-2`} />
              </div>
              <div>
                <label htmlFor="password" className="text-sm font-medium text-slate-700">
                  Password
                </label>
                <input id="password" name="password" type="password" required autoComplete="current-password" className={`${inputClass} mt-2`} />
              </div>
              <button className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-700">
                Sign In
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
