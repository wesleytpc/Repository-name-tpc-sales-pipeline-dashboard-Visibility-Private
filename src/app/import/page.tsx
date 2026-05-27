import { CsvImportForm } from "@/components/CsvImportForm";

export default function ImportPage() {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Import CSV</h2>
        <p className="mt-1 text-sm text-slate-600">Bring pipeline records into the dashboard with row-level validation.</p>
      </div>
      <CsvImportForm />
    </div>
  );
}
