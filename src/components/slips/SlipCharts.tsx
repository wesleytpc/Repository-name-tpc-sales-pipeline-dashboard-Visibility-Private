"use client";

import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCurrency } from "@/lib/format";

const colours = ["#ea580c", "#111827", "#64748b", "#16a34a", "#2563eb", "#dc2626", "#ca8a04", "#7c3aed"];

export function SlipCharts({
  categoryData,
  merchantData,
  paymentData,
}: {
  categoryData: Array<{ name: string; value: number }>;
  merchantData: Array<{ name: string; value: number }>;
  paymentData: Array<{ name: string; value: number }>;
}) {
  return (
    <section className="grid gap-4 xl:grid-cols-3">
      <ChartShell title="Spend by Category">
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie data={categoryData} dataKey="value" nameKey="name" outerRadius={90} innerRadius={52} paddingAngle={2}>
              {categoryData.map((entry, index) => (
                <Cell key={entry.name} fill={colours[index % colours.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
          </PieChart>
        </ResponsiveContainer>
      </ChartShell>

      <ChartShell title="Top Shops / Suppliers">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={merchantData} layout="vertical" margin={{ left: 24, right: 12 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" tickFormatter={(value) => `R${Number(value) / 1000}k`} />
            <YAxis type="category" dataKey="name" width={92} tick={{ fontSize: 12 }} />
            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
            <Bar dataKey="value" fill="#ea580c" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartShell>

      <ChartShell title="Payment Method">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={paymentData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tickFormatter={(value) => `R${Number(value) / 1000}k`} />
            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
            <Bar dataKey="value" fill="#111827" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartShell>
    </section>
  );
}

function ChartShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-card">
      <h3 className="text-base font-semibold text-slate-950">{title}</h3>
      <div className="mt-4">{children}</div>
    </div>
  );
}
