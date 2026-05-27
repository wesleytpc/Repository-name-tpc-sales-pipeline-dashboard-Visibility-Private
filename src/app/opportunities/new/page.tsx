import Link from "next/link";
import { createOpportunity } from "@/lib/actions";
import { OpportunityForm } from "@/components/OpportunityForm";

export default function NewOpportunityPage() {
  return (
    <div className="space-y-5">
      <div>
        <Link href="/opportunities" className="text-sm font-medium text-orange-700 hover:text-orange-800">Back to Opportunities</Link>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">Add Opportunity</h2>
      </div>
      <OpportunityForm action={createOpportunity} submitLabel="Create Opportunity" />
    </div>
  );
}
