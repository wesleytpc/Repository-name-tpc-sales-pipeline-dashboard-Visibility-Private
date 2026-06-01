import type { Metadata } from "next";
import { AppShell } from "@/components/AppShell";
import { prisma } from "@/lib/prisma";
import { isOverdue } from "@/lib/pipeline";
import "./globals.css";

export const metadata: Metadata = {
  title: "TPC Sales Pipeline Dashboard",
  description: "Track sales leads, pipeline movement and money in the bank.",
};

export const dynamic = "force-dynamic";

async function getActionCount() {
  try {
    const [inboxCount, tasks, opportunities, schedules] = await Promise.all([
      prisma.meetingInboxNote.count({ where: { status: { in: ["UNPROCESSED", "NEEDS_REVIEW"] } } }),
      prisma.task.findMany({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } }, select: { dueDate: true } }),
      prisma.opportunity.findMany({ where: { status: "ACTIVE" }, select: { nextStepDate: true } }),
      prisma.paymentSchedule.findMany({ where: { status: { in: ["EXPECTED", "INVOICED", "OVERDUE"] } }, select: { dueDate: true } }),
    ]);

    return inboxCount
      + tasks.filter((task) => isOverdue(task.dueDate)).length
      + opportunities.filter((opportunity) => isOverdue(opportunity.nextStepDate)).length
      + schedules.filter((schedule) => isOverdue(schedule.dueDate)).length;
  } catch {
    return 0;
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const actionCount = await getActionCount();

  return (
    <html lang="en-ZA">
      <body>
        <AppShell actionCount={actionCount}>{children}</AppShell>
      </body>
    </html>
  );
}
