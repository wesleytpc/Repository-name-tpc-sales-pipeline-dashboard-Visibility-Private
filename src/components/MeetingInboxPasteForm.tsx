"use client";

import { useEffect, useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Inbox } from "lucide-react";
import { createMeetingInboxNote, type MeetingInboxSaveState } from "@/lib/actions";

const initialState: MeetingInboxSaveState = {
  status: "idle",
  message: "",
};

export function MeetingInboxPasteForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useFormState(createMeetingInboxNote, initialState);

  useEffect(() => {
    if (state.status === "saved") {
      formRef.current?.reset();
    }
  }, [state.status]);

  return (
    <form
      ref={formRef}
      action={formAction}
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
      {state.message ? (
        <p className={`mt-3 rounded-md border px-3 py-2 text-sm font-medium ${
          state.status === "saved"
            ? "border-green-200 bg-green-50 text-green-700"
            : state.status === "duplicate"
              ? "border-orange-200 bg-orange-50 text-orange-700"
              : "border-red-200 bg-red-50 text-red-700"
        }`}>
          {state.message}
        </p>
      ) : null}
      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      disabled={pending}
      className="mt-4 w-full rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-slate-400"
    >
      {pending ? "Saving..." : "Save to Inbox"}
    </button>
  );
}
