"use client";

import { useMemo, useState } from "react";
import Papa from "papaparse";
import { importOpportunities } from "@/lib/actions";
import { CsvOpportunityRow, normaliseCsvRows, sampleCsv } from "@/lib/csv";
import { getStageLabel } from "@/lib/pipeline";
import { formatCurrency } from "@/lib/format";

export function CsvImportForm() {
  const [rows, setRows] = useState<ReturnType<typeof normaliseCsvRows>>([]);
  const [error, setError] = useState("");

  const validRows = useMemo(() => rows.filter((row) => row.valid), [rows]);

  function parseFile(file: File) {
    setError("");
    Papa.parse<CsvOpportunityRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        if (result.errors.length) {
          setError(result.errors[0]?.message ?? "CSV parsing failed");
          return;
        }
        setRows(normaliseCsvRows(result.data));
      },
      error: (parseError) => setError(parseError.message),
    });
  }

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-card">
        <h2 className="text-lg font-semibold">Import Opportunities</h2>
        <p className="mt-1 text-sm text-slate-600">Upload a CSV, review the preview and warnings, then import valid rows.</p>
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) parseFile(file);
          }}
          className="mt-4 block w-full rounded-md border border-slate-300 p-2 text-sm"
        />
        {error ? <p className="mt-3 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-card">
        <h2 className="text-lg font-semibold">Sample CSV Format</h2>
        <pre className="mt-3 overflow-x-auto rounded-md bg-slate-950 p-4 text-xs text-white">{sampleCsv}</pre>
      </div>

      {rows.length ? (
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Preview</h2>
              <p className="text-sm text-slate-600">{validRows.length} valid rows from {rows.length} total rows.</p>
            </div>
            <form action={importOpportunities}>
              <input
                type="hidden"
                name="rows"
                value={JSON.stringify(validRows.map((row) => ({
                  ...row.data,
                  expectedCloseDate: row.data.expectedCloseDate?.toISOString() ?? null,
                  nextStepDate: row.data.nextStepDate?.toISOString() ?? null,
                  lastContactDate: row.data.lastContactDate?.toISOString() ?? null,
                })))}
              />
              <button disabled={!validRows.length} className="rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-slate-300">
                Import Valid Rows
              </button>
            </form>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  {["Row", "Company", "Stage", "Value", "Status", "Warnings"].map((header) => <th key={header} className="px-4 py-3">{header}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row) => (
                  <tr key={row.rowNumber}>
                    <td className="px-4 py-3">{row.rowNumber}</td>
                    <td className="px-4 py-3 font-medium">{row.data.companyName || "-"}</td>
                    <td className="px-4 py-3">{getStageLabel(row.data.stage)}</td>
                    <td className="px-4 py-3">{formatCurrency(row.data.estimatedValue)}</td>
                    <td className="px-4 py-3">{row.data.status.replace("_", " ")}</td>
                    <td className={`px-4 py-3 ${row.valid ? "text-slate-600" : "text-red-700"}`}>{row.warnings.join("; ") || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
