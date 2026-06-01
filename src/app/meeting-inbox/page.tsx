import { Archive, CheckCircle2, PlusCircle, Trash2 } from "lucide-react";
import { CopyPromptCard } from "@/components/CopyPromptCard";
import { MeetingInboxPasteForm } from "@/components/MeetingInboxPasteForm";
import { prisma } from "@/lib/prisma";
import { applyMeetingInboxNote, archiveMeetingInboxNote, createOpportunityFromInboxNote, deleteMeetingInboxNote } from "@/lib/actions";
import { chatGptMeetingTemplate, parseMeetingInboxNote, type ParsedMeetingInboxNote } from "@/lib/meeting-inbox";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function MeetingInboxPage({
  searchParams,
}: {
  searchParams?: {
    saved?: string;
    duplicate?: string;
  };
}) {
  const [notes, opportunities] = await Promise.all([
    prisma.meetingInboxNote.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.opportunity.findMany({ orderBy: { companyName: "asc" }, select: { id: true, companyName: true, stage: true } }),
  ]);

  const attentionCount = notes.filter((note) => ["UNPROCESSED", "NEEDS_REVIEW"].includes(note.status)).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Meeting Inbox</h2>
          <p className="mt-1 text-sm text-slate-600">
            Paste structured ChatGPT meeting notes here, review them, then apply them safely to the correct client lead.
          </p>
        </div>
        <div className="rounded-md bg-orange-50 px-3 py-2 text-sm font-semibold text-orange-700">
          {attentionCount} need attention
        </div>
      </div>

      {searchParams?.saved ? (
        <p className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
          Meeting note saved to the inbox.
        </p>
      ) : null}
      {searchParams?.duplicate ? (
        <p className="rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-medium text-orange-700">
          This exact meeting note is already in the inbox, so it was not added again.
        </p>
      ) : null}

      <section className="grid gap-5 lg:grid-cols-[1fr_420px]">
        <MeetingInboxPasteForm />

        <CopyPromptCard
          title="ChatGPT Starting Prompt"
          description="Paste this once into your dedicated ChatGPT sales meeting chat."
          prompt={chatGptMeetingTemplate}
        />
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-card">
        <h3 className="text-lg font-semibold">Inbox Notes</h3>
        <div className="mt-4 space-y-4">
          {notes.length ? notes.map((note) => (
            <InboxNoteCard key={note.id} note={note} opportunities={opportunities} />
          )) : (
            <div className="rounded-md border border-dashed border-slate-300 p-8 text-center text-sm text-slate-600">
              No meeting inbox notes yet.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function InboxNoteCard({
  note,
  opportunities,
}: {
  note: {
    id: string;
    rawText: string;
    parsedJson: unknown;
    status: string;
    matchedOpportunityId: string | null;
    warning: string | null;
    createdAt: Date;
    appliedAt: Date | null;
  };
  opportunities: Array<{ id: string; companyName: string; stage: string }>;
}) {
  const parsed = (note.parsedJson as ParsedMeetingInboxNote | null) ?? parseMeetingInboxNote(note.rawText);
  const applyAction = applyMeetingInboxNote.bind(null, note.id);
  const createAction = createOpportunityFromInboxNote.bind(null, note.id);
  const archiveAction = archiveMeetingInboxNote.bind(null, note.id);
  const deleteAction = deleteMeetingInboxNote.bind(null, note.id);
  const inactive = ["APPLIED", "ARCHIVED"].includes(note.status);

  return (
    <article className="rounded-lg border border-slate-200 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-semibold text-slate-950">{parsed.client || "Unmatched client"}</h4>
            <StatusBadge status={note.status} />
          </div>
          <p className="mt-1 text-xs text-slate-500">Captured {formatDate(note.createdAt)} {note.appliedAt ? `| Applied ${formatDate(note.appliedAt)}` : ""}</p>
        </div>
        {note.warning ? <span className="rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700">{note.warning}</span> : null}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <PreviewBlock label="Meeting Date" value={parsed.meetingDate} />
        <PreviewBlock label="Stage Suggestion" value={parsed.stageSuggestion?.replace(/_/g, " ")} />
        <PreviewBlock label="Attendees" value={parsed.attendees?.join(", ")} />
        <PreviewBlock label="Tasks" value={parsed.tasks?.map((task) => task.title).join("\n")} />
      </div>

      <PreviewBlock className="mt-3" label="Summary" value={parsed.summary} />
      <PreviewBlock className="mt-3" label="Customer Notes" value={parsed.customerNotes || parsed.paymentSignals} />

      {!inactive ? (
        <div className="mt-4 flex flex-col gap-3 border-t border-slate-200 pt-4 md:flex-row md:items-end">
          <form action={applyAction} className="flex flex-1 flex-col gap-2 md:flex-row md:items-end">
            <label className="flex-1 text-sm font-medium text-slate-700">
              Apply to Lead
              <select name="opportunityId" defaultValue={note.matchedOpportunityId ?? ""} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
                <option value="">Choose client</option>
                {opportunities.map((opportunity) => (
                  <option key={opportunity.id} value={opportunity.id}>{opportunity.companyName}</option>
                ))}
              </select>
            </label>
            <button className="inline-flex items-center justify-center gap-2 rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700">
              <CheckCircle2 className="h-4 w-4" />
              Apply to Pipeline
            </button>
          </form>
          <form action={createAction} className="rounded-md border border-orange-200 bg-orange-50 p-3 md:min-w-[320px]">
            <p className="text-sm font-semibold text-orange-950">Create New Lead</p>
            <div className="mt-2 grid gap-2">
              <input
                name="companyName"
                required
                defaultValue={parsed.client ?? ""}
                placeholder="New client / company name"
                className="w-full rounded-md border border-orange-200 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              />
              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  name="industry"
                  placeholder="Industry"
                  className="w-full rounded-md border border-orange-200 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                />
                <input
                  name="product"
                  placeholder="Product / service"
                  className="w-full rounded-md border border-orange-200 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                />
              </div>
            </div>
            <button className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
              <PlusCircle className="h-4 w-4" />
              Create & Apply
            </button>
          </form>
          <form action={archiveAction}>
            <button className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 md:w-auto">
              <Archive className="h-4 w-4" />
              Archive
            </button>
          </form>
          <form action={deleteAction}>
            <button className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 md:w-auto">
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </form>
        </div>
      ) : null}
      {inactive ? (
        <div className="mt-4 border-t border-slate-200 pt-4">
          <form action={deleteAction}>
            <button className="inline-flex items-center justify-center gap-2 rounded-md border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50">
              <Trash2 className="h-4 w-4" />
              Delete Note
            </button>
          </form>
        </div>
      ) : null}
    </article>
  );
}

function PreviewBlock({ label, value, className = "" }: { label: string; value?: string | null; className?: string }) {
  return (
    <div className={`rounded-md border border-slate-200 bg-slate-50 p-3 ${className}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 whitespace-pre-line text-sm text-slate-700">{value || "-"}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const className =
    status === "APPLIED"
      ? "bg-green-50 text-green-700 border-green-200"
      : status === "NEEDS_REVIEW"
        ? "bg-red-50 text-red-700 border-red-200"
        : status === "ARCHIVED"
          ? "bg-slate-50 text-slate-600 border-slate-200"
          : "bg-orange-50 text-orange-700 border-orange-200";

  return (
    <span className={`rounded-full border px-2 py-1 text-xs font-medium ${className}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}
