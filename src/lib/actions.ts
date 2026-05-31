"use server";

import {
  ActivityType,
  ClientOutcomeType,
  IdeaCategory,
  IdeaPriority,
  IdeaStatus,
  InfluenceType,
  LeadSource,
  LostReason,
  OpportunityStatus,
  PaymentScheduleStatus,
  PaymentType,
  PipelineStage,
  ProductCategory,
  TaskPriority,
  TaskStatus,
  TouchpointDirection,
  TouchpointType,
  SalesDocumentType,
  SalespersonStatus,
  SlipCategory,
  SlipPaymentMethod,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { grantFinanceAccess, isValidFinancePin, revokeFinanceAccess } from "@/lib/finance-auth";
import { grantPipelineAccess, validatePipelineLogin } from "@/lib/pipeline-auth";
import { prisma } from "@/lib/prisma";
import { grantSlipsAccess, isValidSlipsPin, revokeSlipsAccess } from "@/lib/slips-auth";
import { parseMeetingInboxNote, type ParsedMeetingInboxNote } from "@/lib/meeting-inbox";
import { getProbabilityForStage, stageProbabilities } from "@/lib/pipeline";
import { extractTranscriptInsights } from "@/lib/transcript";

function optionalString(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text.length ? text : null;
}

function requiredString(value: FormDataEntryValue | null, label: string) {
  const text = optionalString(value);
  if (!text) throw new Error(`${label} is required`);
  return text;
}

function numberValue(value: FormDataEntryValue | null, fallback = 0) {
  const parsed = Number(String(value ?? "").replace(/[^\d.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function intValue(value: FormDataEntryValue | null, fallback = 0) {
  return Math.round(numberValue(value, fallback));
}

function optionalDate(value: FormDataEntryValue | null) {
  const text = optionalString(value);
  if (!text) return null;
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function dateFromString(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function enumValue<T extends string>(value: FormDataEntryValue | null, allowed: readonly T[], fallback: T) {
  const text = String(value ?? "").trim().toUpperCase() as T;
  return allowed.includes(text) ? text : fallback;
}

function slugFromName(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function optionalEnumValue<T extends string>(value: FormDataEntryValue | null, allowed: readonly T[]) {
  const text = String(value ?? "").trim().toUpperCase() as T;
  return allowed.includes(text) ? text : null;
}

function parseStructuredRows(text: string) {
  const trimmed = text.trim();
  if (!trimmed) return [];

  if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
    const parsed = JSON.parse(trimmed);
    return Array.isArray(parsed) ? parsed : [parsed];
  }

  const lines = trimmed.split(/\r?\n/).filter((line) => line.trim());
  const headers = lines.shift()?.split(",").map((header) => header.trim()) ?? [];
  return lines.map((line) => {
    const values = line.match(/("([^"]|"")*"|[^,]+)/g)?.map((value) => value.replace(/^"|"$/g, "").replace(/""/g, '"').trim()) ?? [];
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
}

async function fileToStoredText(file: FormDataEntryValue | null) {
  if (!(file instanceof File) || file.size === 0) return null;
  const bytes = Buffer.from(await file.arrayBuffer());
  return {
    fileName: file.name,
    mimeType: file.type || "application/octet-stream",
    fileData: bytes.toString("base64"),
    text: file.type.startsWith("text/") || file.name.endsWith(".txt") ? bytes.toString("utf-8") : "",
  };
}

function opportunityData(formData: FormData) {
  const stage = enumValue(formData.get("stage"), Object.values(PipelineStage), "LEAD_IDENTIFIED");
  const probability = Math.min(100, Math.max(0, intValue(formData.get("probability"), getProbabilityForStage(stage))));

  return {
    companyName: requiredString(formData.get("companyName"), "Company Name"),
    contactName: optionalString(formData.get("contactName")),
    email: optionalString(formData.get("email")),
    phone: optionalString(formData.get("phone")),
    industry: optionalString(formData.get("industry")),
    product: optionalString(formData.get("product")),
    productCategory: optionalEnumValue(formData.get("productCategory"), Object.values(ProductCategory)),
    outcomeType: optionalEnumValue(formData.get("outcomeType"), Object.values(ClientOutcomeType)),
    leadSource: optionalEnumValue(formData.get("leadSource"), Object.values(LeadSource)),
    opportunityType:
      optionalString(formData.get("opportunityType")) === "Other"
        ? optionalString(formData.get("opportunityTypeOther"))
        : optionalString(formData.get("opportunityType")),
    stage,
    estimatedValue: Math.max(0, numberValue(formData.get("estimatedValue"), 0)),
    probability,
    expectedCloseDate: optionalDate(formData.get("expectedCloseDate")),
    nextStep: optionalString(formData.get("nextStep")),
    nextStepDate: optionalDate(formData.get("nextStepDate")),
    lastContactDate: optionalDate(formData.get("lastContactDate")),
    status: enumValue(formData.get("status"), Object.values(OpportunityStatus), "ACTIVE"),
    lostReason: optionalEnumValue(formData.get("lostReason"), Object.values(LostReason)),
    notes: optionalString(formData.get("notes")),
  };
}

export async function loginPipeline(formData: FormData) {
  const username = requiredString(formData.get("username"), "Username");
  const password = requiredString(formData.get("password"), "Password");

  if (!validatePipelineLogin(username, password)) {
    redirect("/login?error=invalid");
  }

  grantPipelineAccess(username);
  redirect("/dashboard");
}

export async function createOpportunity(formData: FormData) {
  await prisma.opportunity.create({ data: opportunityData(formData) });
  revalidatePath("/dashboard");
  revalidatePath("/opportunities");
  redirect("/opportunities");
}

export async function updateOpportunity(id: string, formData: FormData) {
  await prisma.opportunity.update({
    where: { id },
    data: opportunityData(formData),
  });
  revalidatePath("/dashboard");
  revalidatePath("/opportunities");
  revalidatePath(`/opportunities/${id}`);
  redirect("/opportunities");
}

export async function markOpportunityLost(id: string) {
  await prisma.opportunity.update({
    where: { id },
    data: { status: "LOST", stage: "LOST_NO_FIT", probability: 0 },
  });
  revalidatePath("/dashboard");
  revalidatePath("/opportunities");
  revalidatePath(`/opportunities/${id}`);
}

export async function updateOpportunityStage(id: string, stage: PipelineStage) {
  await prisma.opportunity.update({
    where: { id },
    data: {
      stage,
      probability: getProbabilityForStage(stage),
      status: stage === "PAYMENT_RECEIVED" ? "WON" : undefined,
    },
  });
  revalidatePath("/dashboard");
  revalidatePath("/opportunities");
  revalidatePath(`/opportunities/${id}`);
}

export async function createActivity(opportunityId: string, formData: FormData) {
  const type = enumValue(formData.get("type"), Object.values(ActivityType), "NOTE");
  const activityDate = optionalDate(formData.get("activityDate")) ?? new Date();
  const contactTypes: ActivityType[] = ["CALL", "EMAIL", "MEETING", "DEMO", "FOLLOW_UP", "PROPOSAL_SENT"];

  await prisma.$transaction(async (tx) => {
    await tx.activity.create({
      data: {
        opportunityId,
        type,
        description: optionalString(formData.get("description")),
        activityDate,
      },
    });

    await tx.opportunity.update({
      where: { id: opportunityId },
      data: {
        lastContactDate: contactTypes.includes(type) ? activityDate : undefined,
        stage: type === "PAYMENT_RECEIVED" ? "PAYMENT_RECEIVED" : undefined,
        status: type === "PAYMENT_RECEIVED" ? "WON" : undefined,
        probability: type === "PAYMENT_RECEIVED" ? 100 : undefined,
      },
    });
  });

  revalidatePath("/dashboard");
  revalidatePath("/opportunities");
  revalidatePath(`/opportunities/${opportunityId}`);
}

export async function createMeetingNote(opportunityId: string, formData: FormData) {
  const uploadedTranscript = await fileToStoredText(formData.get("transcriptFile"));
  const transcript = optionalString(formData.get("transcript")) ?? uploadedTranscript?.text ?? null;
  const extracted = extractTranscriptInsights(transcript);
  const summary = optionalString(formData.get("summary")) ?? extracted.summary;
  if (!summary) throw new Error("Meeting Summary is required");
  const meetingDate = optionalDate(formData.get("meetingDate")) ?? new Date();
  const title = optionalString(formData.get("title"));
  const nextActions = optionalString(formData.get("nextActions")) ?? extracted.nextActions;
  const customerNotes = optionalString(formData.get("customerNotes")) ?? extracted.customerNotes;

  await prisma.$transaction(async (tx) => {
    const opportunity = await tx.opportunity.findUnique({
      where: { id: opportunityId },
      select: { stage: true, status: true },
    });

    if (!opportunity) throw new Error("Opportunity not found");

    const shouldMoveToMeetingHeld =
      opportunity.status === "ACTIVE" &&
      stageProbabilities[opportunity.stage] < stageProbabilities.MEETING_HELD;

    const meetingNote = await tx.meetingNote.create({
      data: {
        opportunityId,
        title,
        attendees: optionalString(formData.get("attendees")),
        summary,
        customerNotes,
        transcript,
        recordingUrl: optionalString(formData.get("recordingUrl")),
        nextActions,
        meetingDate,
      },
    });

    if (uploadedTranscript) {
      await tx.meetingAttachment.create({
        data: {
          meetingNoteId: meetingNote.id,
          fileName: uploadedTranscript.fileName,
          mimeType: uploadedTranscript.mimeType,
          fileData: uploadedTranscript.fileData,
        },
      });
    }

    await tx.activity.create({
      data: {
        opportunityId,
        type: "MEETING",
        description: title ? `Meeting note added: ${title}` : "Meeting note added.",
        activityDate: meetingDate,
      },
    });

    await tx.opportunity.update({
      where: { id: opportunityId },
      data: {
        lastContactDate: meetingDate,
        nextStep: nextActions ?? undefined,
        stage: shouldMoveToMeetingHeld ? "MEETING_HELD" : undefined,
        probability: shouldMoveToMeetingHeld ? getProbabilityForStage("MEETING_HELD") : undefined,
      },
    });
  });

  revalidatePath("/dashboard");
  revalidatePath("/opportunities");
  revalidatePath(`/opportunities/${opportunityId}`);
}

export async function createTask(opportunityId: string, formData: FormData) {
  const title = requiredString(formData.get("title"), "Task Title");

  await prisma.task.create({
    data: {
      opportunityId,
      title,
      description: optionalString(formData.get("description")),
      dueDate: optionalDate(formData.get("dueDate")),
      priority: enumValue(formData.get("priority"), Object.values(TaskPriority), "MEDIUM"),
      status: enumValue(formData.get("status"), Object.values(TaskStatus), "OPEN"),
      assignee: optionalString(formData.get("assignee")),
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/opportunities");
  revalidatePath(`/opportunities/${opportunityId}`);
}

export async function completeTask(opportunityId: string, taskId: string) {
  await prisma.task.update({
    where: { id: taskId },
    data: { status: "COMPLETED", completedAt: new Date() },
  });

  revalidatePath("/dashboard");
  revalidatePath("/opportunities");
  revalidatePath(`/opportunities/${opportunityId}`);
}

export async function createContact(opportunityId: string, formData: FormData) {
  await prisma.contact.create({
    data: {
      opportunityId,
      fullName: requiredString(formData.get("fullName"), "Contact Name"),
      email: optionalString(formData.get("email")),
      phone: optionalString(formData.get("phone")),
      role: optionalString(formData.get("role")),
      influenceType: enumValue(formData.get("influenceType"), Object.values(InfluenceType), "UNKNOWN"),
      isDecisionMaker: formData.get("isDecisionMaker") === "on",
      notes: optionalString(formData.get("notes")),
    },
  });

  revalidatePath(`/opportunities/${opportunityId}`);
}

export async function createProposal(opportunityId: string, formData: FormData) {
  const proposalFile = await fileToStoredText(formData.get("proposalFile"));
  const amount = Math.max(0, numberValue(formData.get("amount"), 0));

  await prisma.$transaction(async (tx) => {
    await tx.proposal.create({
      data: {
        opportunityId,
        quoteNumber: optionalString(formData.get("quoteNumber")),
        amount,
        sentDate: optionalDate(formData.get("sentDate")),
        expiryDate: optionalDate(formData.get("expiryDate")),
        fileName: proposalFile?.fileName,
        mimeType: proposalFile?.mimeType,
        fileData: proposalFile?.fileData,
        revisionNotes: optionalString(formData.get("revisionNotes")),
      },
    });

    await tx.activity.create({
      data: {
        opportunityId,
        type: "PROPOSAL_SENT",
        description: `Proposal captured${amount ? ` for R${amount.toFixed(2)}` : ""}.`,
        activityDate: optionalDate(formData.get("sentDate")) ?? new Date(),
      },
    });

    await tx.opportunity.update({
      where: { id: opportunityId },
      data: {
        stage: "PROPOSAL_SENT",
        probability: getProbabilityForStage("PROPOSAL_SENT"),
      },
    });
  });

  revalidatePath("/dashboard");
  revalidatePath("/opportunities");
  revalidatePath(`/opportunities/${opportunityId}`);
}

export async function createPaymentSchedule(opportunityId: string, formData: FormData) {
  const expectedAmount = Math.max(0, numberValue(formData.get("expectedAmount"), 0));
  if (expectedAmount <= 0) throw new Error("Expected amount must be greater than zero");

  await prisma.paymentSchedule.create({
    data: {
      opportunityId,
      paymentType: enumValue(formData.get("paymentType"), Object.values(PaymentType), "DEPOSIT"),
      expectedAmount,
      dueDate: optionalDate(formData.get("dueDate")),
      status: enumValue(formData.get("status"), Object.values(PaymentScheduleStatus), "EXPECTED"),
      notes: optionalString(formData.get("notes")),
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/opportunities");
  revalidatePath(`/opportunities/${opportunityId}`);
}

export async function createTouchpoint(opportunityId: string, formData: FormData) {
  const type = enumValue(formData.get("type"), Object.values(TouchpointType), "OTHER");
  const touchpointDate = optionalDate(formData.get("touchpointDate")) ?? new Date();
  const description = optionalString(formData.get("description"));

  await prisma.$transaction(async (tx) => {
    await tx.touchpoint.create({
      data: {
        opportunityId,
        type,
        subject: optionalString(formData.get("subject")),
        description,
        direction: enumValue(formData.get("direction"), Object.values(TouchpointDirection), "OUTBOUND"),
        touchpointDate,
      },
    });

    await tx.activity.create({
      data: {
        opportunityId,
        type: type === "PHONE_CALL" ? "CALL" : type === "EMAIL_SENT" ? "EMAIL" : "FOLLOW_UP",
        description: description ?? type.replace(/_/g, " "),
        activityDate: touchpointDate,
      },
    });

    await tx.opportunity.update({
      where: { id: opportunityId },
      data: {
        lastContactDate: touchpointDate,
        stage: ["EMAIL_SENT", "WHATSAPP_SENT", "PHONE_CALL", "SMS_SENT"].includes(type) ? "CONTACT_MADE" : undefined,
        probability: ["EMAIL_SENT", "WHATSAPP_SENT", "PHONE_CALL", "SMS_SENT"].includes(type) ? getProbabilityForStage("CONTACT_MADE") : undefined,
      },
    });
  });

  revalidatePath("/dashboard");
  revalidatePath("/opportunities");
  revalidatePath(`/opportunities/${opportunityId}`);
}

export async function createSalesDocument(opportunityId: string, formData: FormData) {
  const documentFile = await fileToStoredText(formData.get("documentFile"));
  const type = enumValue(formData.get("type"), Object.values(SalesDocumentType), "OTHER");
  const sentDate = optionalDate(formData.get("sentDate")) ?? new Date();
  const title = requiredString(formData.get("title"), "Document Title");

  await prisma.$transaction(async (tx) => {
    await tx.salesDocument.create({
      data: {
        opportunityId,
        type,
        title,
        sentDate,
        recipient: optionalString(formData.get("recipient")),
        fileName: documentFile?.fileName,
        mimeType: documentFile?.mimeType,
        fileData: documentFile?.fileData,
        notes: optionalString(formData.get("notes")),
      },
    });

    await tx.touchpoint.create({
      data: {
        opportunityId,
        type:
          type === "BROCHURE" ? "BROCHURE_SENT"
          : type === "COURSE_OUTLINE" ? "COURSE_OUTLINE_SENT"
          : type === "COMPANY_PROFILE" ? "COMPANY_PROFILE_SENT"
          : type === "QUOTE" ? "QUOTE_SENT"
          : type === "INVOICE" ? "INVOICE_SENT"
          : type === "INFO_PACK" ? "INFO_SENT"
          : "OTHER",
        subject: title,
        description: optionalString(formData.get("notes")),
        direction: "OUTBOUND",
        touchpointDate: sentDate,
      },
    });
  });

  revalidatePath("/dashboard");
  revalidatePath("/opportunities");
  revalidatePath(`/opportunities/${opportunityId}`);
}

async function findMatchingOpportunity(client?: string | null) {
  if (!client) return null;
  return prisma.opportunity.findFirst({
    where: {
      companyName: {
        contains: client,
        mode: "insensitive",
      },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function createMeetingInboxNote(formData: FormData) {
  const rawText = requiredString(formData.get("rawText"), "Meeting Inbox Note");
  const duplicate = await prisma.meetingInboxNote.findFirst({
    where: {
      rawText,
      status: { in: ["UNPROCESSED", "NEEDS_REVIEW"] },
    },
    select: { id: true },
  });

  if (duplicate) {
    redirect("/meeting-inbox?duplicate=1");
  }

  const parsed = parseMeetingInboxNote(rawText);
  const opportunity = await findMatchingOpportunity(parsed.client);
  const status = opportunity && parsed.summary ? "UNPROCESSED" : "NEEDS_REVIEW";

  await prisma.meetingInboxNote.create({
    data: {
      rawText,
      parsedJson: parsed,
      matchedOpportunityId: opportunity?.id,
      status,
      warning: !opportunity
        ? "No matching opportunity found. Review and choose a client before applying."
        : !parsed.summary
          ? "No meeting summary found. Review before applying."
          : null,
    },
  });

  revalidatePath("/meeting-inbox");
  revalidatePath("/dashboard");
  redirect("/meeting-inbox?saved=1");
}

export async function archiveMeetingInboxNote(id: string) {
  await prisma.meetingInboxNote.update({
    where: { id },
    data: { status: "ARCHIVED" },
  });

  revalidatePath("/meeting-inbox");
  revalidatePath("/dashboard");
}

export async function applyMeetingInboxNote(id: string, formData: FormData) {
  const opportunityId = requiredString(formData.get("opportunityId"), "Opportunity");
  const inboxNote = await prisma.meetingInboxNote.findUnique({ where: { id } });
  if (!inboxNote) throw new Error("Meeting inbox note not found");

  const parsed = (inboxNote.parsedJson as ParsedMeetingInboxNote | null) ?? parseMeetingInboxNote(inboxNote.rawText);
  const meetingDate = dateFromString(parsed.meetingDate) ?? new Date();
  const summary = parsed.summary || inboxNote.rawText.slice(0, 700);
  const nextActions = parsed.nextActions?.join("\n") || undefined;
  const customerNotes = [
    parsed.customerNotes,
    parsed.painPoints?.length ? `Pain points:\n${parsed.painPoints.join("\n")}` : "",
    parsed.paymentSignals ? `Payment signals:\n${parsed.paymentSignals}` : "",
    parsed.notes ? `Notes:\n${parsed.notes}` : "",
  ].filter(Boolean).join("\n\n") || undefined;

  await prisma.$transaction(async (tx) => {
    await tx.meetingNote.create({
      data: {
        opportunityId,
        title: parsed.client ? `${parsed.client} meeting` : "Meeting inbox note",
        attendees: parsed.attendees?.join(", "),
        summary,
        customerNotes,
        transcript: inboxNote.rawText,
        nextActions,
        meetingDate,
      },
    });

    for (const contact of parsed.contacts ?? []) {
      await tx.contact.create({
        data: {
          opportunityId,
          fullName: contact.fullName,
          role: contact.role,
          email: contact.email,
          phone: contact.phone,
          influenceType: enumValue(contact.influenceType ?? null, Object.values(InfluenceType), "UNKNOWN"),
          isDecisionMaker: String(contact.influenceType ?? "").toUpperCase().includes("DECISION"),
        },
      });
    }

    for (const task of parsed.tasks ?? []) {
      await tx.task.create({
        data: {
          opportunityId,
          title: task.title,
          dueDate: dateFromString(task.dueDate),
          priority: task.priority ?? "MEDIUM",
        },
      });
    }

    for (const payment of parsed.paymentSchedule ?? []) {
      await tx.paymentSchedule.create({
        data: {
          opportunityId,
          paymentType: payment.paymentType,
          expectedAmount: payment.amount,
          dueDate: dateFromString(payment.dueDate),
          notes: parsed.paymentSignals,
        },
      });
    }

    const stageSuggestion = parsed.stageSuggestion;
    await tx.opportunity.update({
      where: { id: opportunityId },
      data: {
        lastContactDate: meetingDate,
        nextStep: nextActions,
        stage: stageSuggestion ?? undefined,
        probability: stageSuggestion ? getProbabilityForStage(stageSuggestion) : undefined,
      },
    });

    await tx.activity.create({
      data: {
        opportunityId,
        type: "MEETING",
        description: "Meeting inbox note applied to pipeline.",
        activityDate: meetingDate,
      },
    });

    await tx.meetingInboxNote.update({
      where: { id },
      data: {
        status: "APPLIED",
        matchedOpportunityId: opportunityId,
        appliedAt: new Date(),
        warning: null,
      },
    });
  });

  revalidatePath("/meeting-inbox");
  revalidatePath("/dashboard");
  revalidatePath("/opportunities");
  revalidatePath(`/opportunities/${opportunityId}`);
}

export async function createOpportunityFromInboxNote(id: string, formData: FormData) {
  const inboxNote = await prisma.meetingInboxNote.findUnique({ where: { id } });
  if (!inboxNote) throw new Error("Meeting inbox note not found");

  const parsed = (inboxNote.parsedJson as ParsedMeetingInboxNote | null) ?? parseMeetingInboxNote(inboxNote.rawText);
  const companyName = requiredString(formData.get("companyName"), "Company Name");
  const meetingDate = dateFromString(parsed.meetingDate) ?? new Date();
  const nextActions = parsed.nextActions?.join("\n") || undefined;
  const summary = parsed.summary || inboxNote.rawText.slice(0, 700);
  const customerNotes = [
    parsed.customerNotes,
    parsed.painPoints?.length ? `Pain points:\n${parsed.painPoints.join("\n")}` : "",
    parsed.paymentSignals ? `Payment signals:\n${parsed.paymentSignals}` : "",
    parsed.notes ? `Notes:\n${parsed.notes}` : "",
  ].filter(Boolean).join("\n\n") || undefined;
  const stage = parsed.stageSuggestion ?? "MEETING_HELD";
  const estimatedValue = parsed.paymentSchedule?.reduce((sum, payment) => sum + payment.amount, 0) ?? 0;

  let opportunityId = "";

  await prisma.$transaction(async (tx) => {
    const opportunity = await tx.opportunity.create({
      data: {
        companyName,
        contactName: parsed.contacts?.[0]?.fullName ?? null,
        email: parsed.contacts?.[0]?.email ?? null,
        phone: parsed.contacts?.[0]?.phone ?? null,
        industry: optionalString(formData.get("industry")),
        product: optionalString(formData.get("product")),
        opportunityType: "Meeting Inbox",
        stage,
        probability: getProbabilityForStage(stage),
        estimatedValue,
        nextStep: nextActions,
        nextStepDate: parsed.tasks?.[0]?.dueDate ? dateFromString(parsed.tasks[0].dueDate) : null,
        lastContactDate: meetingDate,
        notes: customerNotes,
      },
    });
    opportunityId = opportunity.id;

    await tx.meetingNote.create({
      data: {
        opportunityId,
        title: parsed.client ? `${parsed.client} meeting` : "Meeting inbox note",
        attendees: parsed.attendees?.join(", "),
        summary,
        customerNotes,
        transcript: inboxNote.rawText,
        nextActions,
        meetingDate,
      },
    });

    for (const contact of parsed.contacts ?? []) {
      await tx.contact.create({
        data: {
          opportunityId,
          fullName: contact.fullName,
          role: contact.role,
          email: contact.email,
          phone: contact.phone,
          influenceType: enumValue(contact.influenceType ?? null, Object.values(InfluenceType), "UNKNOWN"),
          isDecisionMaker: String(contact.influenceType ?? "").toUpperCase().includes("DECISION"),
        },
      });
    }

    for (const task of parsed.tasks ?? []) {
      await tx.task.create({
        data: {
          opportunityId,
          title: task.title,
          dueDate: dateFromString(task.dueDate),
          priority: task.priority ?? "MEDIUM",
        },
      });
    }

    for (const payment of parsed.paymentSchedule ?? []) {
      await tx.paymentSchedule.create({
        data: {
          opportunityId,
          paymentType: payment.paymentType,
          expectedAmount: payment.amount,
          dueDate: dateFromString(payment.dueDate),
          notes: parsed.paymentSignals,
        },
      });
    }

    await tx.activity.create({
      data: {
        opportunityId,
        type: "MEETING",
        description: "New opportunity created from meeting inbox note.",
        activityDate: meetingDate,
      },
    });

    await tx.meetingInboxNote.update({
      where: { id },
      data: {
        status: "APPLIED",
        matchedOpportunityId: opportunityId,
        appliedAt: new Date(),
        warning: null,
      },
    });
  });

  revalidatePath("/meeting-inbox");
  revalidatePath("/dashboard");
  revalidatePath("/opportunities");
  revalidatePath(`/opportunities/${opportunityId}`);
}

export async function createIdea(formData: FormData) {
  await prisma.idea.create({
    data: {
      title: requiredString(formData.get("title"), "Idea Title"),
      category: enumValue(formData.get("category"), Object.values(IdeaCategory), "OTHER"),
      status: enumValue(formData.get("status"), Object.values(IdeaStatus), "NEW"),
      priority: enumValue(formData.get("priority"), Object.values(IdeaPriority), "MEDIUM"),
      notes: optionalString(formData.get("notes")),
      opportunityId: optionalString(formData.get("opportunityId")),
    },
  });

  revalidatePath("/ideas");
}

export async function updateIdeaStatus(id: string, status: IdeaStatus) {
  await prisma.idea.update({
    where: { id },
    data: { status },
  });

  revalidatePath("/ideas");
}

export async function createSalesperson(formData: FormData) {
  const fullName = requiredString(formData.get("fullName"), "Salesperson Name");
  const baseSlug = slugFromName(fullName);
  const slug = baseSlug || `salesperson-${Date.now()}`;
  const defaultCommissionRate = Math.min(100, Math.max(0, numberValue(formData.get("defaultCommissionRate"), 0)));

  await prisma.salesperson.upsert({
    where: { slug },
    update: {
      fullName,
      email: optionalString(formData.get("email")),
      phone: optionalString(formData.get("phone")),
      defaultCommissionRate,
      status: enumValue(formData.get("status"), Object.values(SalespersonStatus), "ACTIVE"),
      notes: optionalString(formData.get("notes")),
    },
    create: {
      slug,
      fullName,
      email: optionalString(formData.get("email")),
      phone: optionalString(formData.get("phone")),
      defaultCommissionRate,
      status: enumValue(formData.get("status"), Object.values(SalespersonStatus), "ACTIVE"),
      notes: optionalString(formData.get("notes")),
    },
  });

  revalidatePath("/finance");
  redirect("/finance");
}

export async function unlockFinanceArea(formData: FormData) {
  const pin = optionalString(formData.get("pin"));

  if (!isValidFinancePin(pin)) {
    redirect("/finance?pin=invalid");
  }

  grantFinanceAccess();
  redirect("/finance");
}

export async function lockFinanceArea() {
  revokeFinanceAccess();
  redirect("/finance");
}

export async function unlockSlipsArea(formData: FormData) {
  const pin = optionalString(formData.get("pin"));

  if (!isValidSlipsPin(pin)) {
    redirect("/slips?pin=invalid");
  }

  grantSlipsAccess();
  redirect("/slips");
}

export async function lockSlipsArea() {
  revokeSlipsAccess();
  redirect("/slips");
}

export async function createSlipReceipt(formData: FormData) {
  const receiptDate = optionalDate(formData.get("receiptDate")) ?? new Date();
  const merchant = requiredString(formData.get("merchant"), "Merchant");
  const category = enumValue(formData.get("category"), Object.values(SlipCategory), "OTHER");
  const paymentMethod = enumValue(formData.get("paymentMethod"), Object.values(SlipPaymentMethod), "CARD");
  const totalAmount = Math.max(0, numberValue(formData.get("totalAmount"), 0));
  if (totalAmount <= 0) throw new Error("Receipt total must be greater than zero");

  const itemsText = optionalString(formData.get("items"));
  const itemRows = itemsText
    ? itemsText.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
    : [];

  await prisma.slipReceipt.create({
    data: {
      receiptDate,
      merchant,
      category,
      paymentMethod,
      totalAmount,
      vatAmount: optionalString(formData.get("vatAmount")) ? Math.max(0, numberValue(formData.get("vatAmount"), 0)) : null,
      capturedBy: optionalString(formData.get("capturedBy")),
      notes: optionalString(formData.get("notes")),
      source: "MANUAL",
      items: itemRows.length
        ? {
            create: itemRows.map((description) => ({
              description,
              category,
            })),
          }
        : undefined,
    },
  });

  revalidatePath("/slips");
  redirect("/slips");
}

export async function importSlipReceipts(formData: FormData) {
  const rawText = requiredString(formData.get("structuredText"), "Structured receipt data");
  const rows = parseStructuredRows(rawText);
  const validRows = rows.filter((row) => String(row.merchant ?? row.shop ?? row.supplier ?? "").trim());

  if (!validRows.length) throw new Error("No valid receipt rows found");

  for (const row of validRows) {
    const date = dateFromString(row.date ?? row.receiptDate) ?? new Date();
    const merchant = String(row.merchant ?? row.shop ?? row.supplier ?? "Unknown").trim();
    const category = enumValue(row.category ?? null, Object.values(SlipCategory), "OTHER");
    const paymentMethod = enumValue(row.paymentMethod ?? row.payment ?? null, Object.values(SlipPaymentMethod), "CARD");
    const totalAmount = Math.max(0, numberValue(row.totalAmount ?? row.total ?? row.amount ?? 0, 0));
    if (totalAmount <= 0) continue;

    const itemText = String(row.items ?? row.itemDetails ?? "").trim();
    const items = itemText
      ? itemText.split(/;|\n/).map((item) => item.trim()).filter(Boolean)
      : [];

    await prisma.slipReceipt.create({
      data: {
        receiptDate: date,
        merchant,
        category,
        paymentMethod,
        totalAmount,
        vatAmount: row.vatAmount || row.vat ? Math.max(0, numberValue(row.vatAmount ?? row.vat, 0)) : null,
        capturedBy: optionalString(row.capturedBy ?? null),
        notes: optionalString(row.notes ?? null),
        rawText,
        source: "CHATGPT",
        items: items.length
          ? {
              create: items.map((description) => ({
                description,
                category,
              })),
            }
          : undefined,
      },
    });
  }

  revalidatePath("/slips");
  redirect("/slips?imported=1");
}

export async function createPaymentRecord(opportunityId: string, formData: FormData) {
  const paymentType = enumValue(formData.get("paymentType"), Object.values(PaymentType), "DEPOSIT");
  const amount = Math.max(0, numberValue(formData.get("amount"), 0));
  const receivedDate = optionalDate(formData.get("receivedDate")) ?? new Date();

  if (amount <= 0) throw new Error("Payment amount must be greater than zero");

  await prisma.$transaction(async (tx) => {
    await tx.paymentRecord.create({
      data: {
        opportunityId,
        paymentType,
        amount,
        receivedDate,
        reference: optionalString(formData.get("reference")),
        notes: optionalString(formData.get("notes")),
      },
    });

    await tx.activity.create({
      data: {
        opportunityId,
        type: "PAYMENT_RECEIVED",
        description: `${paymentType.replace(/_/g, " ")} received: R${amount.toFixed(2)}`,
        activityDate: receivedDate,
      },
    });

    if (paymentType === "FINAL_PAYMENT") {
      await tx.opportunity.update({
        where: { id: opportunityId },
        data: {
          stage: "PAYMENT_RECEIVED",
          status: "WON",
          probability: 100,
          lastContactDate: receivedDate,
        },
      });
    }
  });

  revalidatePath("/dashboard");
  revalidatePath("/opportunities");
  revalidatePath(`/opportunities/${opportunityId}`);
}

export async function importOpportunities(formData: FormData) {
  const payload = optionalString(formData.get("rows"));
  if (!payload) throw new Error("No import rows supplied");

  const rows = JSON.parse(payload) as Array<{
    companyName: string;
    contactName?: string | null;
    email?: string | null;
    phone?: string | null;
    industry?: string | null;
    product?: string | null;
    opportunityType?: string | null;
    stage: PipelineStage;
    estimatedValue: number;
    probability: number;
    expectedCloseDate?: string | null;
    nextStep?: string | null;
    nextStepDate?: string | null;
    lastContactDate?: string | null;
    status: OpportunityStatus;
    notes?: string | null;
  }>;

  const validRows = rows.filter((row) => row.companyName?.trim());
  if (!validRows.length) throw new Error("No valid rows to import");

  await prisma.opportunity.createMany({
    data: validRows.map((row) => ({
      ...row,
      expectedCloseDate: row.expectedCloseDate ? new Date(row.expectedCloseDate) : null,
      nextStepDate: row.nextStepDate ? new Date(row.nextStepDate) : null,
      lastContactDate: row.lastContactDate ? new Date(row.lastContactDate) : null,
    })),
  });

  revalidatePath("/dashboard");
  revalidatePath("/opportunities");
  redirect("/opportunities?imported=1");
}
