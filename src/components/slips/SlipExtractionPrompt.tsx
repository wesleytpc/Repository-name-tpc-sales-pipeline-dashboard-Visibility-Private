"use client";

import { useState } from "react";
import { Check, ClipboardCopy } from "lucide-react";

export function SlipExtractionPrompt({ prompt }: { prompt: string }) {
  const [copied, setCopied] = useState(false);

  async function copyPrompt() {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">ChatGPT Extraction Prompt</h3>
          <p className="mt-1 text-sm text-slate-600">
            Copy this prompt into ChatGPT with your receipt photos, then paste the CSV result into the import box below.
          </p>
        </div>
        <button
          type="button"
          onClick={copyPrompt}
          className="inline-flex items-center gap-2 rounded-md bg-orange-600 px-3 py-2 text-sm font-medium text-white hover:bg-orange-700"
        >
          {copied ? <Check className="h-4 w-4" /> : <ClipboardCopy className="h-4 w-4" />}
          {copied ? "Copied" : "Copy Prompt"}
        </button>
      </div>
      <textarea
        readOnly
        value={prompt}
        rows={14}
        className="mt-4 w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 font-mono text-xs leading-5 text-slate-800 outline-none"
      />
    </section>
  );
}
