"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Opportunity } from "@prisma/client";
import { calculateWeightedValue, getStageBadgeClass, getStageLabel, normaliseVisibleStage, visiblePipelineStages } from "@/lib/pipeline";
import { formatCurrency, formatDate, formatPercent } from "@/lib/format";
import { DeleteLeadButton } from "@/components/DeleteLeadButton";
import { EmptyState } from "@/components/EmptyState";

const allStages = visiblePipelineStages;

export function OpportunityTable({ opportunities }: { opportunities: Opportunity[] }) {
  const [search, setSearch] = useState("");
  const [stage, setStage] = useState("");
  const [status, setStatus] = useState("");
  const [industry, setIndustry] = useState("");
  const [product, setProduct] = useState("");

  const industries = useMemo(() => Array.from(new Set(opportunities.map((item) => item.industry).filter(Boolean))) as string[], [opportunities]);
  const products = useMemo(() => Array.from(new Set(opportunities.map((item) => item.product).filter(Boolean))) as string[], [opportunities]);

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return opportunities.filter((item) => {
      const searchable = [item.companyName, item.contactName, item.industry, item.product].join(" ").toLowerCase();
      return (!term || searchable.includes(term))
        && (!stage || normaliseVisibleStage(item.stage) === stage)
        && (!status || item.status === status)
        && (!industry || item.industry === industry)
        && (!product || item.product === product);
    });
  }, [opportunities, search, stage, status, industry, product]);

  if (!opportunities.length) {
    return <EmptyState message="No leads found. Add your first lead or import a CSV file." actionHref="/opportunities/new" actionLabel="Add Lead" />;
  }

  const filterClass = "rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100";

  return (
    <div className="space-y-4">
      <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-5">
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search leads" className={filterClass} />
        <select value={stage} onChange={(event) => setStage(event.target.value)} className={filterClass}>
          <option value="">All stages</option>
          {allStages.map((item) => <option key={item} value={item}>{getStageLabel(item)}</option>)}
        </select>
        <select value={status} onChange={(event) => setStatus(event.target.value)} className={filterClass}>
          <option value="">All statuses</option>
          {["ACTIVE", "WON", "LOST", "ON_HOLD"].map((item) => <option key={item} value={item}>{item.replace("_", " ")}</option>)}
        </select>
        <select value={industry} onChange={(event) => setIndustry(event.target.value)} className={filterClass}>
          <option value="">All industries</option>
          {industries.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select value={product} onChange={(event) => setProduct(event.target.value)} className={filterClass}>
          <option value="">All products</option>
          {products.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </div>

      {filtered.length ? (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-card">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                {["Company Name", "Contact Person", "Industry", "Product", "Stage", "Estimated Value", "Probability", "Weighted Value", "Next Step", "Next Step Date", "Status", "Actions"].map((header) => (
                  <th key={header} className="px-4 py-3 font-semibold">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((item) => (
                <tr key={item.id} className="align-top hover:bg-slate-50">
                  <td className="whitespace-nowrap px-4 py-3 font-medium">
                    <Link href={`/opportunities/${item.id}`} className="text-slate-950 hover:text-orange-700">{item.companyName}</Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{item.contactName || "-"}</td>
                  <td className="px-4 py-3 text-slate-600">{item.industry || "-"}</td>
                  <td className="px-4 py-3 text-slate-600">{item.product || "-"}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${getStageBadgeClass(item.stage)}`}>{getStageLabel(item.stage)}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{formatCurrency(item.estimatedValue)}</td>
                  <td className="px-4 py-3 text-slate-700">{formatPercent(item.probability)}</td>
                  <td className="px-4 py-3 text-slate-700">{formatCurrency(calculateWeightedValue(item.estimatedValue, item.probability))}</td>
                  <td className="min-w-48 px-4 py-3 text-slate-600">{item.nextStep || "-"}</td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(item.nextStepDate)}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-700">{item.status.replace("_", " ")}</span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link className="text-sm font-medium text-orange-700 hover:text-orange-800" href={`/opportunities/${item.id}`}>View</Link>
                      <Link className="text-sm font-medium text-slate-700 hover:text-slate-950" href={`/opportunities/${item.id}/edit`}>Edit</Link>
                      <DeleteLeadButton id={item.id} companyName={item.companyName} compact />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title="No search results" message="No leads match the current search and filters." />
      )}
    </div>
  );
}
