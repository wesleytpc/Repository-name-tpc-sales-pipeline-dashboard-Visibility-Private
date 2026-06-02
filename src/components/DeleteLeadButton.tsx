"use client";

import { Trash2 } from "lucide-react";
import { deleteOpportunity } from "@/lib/actions";

export function DeleteLeadButton({
  id,
  companyName,
  compact = false,
}: {
  id: string;
  companyName: string;
  compact?: boolean;
}) {
  return (
    <form
      action={deleteOpportunity.bind(null, id)}
      onSubmit={(event) => {
        if (!window.confirm(`Delete ${companyName}? This will permanently remove this lead and its notes, tasks, payments and activity history.`)) {
          event.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        className={
          compact
            ? "text-sm font-medium text-red-700 hover:text-red-800"
            : "inline-flex items-center gap-2 rounded-md border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
        }
      >
        {compact ? "Delete" : <Trash2 className="h-4 w-4" />}
        {compact ? null : "Delete Lead"}
      </button>
    </form>
  );
}
