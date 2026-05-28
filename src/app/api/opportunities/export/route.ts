import { prisma } from "@/lib/prisma";
import { toCsvDate } from "@/lib/format";

const columns = [
  "companyName",
  "contactName",
  "email",
  "phone",
  "industry",
  "product",
  "opportunityType",
  "stage",
  "estimatedValue",
  "probability",
  "expectedCloseDate",
  "nextStep",
  "nextStepDate",
  "lastContactDate",
  "status",
  "notes",
] as const;

function escapeCsvValue(value: string | number | null | undefined) {
  const text = value === null || value === undefined ? "" : String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export async function GET() {
  const opportunities = await prisma.opportunity.findMany({
    orderBy: { updatedAt: "desc" },
  });

  const rows = opportunities.map((opportunity) =>
    [
      opportunity.companyName,
      opportunity.contactName,
      opportunity.email,
      opportunity.phone,
      opportunity.industry,
      opportunity.product,
      opportunity.opportunityType,
      opportunity.stage,
      opportunity.estimatedValue,
      opportunity.probability,
      toCsvDate(opportunity.expectedCloseDate),
      opportunity.nextStep,
      toCsvDate(opportunity.nextStepDate),
      toCsvDate(opportunity.lastContactDate),
      opportunity.status,
      opportunity.notes,
    ].map(escapeCsvValue).join(","),
  );

  const csv = [columns.join(","), ...rows].join("\n");
  const date = new Date().toISOString().slice(0, 10);

  return new Response(csv, {
    headers: {
      "Content-Disposition": `attachment; filename="pipeline-export-${date}.csv"`,
      "Content-Type": "text/csv; charset=utf-8",
    },
  });
}
