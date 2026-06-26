/**
 * Tasks / Follow-ups page — premium upgrade
 * Grouped timeline view (Overdue → Due Today → Upcoming → No date → Completed),
 * completion progress bar, priority accent bars, and full CRUD.
 */
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { isPast, isToday } from "date-fns";
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  CalendarCheck,
  CheckCircle2,
  Circle,
  CircleDot,
  Clock,
  AlertTriangle,
  Building2,
} from "lucide-react";

import { PageHeader } from "../components/common/PageHeader";
import { EmptyState } from "../components/common/EmptyState";
import { ConfirmDialog } from "../components/common/ConfirmDialog";
import { StatCard } from "../components/common/StatCard";

import {
  Button,
  Card,
  Input,
  Textarea,
  Select,
  Field,
  Badge,
  Dialog,
  Dropdown,
  DropdownItem,
  Tabs,
  Spinner,
} from "../components/ui";

import { tasksApi, leadsApi } from "../lib/services";
import { shortDate, dateInputValue } from "../lib/format";
import {
  TASK_STATUSES,
  TASK_PRIORITIES,
  TASK_STATUS_STYLES,
  PRIORITY_STYLES,
} from "../lib/constants";
import { cn } from "../lib/utils";

// ─── Priority accent bar colours ──────────────────────────────────────────────
const PRIORITY_BAR = {
  High: "bg-rose-400",
  Medium: "bg-amber-400",
  Low: "bg-slate-300",
};

// ─── Group definitions (in display order) ────────────────────────────────────
const GROUPS = [
  { key: "overdue",   label: "Overdue",      labelClass: "text-rose-700",   countClass: "bg-rose-50 text-rose-700" },
  { key: "today",     label: "Due today",    labelClass: "text-amber-700",  countClass: "bg-amber-50 text-amber-700" },
  { key: "upcoming",  label: "Upcoming",     labelClass: "text-ink",        countClass: "bg-surface-muted text-ink-soft" },
  { key: "nodate",    label: "No due date",  labelClass: "text-ink-soft",   countClass: "bg-surface-muted text-ink-soft" },
  { key: "completed", label: "Completed",    labelClass: "text-brand-700",  countClass: "bg-brand-50 text-brand-700" },
];

// ─── Tab definitions ──────────────────────────────────────────────────────────
const STATUS_TABS = [
  { value: "all",         label: "All" },
  { value: "Pending",     label: "Pending" },
  { value: "In Progress", label: "In Progress" },
  { value: "Completed",   label: "Completed" },
];

// ─── Helper: is a task overdue (has past dueDate, not completed)? ─────────────
function isOverdue(task) {
  if (!task.dueDate || task.status === "Completed") return false;
  const d = new Date(task.dueDate);
  return isPast(d) && !isToday(d);
}

// ─── Helper: assign a task to a group key ────────────────────────────────────
function groupKey(task) {
  if (task.status === "Completed") return "completed";
  if (!task.dueDate) return "nodate";
  const d = new Date(task.dueDate);
  if (isToday(d)) return "today";
  if (isPast(d)) return "overdue";
  return "upcoming";
}

