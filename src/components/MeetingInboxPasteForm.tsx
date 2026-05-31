"use client";

import { useRef, useState } from "react";
import { Inbox } from "lucide-react";
import { createMeetingInboxNote } from "@/lib/actions";

export function MeetingInboxPasteForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [submitting, setSubmitting] = useState(false);

  return (
    <form
      ref={formRef}
      action={createMeetingInboxNote}
      onSubmit={() => {
        setSubmitting(true);
        window.setTimeout(() => formRef.current?.reset(), 100);
      }}
      className="rounded-lg border border-slate-200 bg-white p-5 shadow-card"
    >
      <div className="flex items-center gap-2">
        <Inbox className="h-5 w-5 text-orange-600" />
        <h3 className="text-lg font-semibold">Paste New Meeting Note</h3>
      </div>
      <p className="mt-2 text-sm text-slate-600">
        On iPhone, dictate into your dedicated ChatGPT chat, copy the structured output, then paste it here.
      </p>
      <textarea
        name="rawText"
        required
        rows={18}
        placeholder="Paste TPC_MEETING_NOTE_V1 output here..."
        className="mt-4 w-full rounded-md border border-slate-300 p-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
      />
      <button
        disabled={submitting}
        className="mt-4 w-full rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {submitting ? "Saving..." : "Save to Inbox"}
      </button>
    </form>
  );
}
