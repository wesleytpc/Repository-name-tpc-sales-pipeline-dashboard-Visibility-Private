"use client";

import { useMemo, useState } from "react";
import type { Opportunity, OpportunityStatus, PipelineStage } from "@prisma/client";
import { stageLabels, stageProbabilities, visiblePipelineStages } from "@/lib/pipeline";
import { toInputDate } from "@/lib/format";
import { isKnownOpportunityType, opportunityTypes } from "@/lib/opportunity-types";
import { clientOutcomeTypeLabels, leadSourceLabels, lostReasonLabels, productCategoryLabels } from "@/lib/sales-options";

const statuses: OpportunityStatus[] = ["ACTIVE", "WON", "LOST", "ON_HOLD"];
const stages = visiblePipelineStages;

type Action = (formData: FormData) => void | Promise<void>;

export function OpportunityForm({
  opportunity,
  action,
  submitLabel,
}: {
  opportunity?: Opportunity | null;
  action: Action;
  submitLabel: string;
}) {
  const initialStage = opportunity?.stage === "VERBAL_APPROVAL" ? "PO_CONTRACT_INVOICE_REQUESTED" : opportunity?.stage ?? "LEAD_IDENTIFIED";
  const initialOpportunityType = isKnownOpportunityType(opportunity?.opportunityType) ? opportunity?.opportunityType ?? "" : "Other";
  const [stage, setStage] = useState<PipelineStage>(initialStage);
  const [probability, setProbability] = useState(String(opportunity?.probability ?? stageProbabilities[initialStage]));
  const [opportunityType, setOpportunityType] = useState(initialOpportunityType);

  const inputClass = "mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100";
  const labelClass = "text-sm font-medium text-slate-700";

  const defaults = useMemo(() => ({
    companyName: opportunity?.companyName ?? "",
    contactName: opportunity?.contactName ?? "",
    email: opportunity?.email ?? "",
    phone: opportunity?.phone ?? "",
    industry: opportunity?.industry ?? "",
    product: opportunity?.product ?? "",
    opportunityType: opportunity?.opportunityType ?? "",
    productCategory: opportunity?.productCategory ?? "",
    outcomeType: opportunity?.outcomeType ?? "",
    leadSource: opportunity?.leadSource ?? "",
    estimatedValue: opportunity?.estimatedValue ?? 0,
    expectedCloseDate: toInputDate(opportunity?.expectedCloseDate),
    nextStep: opportunity?.nextStep ?? "",
    nextStepDate: toInputDate(opportunity?.nextStepDate),
    lastContactDate: toInputDate(opportunity?.lastContactDate),
    status: opportunity?.status ?? "ACTIVE",
    lostReason: opportunity?.lostReason ?? "",
    notes: opportunity?.notes ?? "",
  }), [opportunity]);

  return (
    <form action={action} className="rounded-lg border border-slate-200 bg-white p-5 shadow-card">
      <div className="grid gap-4 md:grid-cols-2">
        <label className={labelClass}>
          Company Name *
          <input name="companyName" required defaultValue={defaults.companyName} className={inputClass} />
        </label>
        <label className={labelClass}>
          Contact Name
          <input name="contactName" defaultValue={defaults.contactName} className={inputClass} />
        </label>
        <label className={labelClass}>
          Email
          <input name="email" type="email" defaultValue={defaults.email} className={inputClass} />
        </label>
        <label className={labelClass}>
          Phone
          <input name="phone" defaultValue={defaults.phone} className={inputClass} />
        </label>
        <label className={labelClass}>
          Industry
          <input name="industry" defaultValue={defaults.industry} className={inputClass} />
        </label>
        <label className={labelClass}>
          Product / Service
          <input name="product" defaultValue={defaults.product} className={inputClass} />
        </label>
        <label className={labelClass}>
          Product Category
          <select name="productCategory" defaultValue={defaults.productCategory} className={inputClass}>
            <option value="">Select category</option>
            {Object.entries(productCategoryLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          Lead Type
          <select
            name="opportunityType"
            value={opportunityType}
            onChange={(event) => setOpportunityType(event.target.value)}
            className={inputClass}
          >
            <option value="">Select type</option>
            {opportunityTypes.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          {opportunityType === "Other" ? (
            <input
              name="opportunityTypeOther"
              defaultValue={isKnownOpportunityType(defaults.opportunityType) ? "" : defaults.opportunityType}
              placeholder="Type lead type"
              className={inputClass}
            />
          ) : null}
        </label>
        <label className={labelClass}>
          Client Outcome Type
          <select name="outcomeType" defaultValue={defaults.outcomeType} className={inputClass}>
            <option value="">Select outcome</option>
            {Object.entries(clientOutcomeTypeLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          Lead Source
          <select name="leadSource" defaultValue={defaults.leadSource} className={inputClass}>
            <option value="">Select source</option>
            {Object.entries(leadSourceLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          Stage
          <select
            name="stage"
            value={stage}
            onChange={(event) => {
              const nextStage = event.target.value as PipelineStage;
              setStage(nextStage);
              setProbability(String(stageProbabilities[nextStage]));
            }}
            className={inputClass}
          >
            {stages.map((item) => (
              <option key={item} value={item}>{stageLabels[item]}</option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          Estimated Value
          <input name="estimatedValue" type="number" min="0" step="0.01" defaultValue={defaults.estimatedValue} className={inputClass} />
        </label>
        <label className={labelClass}>
          Probability
          <input name="probability" type="number" min="0" max="100" value={probability} onChange={(event) => setProbability(event.target.value)} className={inputClass} />
        </label>
        <label className={labelClass}>
          Expected Close Date
          <input name="expectedCloseDate" type="date" defaultValue={defaults.expectedCloseDate} className={inputClass} />
        </label>
        <label className={labelClass}>
          Next Step
          <input name="nextStep" defaultValue={defaults.nextStep} className={inputClass} />
        </label>
        <label className={labelClass}>
          Next Step Date
          <input name="nextStepDate" type="date" defaultValue={defaults.nextStepDate} className={inputClass} />
        </label>
        <label className={labelClass}>
          Last Contact Date
          <input name="lastContactDate" type="date" defaultValue={defaults.lastContactDate} className={inputClass} />
        </label>
        <label className={labelClass}>
          Status
          <select name="status" defaultValue={defaults.status} className={inputClass}>
            {statuses.map((status) => <option key={status} value={status}>{status.replace("_", " ")}</option>)}
          </select>
        </label>
        <label className={labelClass}>
          Lost Reason
          <select name="lostReason" defaultValue={defaults.lostReason} className={inputClass}>
            <option value="">Only if lost</option>
            {Object.entries(lostReasonLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>
      </div>
      <label className={`${labelClass} mt-4 block`}>
        Notes
        <textarea name="notes" rows={5} defaultValue={defaults.notes} className={inputClass} />
      </label>
      <div className="mt-5 flex flex-wrap gap-3">
        <button type="submit" className="rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
