import type { Task } from "@prisma/client";
import { Check, Clock } from "lucide-react";
import { completeTask, createTask } from "@/lib/actions";
import { formatDate } from "@/lib/format";
import { taskPriorityLabels, taskStatusLabels } from "@/lib/sales-options";
import { EmptyState } from "@/components/EmptyState";

export function TaskList({ opportunityId, tasks }: { opportunityId: string; tasks: Task[] }) {
  const addTask = createTask.bind(null, opportunityId);

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-card">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-orange-600" />
          <h2 className="text-lg font-semibold">Tasks & Reminders</h2>
        </div>
        <div className="mt-4 space-y-3">
          {tasks.length ? tasks.map((task) => (
            <article key={task.id} className="rounded-md border border-slate-200 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-950">{task.title}</p>
                  <p className="mt-1 text-sm text-slate-600">{task.description || "No description added."}</p>
                  <p className="mt-2 text-xs text-slate-500">Due: {formatDate(task.dueDate)} | {task.assignee || "Unassigned"}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">{taskStatusLabels[task.status]}</span>
                  <span className="rounded-full bg-orange-50 px-2 py-1 text-xs font-medium text-orange-700">{taskPriorityLabels[task.priority]}</span>
                </div>
              </div>
              {task.status !== "COMPLETED" ? (
                <form action={completeTask.bind(null, opportunityId, task.id)} className="mt-3">
                  <button className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
                    <Check className="h-3.5 w-3.5" />
                    Mark Complete
                  </button>
                </form>
              ) : null}
            </article>
          )) : (
            <EmptyState title="No tasks yet" message="Add follow-ups, proposal reminders and payment chase actions for this lead." />
          )}
        </div>
      </section>

      <form action={addTask} className="rounded-lg border border-slate-200 bg-white p-5 shadow-card">
        <h2 className="text-lg font-semibold">Add Task</h2>
        <label className="mt-4 block text-sm font-medium text-slate-700">
          Task Title *
          <input name="title" required placeholder="Follow up on proposal" className={inputClass} />
        </label>
        <label className="mt-4 block text-sm font-medium text-slate-700">
          Due Date
          <input name="dueDate" type="date" className={inputClass} />
        </label>
        <label className="mt-4 block text-sm font-medium text-slate-700">
          Priority
          <select name="priority" className={inputClass}>
            {Object.entries(taskPriorityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label className="mt-4 block text-sm font-medium text-slate-700">
          Assignee
          <input name="assignee" placeholder="Wesley, sales, admin" className={inputClass} />
        </label>
        <label className="mt-4 block text-sm font-medium text-slate-700">
          Description
          <textarea name="description" rows={4} className={inputClass} />
        </label>
        <button className="mt-4 w-full rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700">Save Task</button>
      </form>
    </div>
  );
}

const inputClass = "mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100";
