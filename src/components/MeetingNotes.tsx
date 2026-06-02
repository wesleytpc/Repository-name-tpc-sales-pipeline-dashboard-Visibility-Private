import type { MeetingAttachment, MeetingNote } from "@prisma/client";
import { CalendarDays, FileText, Link as LinkIcon, Mic2, Trash2, Users } from "lucide-react";
import { createMeetingNote, deleteMeetingNote } from "@/lib/actions";
import { formatDate } from "@/lib/format";
import { EmptyState } from "@/components/EmptyState";

export function MeetingNotes({
  opportunityId,
  meetingNotes,
}: {
  opportunityId: string;
  meetingNotes: Array<MeetingNote & { attachments?: MeetingAttachment[] }>;
}) {
  const addMeetingNote = createMeetingNote.bind(null, opportunityId);

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_420px]">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-card">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-orange-600" />
          <h2 className="text-lg font-semibold">Meeting Summaries & Customer Notes</h2>
        </div>
        <div className="mt-4 space-y-4">
          {meetingNotes.length ? (
            meetingNotes.map((note) => (
              <article key={note.id} className="rounded-lg border border-slate-200 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-slate-950">{note.title || "Client meeting"}</h3>
                    <p className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {formatDate(note.meetingDate)}
                    </p>
                  </div>
                  {note.recordingUrl ? (
                    <a
                      href={note.recordingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <LinkIcon className="h-3.5 w-3.5" />
                      Recording
                    </a>
                  ) : null}
                  <form action={deleteMeetingNote.bind(null, opportunityId, note.id)}>
                    <button className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50">
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </form>
                </div>

                {note.attendees ? (
                  <p className="mt-3 flex items-start gap-2 text-sm text-slate-600">
                    <Users className="mt-0.5 h-4 w-4 text-slate-400" />
                    <span>{note.attendees}</span>
                  </p>
                ) : null}

                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <NoteCell label="Meeting Summary" value={note.summary} />
                  <NoteCell label="Customer Notes" value={note.customerNotes} />
                  <NoteCell label="Next Actions" value={note.nextActions} />
                </div>

                {note.transcript ? (
                  <details className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-3">
                    <summary className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-800">
                      <Mic2 className="h-4 w-4 text-orange-600" />
                      Transcript
                    </summary>
                    <p className="mt-3 max-h-96 overflow-y-auto whitespace-pre-line text-sm leading-6 text-slate-700">
                      {note.transcript}
                    </p>
                  </details>
                ) : null}
                {note.attachments?.length ? (
                  <div className="mt-4 rounded-md border border-slate-200 bg-white p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Uploaded Files</p>
                    <ul className="mt-2 space-y-1 text-sm text-slate-700">
                      {note.attachments.map((attachment) => (
                        <li key={attachment.id}>{attachment.fileName}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </article>
            ))
          ) : (
            <EmptyState
              title="No meeting notes yet"
              message="Add a meeting summary, customer notes, transcript text or recording link after meeting with this client."
            />
          )}
        </div>
      </div>

      <form action={addMeetingNote} className="rounded-lg border border-slate-200 bg-white p-5 shadow-card">
        <h2 className="text-lg font-semibold">Add Meeting Note</h2>
        <p className="mt-1 text-sm text-slate-600">
          Save the client conversation against this lead profile.
        </p>

        <label className="mt-4 block text-sm font-medium text-slate-700">
          Meeting Date
          <input name="meetingDate" type="date" className={inputClass} />
        </label>

        <label className="mt-4 block text-sm font-medium text-slate-700">
          Title
          <input name="title" placeholder="Discovery meeting, demo follow-up, pricing discussion" className={inputClass} />
        </label>

        <label className="mt-4 block text-sm font-medium text-slate-700">
          Attendees
          <input name="attendees" placeholder="Client names and TPC attendees" className={inputClass} />
        </label>

        <label className="mt-4 block text-sm font-medium text-slate-700">
          Meeting Summary *
          <textarea name="summary" rows={5} placeholder="What was discussed, what matters to the client, and what was agreed. If blank, a text transcript upload can fill this." className={inputClass} />
        </label>

        <label className="mt-4 block text-sm font-medium text-slate-700">
          Customer Notes
          <textarea name="customerNotes" rows={4} placeholder="Pain points, objections, budget signals, decision process, important context." className={inputClass} />
        </label>

        <label className="mt-4 block text-sm font-medium text-slate-700">
          Next Actions
          <textarea name="nextActions" rows={3} placeholder="Send proposal, book demo, call finance, request PO." className={inputClass} />
        </label>

        <label className="mt-4 block text-sm font-medium text-slate-700">
          Transcript
          <textarea name="transcript" rows={6} placeholder="Paste transcript text here." className={inputClass} />
        </label>

        <label className="mt-4 block text-sm font-medium text-slate-700">
          Transcript File
          <input name="transcriptFile" type="file" accept=".txt,.md,.vtt,.srt,text/*" className={inputClass} />
        </label>

        <label className="mt-4 block text-sm font-medium text-slate-700">
          Recording Link
          <input name="recordingUrl" type="url" placeholder="https://..." className={inputClass} />
        </label>

        <button type="submit" className="mt-4 w-full rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700">
          Save Meeting Note
        </button>
      </form>
    </div>
  );
}

function NoteCell({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 line-clamp-6 whitespace-pre-line text-sm text-slate-700">{value || "-"}</p>
    </div>
  );
}

const inputClass = "mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100";
