"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Opportunity } from "@prisma/client";
import { calculateWeightedValue, getStageLabel, pipelineStages } from "@/lib/pipeline";
import { formatCurrency } from "@/lib/format";

const colours = ["#f97316", "#111827", "#64748b", "#94a3b8", "#22c55e", "#2563eb", "#ef4444"];

export function PipelineCharts({ opportunities }: { opportunities: Opportunity[] }) {
  const active = opportunities.filter((item) => item.status === "ACTIVE");

  const byStage = pipelineStages.map((stage) => ({
    stage: getStageLabel(stage),
    value: active.filter((item) => item.stage === stage).reduce((sum, item) => sum + item.estimatedValue, 0),
  })).filter((item) => item.value > 0);

  const byIndustry = Object.values(active.reduce<Record<string, { name: string; count: number }>>((acc, item) => {
    const key = item.industry || "Unspecified";
    acc[key] = acc[key] ?? { name: key, count: 0 };
    acc[key].count += 1;
    return acc;
  }, {}));

  const byProduct = Object.values(active.reduce<Record<string, { product: string; value: number }>>((acc, item) => {
    const key = item.product || "Unspecified";
    acc[key] = acc[key] ?? { product: key, value: 0 };
    acc[key].value += calculateWeightedValue(item.estimatedValue, item.probability);
    return acc;
  }, {}));

  const closedByMonth = Object.values(opportunities.filter((item) => item.status === "WON" || item.stage === "PAYMENT_RECEIVED").reduce<Record<string, { month: string; value: number }>>((acc, item) => {
    const date = item.expectedCloseDate ?? item.updatedAt;
    const key = new Intl.DateTimeFormat("en-ZA", { month: "short", year: "2-digit" }).format(new Date(date));
    acc[key] = acc[key] ?? { month: key, value: 0 };
    acc[key].value += item.estimatedValue;
    return acc;
  }, {}));

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <ChartCard title="Pipeline Value by Stage">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={byStage}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="stage" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={80} />
            <YAxis tickFormatter={(value) => `R${Number(value) / 1000}k`} tick={{ fontSize: 12 }} />
            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
            <Bar dataKey="value" fill="#f97316" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
      <ChartCard title="Opportunities by Industry">
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie data={byIndustry} dataKey="count" nameKey="name" outerRadius={95} label>
              {byIndustry.map((_, index) => <Cell key={index} fill={colours[index % colours.length]} />)}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>
      <ChartCard title="Weighted Value by Product">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={byProduct}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="product" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={70} />
            <YAxis tickFormatter={(value) => `R${Number(value) / 1000}k`} tick={{ fontSize: 12 }} />
            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
            <Bar dataKey="value" fill="#111827" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
      <ChartCard title="Monthly Closed Revenue">
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={closedByMonth}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tickFormatter={(value) => `R${Number(value) / 1000}k`} tick={{ fontSize: 12 }} />
            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
            <Line type="monotone" dataKey="value" stroke="#f97316" strokeWidth={3} dot />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-card">
      <h2 className="text-base font-semibold text-slate-950">{title}</h2>
      <div className="mt-4">{children}</div>
    </div>
  );
}
