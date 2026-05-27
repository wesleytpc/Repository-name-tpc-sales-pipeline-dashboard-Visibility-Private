"use server";

import { ActivityType, OpportunityStatus, PipelineStage } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getProbabilityForStage } from "@/lib/pipeline";

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

function enumValue<T extends string>(value: FormDataEntryValue | null, allowed: readonly T[], fallback: T) {
  const text = String(value ?? "").trim().toUpperCase() as T;
  return allowed.includes(text) ? text : fallback;
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
    opportunityType: optionalString(formData.get("opportunityType")),
    stage,
    estimatedValue: Math.max(0, numberValue(formData.get("estimatedValue"), 0)),
    probability,
    expectedCloseDate: optionalDate(formData.get("expectedCloseDate")),
    nextStep: optionalString(formData.get("nextStep")),
    nextStepDate: optionalDate(formData.get("nextStepDate")),
    lastContactDate: optionalDate(formData.get("lastContactDate")),
    status: enumValue(formData.get("status"), Object.values(OpportunityStatus), "ACTIVE"),
    notes: optionalString(formData.get("notes")),
  };
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
