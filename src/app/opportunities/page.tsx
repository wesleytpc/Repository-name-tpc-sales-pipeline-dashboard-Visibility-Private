import Link from "next/link";
import { Download, Plus, Upload } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { OpportunityTable } from "@/components/OpportunityTable";

export const dynamic = "force-dynamic";

export default async function OpportunitiesPage() {
  const opportunities = await prisma.opportunity.findMany({ orderBy: { updatedAt: "desc" } });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Opportunities</h2>
          <p className="mt-1 text-sm text-slate-600">Track activity, pipeline movement and commercial outcomes.</p>
        </div>
        <div className="flex gap-2">
          <a href="/api/opportunities/export" className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            <Download className="h-4 w-4" /> Export CSV
          </a>
          <Link href="/import" className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            <Upload className="h-4 w-4" /> Import CSV
          </Link>
          <Link href="/opportunities/new" className="inline-flex items-center gap-2 rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700">
            <Plus className="h-4 w-4" /> Add Opportunity
          </Link>
        </div>
      </div>
      <OpportunityTable opportunities={opportunities} />
    </div>
  );
}
