"use client";

import { useState } from "react";
import { Check, ClipboardCopy, ClipboardList } from "lucide-react";

export function CopyPromptCard({ title, description, prompt }: { title: string; description: string; prompt: string }) {
  const [copied, setCopied] = useState(false);

  async function copyPrompt() {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-orange-600" />
            <h3 className="text-lg font-semibold">{title}</h3>
          </div>
          <p className="mt-2 text-sm text-slate-600">{description}</p>
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
      <pre className="mt-4 max-h-[520px] overflow-auto rounded-md bg-slate-950 p-4 text-xs leading-5 text-white">
        {prompt}
      </pre>
    </div>
  );
}
