import type { Activity, MeetingNote, PaymentRecord, Proposal, SalesDocument, Touchpoint } from "@prisma/client";
import { CalendarDays } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/format";

type TimelineItem = {
  id: string;
  date: Date;
  label: string;
  detail?: string | null;
  tone: "activity" | "meeting" | "proposal" | "payment" | "document" | "touchpoint";
};

export function RelationshipTimeline({
  activities,
  meetingNotes,
  paymentRecords,
  proposals,
  salesDocuments,
  touchpoints,
}: {
  activities: Activity[];
  meetingNotes: MeetingNote[];
  paymentRecords: PaymentRecord[];
  proposals: Proposal[];
  salesDocuments: SalesDocument[];
  touchpoints: Touchpoint[];
}) {
  const items: TimelineItem[] = [
    ...activities.map((item) => ({ id: `a-${item.id}`, date: item.activityDate, label: item.type.replace(/_/g, " "), detail: item.description, tone: "activity" as const })),
    ...meetingNotes.map((item) => ({ id: `m-${item.id}`, date: item.meetingDate, label: item.title || "Meeting", detail: item.summary, tone: "meeting" as const })),
    ...paymentRecords.map((item) => ({ id: `p-${item.id}`, date: item.receivedDate, label: `${item.paymentType.replace(/_/g, " ")} received`, detail: formatCurrency(item.amount), tone: "payment" as const })),
    ...proposals.map((item) => ({ id: `q-${item.id}`, date: item.sentDate || item.createdAt, label: item.quoteNumber || "Proposal captured", detail: formatCurrency(item.amount), tone: "proposal" as const })),
    ...salesDocuments.map((item) => ({ id: `d-${item.id}`, date: item.sentDate || item.createdAt, label: item.title, detail: item.type.replace(/_/g, " "), tone: "document" as const })),
    ...touchpoints.map((item) => ({ id: `t-${item.id}`, date: item.touchpointDate, label: item.subject || item.type.replace(/_/g, " "), detail: item.description, tone: "touchpoint" as const })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 18);

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-card">
      <div className="flex items-center gap-2">
        <CalendarDays className="h-5 w-5 text-orange-600" />
        <h2 className="text-lg font-semibold">Relationship Timeline</h2>
      </div>
      <div className="mt-5 space-y-4">
        {items.map((item) => (
          <article key={item.id} className="relative border-l-2 border-slate-200 pl-4">
            <span className={`absolute -left-[7px] top-1 h-3 w-3 rounded-full ${toneClass[item.tone]}`} />
            <div className="flex flex-wrap items-start justify-between gap-2">
              <p className="font-semibold text-slate-950">{item.label}</p>
              <p className="text-xs text-slate-500">{formatDate(item.date)}</p>
            </div>
            {item.detail ? <p className="mt-1 line-clamp-3 whitespace-pre-line text-sm text-slate-600">{item.detail}</p> : null}
          </article>
        ))}
        {!items.length ? <p className="text-sm text-slate-500">No relationship history captured yet.</p> : null}
      </div>
    </section>
  );
}

const toneClass = {
  activity: "bg-slate-400",
  meeting: "bg-blue-500",
  proposal: "bg-orange-500",
  payment: "bg-green-500",
  document: "bg-purple-500",
  touchpoint: "bg-slate-900",
};
