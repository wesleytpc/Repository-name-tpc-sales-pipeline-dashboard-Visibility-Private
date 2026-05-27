import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateOpportunity } from "@/lib/actions";
import { OpportunityForm } from "@/components/OpportunityForm";

export const dynamic = "force-dynamic";

export default async function EditOpportunityPage({ params }: { params: { id: string } }) {
  const opportunity = await prisma.opportunity.findUnique({ where: { id: params.id } });
  if (!opportunity) notFound();

  const action = updateOpportunity.bind(null, opportunity.id);

  return (
    <div className="space-y-5">
      <div>
        <Link href={`/opportunities/${opportunity.id}`} className="text-sm font-medium text-orange-700 hover:text-orange-800">Back to Opportunity</Link>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">Edit Opportunity</h2>
      </div>
      <OpportunityForm opportunity={opportunity} action={action} submitLabel="Save Changes" />
    </div>
  );
}
