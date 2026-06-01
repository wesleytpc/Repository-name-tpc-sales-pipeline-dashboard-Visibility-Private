import type { PipelineStage } from "@prisma/client";

export const stageLabels: Record<PipelineStage, string> = {
  LEAD_IDENTIFIED: "Lead Identified",
  CONTACT_MADE: "Contact Made",
  DECISION_MAKER_REACHED: "Decision-Maker Reached",
  NEED_CONFIRMED: "Need Confirmed",
  MEETING_HELD: "Meeting Held",
  DEMO_COMPLETED: "Demo Completed",
  PROPOSAL_SENT: "Proposal Sent",
  NEGOTIATION_FOLLOW_UP: "Negotiation / Follow-Up",
  VERBAL_APPROVAL: "PO / Contract / Invoice Requested",
  PO_CONTRACT_INVOICE_REQUESTED: "PO / Contract / Invoice Requested",
  PAYMENT_RECEIVED: "Payment Received",
  LOST_NO_FIT: "Lost / No Fit",
};

export const stageProbabilities: Record<PipelineStage, number> = {
  LEAD_IDENTIFIED: 5,
  CONTACT_MADE: 10,
  DECISION_MAKER_REACHED: 15,
  NEED_CONFIRMED: 25,
  MEETING_HELD: 30,
  DEMO_COMPLETED: 40,
  PROPOSAL_SENT: 50,
  NEGOTIATION_FOLLOW_UP: 60,
  VERBAL_APPROVAL: 90,
  PO_CONTRACT_INVOICE_REQUESTED: 90,
  PAYMENT_RECEIVED: 100,
  LOST_NO_FIT: 0,
};

export const pipelineStages = Object.keys(stageLabels) as PipelineStage[];
export const visiblePipelineStages = pipelineStages.filter((stage) => stage !== "VERBAL_APPROVAL");

export function normaliseVisibleStage(stage: PipelineStage | string) {
  return stage === "VERBAL_APPROVAL" ? "PO_CONTRACT_INVOICE_REQUESTED" : stage;
}

export function getStageLabel(stage: PipelineStage | string) {
  return stageLabels[stage as PipelineStage] ?? String(stage).replace(/_/g, " ");
}

export function getProbabilityForStage(stage: PipelineStage | string) {
  return stageProbabilities[stage as PipelineStage] ?? 5;
}

export function calculateWeightedValue(estimatedValue: number, probability: number) {
  return (estimatedValue || 0) * (probability || 0) / 100;
}

export function isRevenueStage(stage: PipelineStage | string) {
  return ["VERBAL_APPROVAL", "PO_CONTRACT_INVOICE_REQUESTED", "PAYMENT_RECEIVED"].includes(String(stage));
}

export function isProposalStage(stage: PipelineStage | string) {
  return [
    "PROPOSAL_SENT",
    "NEGOTIATION_FOLLOW_UP",
    "PO_CONTRACT_INVOICE_REQUESTED",
    "PAYMENT_RECEIVED",
  ].includes(String(stage));
}

export function isPaymentStage(stage: PipelineStage | string) {
  return stage === "PAYMENT_RECEIVED";
}

export function isOverdue(date?: Date | string | null) {
  if (!date) return false;
  const value = new Date(date);
  if (Number.isNaN(value.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return value < today;
}

export function getCurrentWeekStart() {
  const date = new Date();
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function getCurrentMonthStart() {
  const date = new Date();
  date.setDate(1);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function getStageBadgeClass(stage: PipelineStage | string) {
  if (stage === "PAYMENT_RECEIVED") return "bg-green-50 text-green-700 border-green-200";
  if (stage === "LOST_NO_FIT") return "bg-red-50 text-red-700 border-red-200";
  if (isProposalStage(stage)) return "bg-orange-50 text-orange-700 border-orange-200";
  if (["MEETING_HELD", "DEMO_COMPLETED", "NEED_CONFIRMED", "DECISION_MAKER_REACHED"].includes(String(stage))) {
    return "bg-blue-50 text-blue-700 border-blue-200";
  }
  return "bg-slate-50 text-slate-700 border-slate-200";
}