// ─── Add / Edit dialog (declared at module level — no component-in-component) ─
function TaskFormDialog({ open, onClose, task, leads, onSaved }) {
  const isEdit = Boolean(task);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  // Reset form whenever the dialog opens or the target task changes.
  useEffect(() => {
    if (open) {
      reset(
        task
          ? {
              title:       task.title ?? "",
              description: task.description ?? "",
              dueDate:     dateInputValue(task.dueDate),
              status:      task.status ?? "Pending",
              priority:    task.priority ?? "Medium",
              relatedLead: task.relatedLead?._id ?? "",
            }
          : {
              title: "", description: "", dueDate: "",
              status: "Pending", priority: "Medium", relatedLead: "",
            }
      );
    }
  }, [open, task, reset]);

  const onSubmit = async (values) => {
    const payload = {
      title:       values.title.trim(),
      description: values.description?.trim() || undefined,
      dueDate:     values.dueDate || undefined,
      status:      values.status,
      priority:    values.priority,
      relatedLead: values.relatedLead || null,
    };
    try {
      if (isEdit) {
        await tasksApi.update(task._id, payload);
        toast.success("Task updated");
      } else {
        await tasksApi.create(payload);
        toast.success("Task created");
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err?.message ?? "Something went wrong");
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit task" : "New task"}
      description={isEdit ? "Update the details below." : "Fill in the details to create a task."}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Title */}
        <Field label="Title" error={errors.title?.message}>
          <Input
            placeholder="e.g. Follow up with Acme Corp"
            {...register("title", { required: "Title is required" })}
          />
        </Field>

        {/* Description */}
        <Field label="Description">
          <Textarea rows={3} placeholder="Optional notes…" {...register("description")} />
        </Field>

        {/* Due date + Priority */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Due date">
            <Input type="date" {...register("dueDate")} />
          </Field>
          <Field label="Priority">
            <Select {...register("priority")}>
              {TASK_PRIORITIES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </Select>
          </Field>
        </div>

        {/* Status */}
        <Field label="Status">
          <Select {...register("status")}>
            {TASK_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
        </Field>

        {/* Linked lead */}
        <Field label="Linked lead">
          <Select {...register("relatedLead")}>
            <option value="">No linked lead</option>
            {leads.map((l) => (
              <option key={l._id} value={l._id}>
                {l.name}{l.company ? ` — ${l.company}` : ""}
              </option>
            ))}
          </Select>
        </Field>

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1" loading={isSubmitting}>
            {isEdit ? "Save changes" : "Create task"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

// ─── Single task row (module-level component) ─────────────────────────────────
function TaskRow({ task, onToggle, onEdit, onDelete }) {
  const done    = task.status === "Completed";
  const inProg  = task.status === "In Progress";
  const overdue = isOverdue(task);
  const dueToday = task.dueDate ? isToday(new Date(task.dueDate)) : false;

  return (
    <div className="group relative flex items-start gap-3 px-5 py-4 transition-colors hover:bg-surface-muted/50">
      {/* Priority accent bar — always visible, not only on hover */}
      <span
        aria-hidden
        className={cn(
          "absolute left-0 top-3 bottom-3 w-[3px] rounded-full",
          PRIORITY_BAR[task.priority] ?? "bg-slate-300"
        )}
      />

      {/* Status toggle */}
      <button
        onClick={() => onToggle(task)}
        aria-label={done ? "Mark as pending" : "Mark as completed"}
        className={cn(
          "mt-0.5 shrink-0 rounded-full p-0.5 transition-colors",
          done
            ? "text-brand-600 hover:text-brand-400"
            : inProg
            ? "text-sky-500 hover:text-brand-500"
            : "text-ink-soft hover:text-brand-500"
        )}
      >
        {done ? (
          <CheckCircle2 className="h-5 w-5" />
        ) : inProg ? (
          <CircleDot className="h-5 w-5" />
        ) : (
          <Circle className="h-5 w-5" />
        )}
      </button>

      {/* Main content */}
      <div className="min-w-0 flex-1">
        {/* Title */}
        <p
          className={cn(
            "text-sm font-medium leading-snug",
            done ? "line-through text-ink-soft" : "text-ink"
          )}
        >
          {task.title}
        </p>

        {/* Description */}
        {task.description && (
          <p className="mt-0.5 truncate text-xs text-ink-soft">{task.description}</p>
        )}

        {/* Meta chips */}
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {/* Due date chip */}
          {task.dueDate && (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-medium",
                overdue
                  ? "bg-rose-50 text-rose-700"
                  : dueToday
                  ? "bg-amber-50 text-amber-700"
                  : "bg-surface-muted text-ink-soft"
              )}
            >
              {overdue ? (
                <AlertTriangle className="h-3 w-3" />
              ) : (
                <Clock className="h-3 w-3" />
              )}
              {overdue ? `Overdue · ${shortDate(task.dueDate)}` : dueToday ? `Today · ${shortDate(task.dueDate)}` : shortDate(task.dueDate)}
            </span>
          )}

          {/* Priority badge */}
          <Badge className={cn("text-xs", PRIORITY_STYLES[task.priority])}>
            {task.priority}
          </Badge>

          {/* Status badge */}
          <Badge className={cn("text-xs", TASK_STATUS_STYLES[task.status])}>
            {task.status}
          </Badge>

          {/* Linked lead chip */}
          {task.relatedLead && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
              <Building2 className="h-3 w-3" />
              {task.relatedLead.name}
            </span>
          )}
        </div>
      </div>

      {/* Row actions */}
      <div className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100">
        <Dropdown
          trigger={
            <button className="rounded-lg p-1.5 text-ink-soft transition hover:bg-surface-muted hover:text-ink">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          }
        >
          <DropdownItem onClick={() => onEdit(task)}>
            <Pencil className="h-4 w-4" /> Edit
          </DropdownItem>
          <DropdownItem danger onClick={() => onDelete(task)}>
            <Trash2 className="h-4 w-4" /> Delete
          </DropdownItem>
        </Dropdown>
      </div>
    </div>
  );
}

// ─── Group section header (module-level) ──────────────────────────────────────
function GroupHeader({ label, count, labelClass, countClass }) {
  return (
    <div className="flex items-center gap-2 border-b border-line bg-surface-muted/30 px-5 py-2">
      <span className={cn("text-xs font-semibold uppercase tracking-wide", labelClass)}>
        {label}
      </span>
      <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", countClass)}>
        {count}
      </span>
    </div>
  );
}

// ─── Completion progress bar card (module-level) ──────────────────────────────
function ProgressCard({ completed, total }) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  return (
    <Card className="px-5 py-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-ink">
          {completed} of {total} tasks done
        </span>
        <span className="text-sm font-semibold text-brand-700">{pct}%</span>
      </div>
      {/* Track */}
      <div className="h-2 w-full rounded-full bg-surface-muted overflow-hidden">
        {/* Fill — inline style for dynamic width, class for gradient */}
        <div
          className="h-full rounded-full bg-linear-to-r from-brand-400 to-brand-600 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Tasks() {
  // Raw data
  const [tasks, setTasks] = useState(null);
  const [leads, setLeads] = useState([]);

  // UI state
  const [tab, setTab] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // ── Data loading ─────────────────────────────────────────────────────────
  const load = () => {
    setTasks(null);
    tasksApi.list().then((res) => setTasks(res.tasks)).catch(() => setTasks([]));
  };

  useEffect(() => {
    load();
    leadsApi.list().then((res) => setLeads(res.leads)).catch(() => {});
  }, []);

  // ── KPI counts ───────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    if (!tasks) return { total: 0, pending: 0, overdue: 0, completed: 0 };
    return {
      total:     tasks.length,
      pending:   tasks.filter((t) => t.status === "Pending").length,
      overdue:   tasks.filter(isOverdue).length,
      completed: tasks.filter((t) => t.status === "Completed").length,
    };
  }, [tasks]);

  // ── Tab-filtered list ─────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    if (!tasks) return [];
    if (tab === "all") return tasks;
    return tasks.filter((t) => t.status === tab);
  }, [tasks, tab]);

  // ── Group the filtered tasks into timeline buckets ────────────────────────
  const groupedSections = useMemo(() => {
    // Build a map: groupKey → [tasks]
    const map = {};
    GROUPS.forEach((g) => (map[g.key] = []));
    filtered.forEach((t) => {
      const key = groupKey(t);
      map[key].push(t);
    });
    // Return only non-empty groups in display order
    return GROUPS.filter((g) => map[g.key].length > 0).map((g) => ({
      ...g,
      tasks: map[g.key],
    }));
  }, [filtered]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const openNew = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (task) => {
    setEditing(task);
    setFormOpen(true);
  };

  /** Toggle task: Completed ↔ Pending (In Progress tasks also toggle to Completed). */
  const handleToggle = async (task) => {
    const next = task.status === "Completed" ? "Pending" : "Completed";
    try {
      await tasksApi.update(task._id, { status: next });
      load();
    } catch (err) {
      toast.error(err?.message ?? "Could not update task");
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await tasksApi.remove(toDelete._id);
      toast.success("Task deleted");
      setToDelete(null);
      load();
    } catch (err) {
      toast.error(err?.message ?? "Could not delete task");
    } finally {
      setDeleting(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Page header */}
      <PageHeader title="Follow-ups" subtitle="Stay on top of every commitment.">
        <Button onClick={openNew}>
          <Plus className="h-4 w-4" /> Add task
        </Button>
      </PageHeader>

      {/* KPI stat cards */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label="Total tasks"  value={stats.total}     icon={CalendarCheck} />
        <StatCard label="Pending"      value={stats.pending}   icon={Circle} />
        <StatCard label="Overdue"      value={stats.overdue}   icon={AlertTriangle} />
        <StatCard label="Completed"    value={stats.completed} icon={CheckCircle2} accent />
      </div>

      {/* Completion progress bar */}
      {tasks !== null && (
        <ProgressCard completed={stats.completed} total={stats.total} />
      )}

      {/* Status filter tabs + grouped task list */}
      <Card className="overflow-hidden">
        {/* Tabs toolbar */}
        <div className="border-b border-line px-5 py-3">
          <Tabs value={tab} onChange={setTab} tabs={STATUS_TABS} />
        </div>

        {/* Body */}
        {tasks === null ? (
          <div className="flex items-center justify-center py-16">
            <Spinner />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={CalendarCheck}
            title="No tasks here"
            description={
              tab === "all"
                ? "Add your first follow-up to get started."
                : `No tasks with status "${tab}".`
            }
            action={
              tab === "all" ? (
                <Button onClick={openNew}>
                  <Plus className="h-4 w-4" /> Add task
                </Button>
              ) : null
            }
          />
        ) : (
          <div>
            {groupedSections.map((group) => (
              <div key={group.key}>
                <GroupHeader
                  label={group.label}
                  count={group.tasks.length}
                  labelClass={group.labelClass}
                  countClass={group.countClass}
                />
                <div className="divide-y divide-line">
                  {group.tasks.map((task) => (
                    <TaskRow
                      key={task._id}
                      task={task}
                      onToggle={handleToggle}
                      onEdit={openEdit}
                      onDelete={setToDelete}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Add / Edit dialog */}
      <TaskFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        task={editing}
        leads={leads}
        onSaved={load}
      />

      {/* Delete confirmation */}
      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Delete this task?"
        description={`"${toDelete?.title}" will be permanently removed.`}
        confirmLabel="Delete task"
      />
    </div>
  );
}
