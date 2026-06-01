import { PaymentType, PipelineStage, TaskPriority } from "@prisma/client";

export type ParsedMeetingInboxNote = {
  client?: string;
  meetingDate?: string;
  attendees?: string[];
  summary?: string;
  customerNotes?: string;
  painPoints?: string[];
  nextActions?: string[];
  tasks?: Array<{ title: string; dueDate?: string; priority?: TaskPriority }>;
  contacts?: Array<{ fullName: string; role?: string; influenceType?: string; email?: string; phone?: string }>;
  stageSuggestion?: PipelineStage;
  paymentSignals?: string;
  paymentSchedule?: Array<{ paymentType: PaymentType; amount: number; dueDate?: string }>;
  notes?: string;
};

const sectionNames = [
  "CLIENT",
  "MEETING_DATE",
  "ATTENDEES",
  "SUMMARY",
  "CUSTOMER_NOTES",
  "PAIN_POINTS",
  "NEXT_ACTIONS",
  "TASKS",
  "CONTACTS",
  "STAGE_SUGGESTION",
  "PAYMENT_SIGNALS",
  "PAYMENT_SCHEDULE",
  "NOTES",
];

function cleanLine(value: string) {
  return value.replace(/^[-*]\s*/, "").trim();
}

function parseSections(rawText: string) {
  const sections: Record<string, string[]> = {};
  let current = "";

  rawText.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    const header = trimmed.replace(/:$/, "").toUpperCase();

    if (sectionNames.includes(header)) {
      current = header;
      sections[current] = [];
      return;
    }

    if (current && trimmed && !["TPC_MEETING_NOTE_V1", "END_TPC_MEETING_NOTE"].includes(trimmed)) {
      sections[current].push(line);
    }
  });

  return sections;
}

function sectionText(sections: Record<string, string[]>, key: string) {
  return sections[key]?.join("\n").trim() || undefined;
}

function sectionList(sections: Record<string, string[]>, key: string) {
  return sections[key]?.map(cleanLine).filter(Boolean) ?? [];
}

function normaliseEnum<T extends string>(value: string | undefined, allowed: readonly T[]) {
  if (!value) return undefined;
  const normalised = value.trim().toUpperCase().replace(/[\s/-]+/g, "_") as T;
  return allowed.includes(normalised) ? normalised : undefined;
}

function parseAmount(value?: string) {
  const amount = Number((value ?? "").replace(/[^\d.-]/g, ""));
  return Number.isFinite(amount) ? amount : 0;
}

export function parseMeetingInboxNote(rawText: string): ParsedMeetingInboxNote {
  const sections = parseSections(rawText);

  return {
    client: sectionText(sections, "CLIENT"),
    meetingDate: sectionText(sections, "MEETING_DATE"),
    attendees: sectionList(sections, "ATTENDEES"),
    summary: sectionText(sections, "SUMMARY"),
    customerNotes: sectionText(sections, "CUSTOMER_NOTES"),
    painPoints: sectionList(sections, "PAIN_POINTS"),
    nextActions: sectionList(sections, "NEXT_ACTIONS"),
    tasks: sectionList(sections, "TASKS").map((line) => {
      const [title, dueDate, priority] = line.split("|").map((part) => part?.trim());
      return {
        title,
        dueDate,
        priority: normaliseEnum(priority, Object.values(TaskPriority)),
      };
    }).filter((task) => task.title),
    contacts: sectionList(sections, "CONTACTS").map((line) => {
      const [fullName, role, influenceType, email, phone] = line.split("|").map((part) => part?.trim());
      return { fullName, role, influenceType, email, phone };
    }).filter((contact) => contact.fullName),
    stageSuggestion: normaliseEnum(sectionText(sections, "STAGE_SUGGESTION"), Object.values(PipelineStage)),
    paymentSignals: sectionText(sections, "PAYMENT_SIGNALS"),
    paymentSchedule: sectionList(sections, "PAYMENT_SCHEDULE").map((line) => {
      const [type, amount, dueDate] = line.split("|").map((part) => part?.trim());
      return {
        paymentType: normaliseEnum(type, Object.values(PaymentType)) ?? "OTHER",
        amount: parseAmount(amount),
        dueDate,
      };
    }).filter((payment) => payment.amount > 0),
    notes: sectionText(sections, "NOTES"),
  };
}

export const chatGptMeetingTemplate = `You are my TPC Sales Pipeline meeting note assistant.

I will dictate messy meeting notes after client meetings. Convert every note into this exact format.
Use only the fields below. Do not add extra headings. If something is unknown, leave the section blank.
Use YYYY-MM-DD dates. Use valid stage suggestions only from:
LEAD_IDENTIFIED, CONTACT_MADE, DECISION_MAKER_REACHED, NEED_CONFIRMED, MEETING_HELD, DEMO_COMPLETED, PROPOSAL_SENT, NEGOTIATION_FOLLOW_UP, PO_CONTRACT_INVOICE_REQUESTED, PAYMENT_RECEIVED, LOST_NO_FIT.

Use payment types only from:
DEPOSIT, DEVELOPMENT_MILESTONE, SUBSCRIPTION, RETAINER, FINAL_PAYMENT, PART_PAYMENT, OTHER.

Use task priorities only from:
LOW, MEDIUM, HIGH, URGENT.

TPC_MEETING_NOTE_V1

CLIENT:

MEETING_DATE:

ATTENDEES:

SUMMARY:

CUSTOMER_NOTES:

PAIN_POINTS:

NEXT_ACTIONS:

TASKS:

CONTACTS:

STAGE_SUGGESTION:

PAYMENT_SIGNALS:

PAYMENT_SCHEDULE:

NOTES:

END_TPC_MEETING_NOTE

Formatting rules:
- TASKS format: Task title | YYYY-MM-DD | PRIORITY
- CONTACTS format: Full Name | Role/Title | DECISION_MAKER or CHAMPION or INFLUENCER or BLOCKER or FINANCE or TECHNICAL or UNKNOWN | email | phone
- PAYMENT_SCHEDULE format: PAYMENT_TYPE | amount | YYYY-MM-DD
- Keep the summary concise and management-ready.
- Put client-specific concerns, objections, budget signals and decision-maker context under CUSTOMER_NOTES.
- Do not invent facts.`;
