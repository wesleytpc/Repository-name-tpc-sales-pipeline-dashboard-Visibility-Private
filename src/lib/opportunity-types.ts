export const opportunityTypes = [
  "Corporate Training",
  "Compliance Training",
  "Software",
  "Learning Platform",
  "Corporate Course",
  "Skills Programme",
  "Campaign",
  "Development Project",
  "Subscription",
  "Retainer",
  "Consulting",
  "Other",
] as const;

export function isKnownOpportunityType(value?: string | null) {
  return Boolean(value && opportunityTypes.includes(value as (typeof opportunityTypes)[number]));
}
