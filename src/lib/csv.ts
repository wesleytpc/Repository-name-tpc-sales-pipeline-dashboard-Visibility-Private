import { OpportunityStatus, PipelineStage } from "@prisma/client";
import { getProbabilityForStage, normaliseVisibleStage } from "@/lib/pipeline";

export type CsvOpportunityRow = {
  companyName?: string;
  contactName?: string;
  email?: string;
  phone?: string;
  industry?: string;
  product?: string;
  opportunityType?: string;
  stage?: string;
  estimatedValue?: string;
  probability?: string;
  expectedCloseDate?: string;
  nextStep?: string;
  nextStepDate?: string;
  lastContactDate?: string;
  status?: string;
  notes?: string;
};

export type NormalisedCsvRow = {
  rowNumber: number;
  valid: boolean;
  warnings: string[];
  data: {
    companyName: string;
    contactName?: string;
    email?: string;
    phone?: string;
    industry?: string;
    product?: string;
    opportunityType?: string;
    stage: PipelineStage;
    estimatedValue: number;
    probability: number;
    expectedCloseDate?: Date;
    nextStep?: string;
    nextStepDate?: Date;
    lastContactDate?: Date;
    status: OpportunityStatus;
    notes?: string;
  };
};

const stages = new Set(Object.values(PipelineStage));
const statuses = new Set(Object.values(OpportunityStatus));

function clean(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function parseDate(value: string | undefined, warnings: string[], label: string) {
  const cleaned = clean(value);
  if (!cleaned) return undefined;
  const date = new Date(cleaned);
  if (Number.isNaN(date.getTime())) {
    warnings.push(`${label} is invalid`);
    return undefined;
  }
  return date;
}

function parseNumber(value: string | undefined, fallback: number, warnings: string[], label: string) {
  const cleaned = clean(value);
  if (!cleaned) return fallback;
  const number = Number(cleaned.replace(/[^\d.-]/g, ""));
  if (Number.isNaN(number)) {
    warnings.push(`${label} is invalid`);
    return fallback;
  }
  return number;
}

export function normaliseCsvRows(rows: CsvOpportunityRow[]) {
  return rows.map((row, index): NormalisedCsvRow => {
    const warnings: string[] = [];
    const companyName = clean(row.companyName) ?? "";
    if (!companyName) warnings.push("Company Name is required");

    let stage = (clean(row.stage) ?? "LEAD_IDENTIFIED").toUpperCase() as PipelineStage;
    if (!stages.has(stage)) {
      warnings.push("Stage is invalid; defaulted to Lead Identified");
      stage = "LEAD_IDENTIFIED";
    }
    stage = normaliseVisibleStage(stage) as PipelineStage;

    let status = (clean(row.status) ?? "ACTIVE").toUpperCase() as OpportunityStatus;
    if (!statuses.has(status)) {
      warnings.push("Status is invalid; defaulted to Active");
      status = "ACTIVE";
    }

    const estimatedValue = Math.max(0, parseNumber(row.estimatedValue, 0, warnings, "Estimated Value"));
    const defaultProbability = getProbabilityForStage(stage);
    const probability = Math.min(100, Math.max(0, parseNumber(row.probability, defaultProbability, warnings, "Probability")));

    return {
      rowNumber: index + 2,
      valid: Boolean(companyName),
      warnings,
      data: {
        companyName,
        contactName: clean(row.contactName),
        email: clean(row.email),
        phone: clean(row.phone),
        industry: clean(row.industry),
        product: clean(row.product),
        opportunityType: clean(row.opportunityType),
        stage,
        estimatedValue,
        probability,
        expectedCloseDate: parseDate(row.expectedCloseDate, warnings, "Expected Close Date"),
        nextStep: clean(row.nextStep),
        nextStepDate: parseDate(row.nextStepDate, warnings, "Next Step Date"),
        lastContactDate: parseDate(row.lastContactDate, warnings, "Last Contact Date"),
        status,
        notes: clean(row.notes),
      },
    };
  });
}

export const sampleCsv = `companyName,contactName,email,phone,industry,product,opportunityType,stage,estimatedValue,probability,expectedCloseDate,nextStep,nextStepDate,lastContactDate,status,notes
Kajima Construction SA,John Smith,john@example.com,0820000000,Construction,Asset Dashboard,Software,MEETING_HELD,120000,30,2026-06-30,Send proposal,2026-06-02,2026-05-26,ACTIVE,Needs visual walkthrough
South Rand Mining Services,Sarah Jones,sarah@example.com,0830000000,Mining,Training + Unity,Corporate Training,NEED_CONFIRMED,85000,25,2026-07-15,Book demo,2026-06-05,2026-05-25,ACTIVE,Interested in health and safety training`;
