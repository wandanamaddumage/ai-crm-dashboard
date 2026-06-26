import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Pin,
  PinOff,
  StickyNote,
  Link2,
  X,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "../components/common/PageHeader";
import { EmptyState } from "../components/common/EmptyState";
import { ConfirmDialog } from "../components/common/ConfirmDialog";
import {
  Button,
  Card,
  Textarea,
  Select,
  Field,
  Badge,
  Dialog,
  Dropdown,
  DropdownItem,
  Spinner,
} from "../components/ui";
import { notesApi, leadsApi } from "../lib/services";
import { relative } from "../lib/format";
import { cn } from "../lib/utils";

// ── StatTile (copied from Leads premium pattern) ───────────────────────────────
function StatTile({ icon: Icon, label, value, tint }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl", tint)}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs text-ink-soft">{label}</p>
          <p className="font-display text-lg font-bold text-ink">{value}</p>
        </div>
      </div>
    </Card>
  );
}

// ── FilterChip (same shape as Leads' StageChip) ────────────────────────────────
function FilterChip({ label, count, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition",
        active
          ? "border-transparent bg-brand-600 text-white shadow-sm"
          : "border-line bg-surface text-ink-soft hover:bg-surface-muted hover:text-ink"
      )}
    >
      {label}
      <span
        className={cn(
          "rounded-full px-1.5 text-xs font-semibold",
          active ? "bg-white/20 text-white" : "bg-surface-muted text-ink-soft"
        )}
      >
        {count}
      </span>
    </button>
  );
}

// ── NoteCard ───────────────────────────────────────────────────────────────────
function NoteCard({ note, onEdit, onDelete, onTogglePin }) {
  // Prefer lead over contact for the linked-entity chip
  const entity = note.lead ?? note.contact ?? null;

  return (
    <div
      className={cn(
        "break-inside-avoid relative flex flex-col gap-3 overflow-hidden rounded-2xl bg-surface p-5",
        "border border-line shadow-(--shadow-card) transition hover:shadow-(--shadow-pop)",
        note.pinned && "ring-1 ring-brand-200"
      )}
    >
      {/* Pinned accent strip along the top */}
      {note.pinned && (
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-linear-to-r from-brand-400 to-brand-600" />
      )}

      {/* Pinned icon badge */}
      {note.pinned && (
        <span className="absolute right-4 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-brand-50 text-brand-500">
          <Pin className="h-3.5 w-3.5" aria-label="Pinned" />
        </span>
      )}

      {/* Note content */}
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink pr-6">
        {note.content}
      </p>

      {/* Footer: linked chip + timestamp + actions */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          {entity && (
            <Badge className="inline-flex items-center gap-1 bg-brand-50 text-brand-700 border-brand-100 text-xs font-medium max-w-[160px] truncate">
              <Link2 className="h-3 w-3 shrink-0" />
              <span className="truncate">{entity.name}</span>
            </Badge>
          )}
          <span className="text-xs text-ink-soft">{relative(note.createdAt)}</span>
        </div>

        {/* Overflow menu */}
        <div onClick={(e) => e.stopPropagation()} className="shrink-0">
          <Dropdown
            trigger={
              <button
                className="rounded-lg p-1.5 text-ink-soft transition hover:bg-surface-muted"
                aria-label="Note options"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            }
          >
            <DropdownItem onClick={() => onTogglePin(note)}>
              {note.pinned ? (
                <>
                  <PinOff className="h-4 w-4" /> Unpin
                </>
              ) : (
                <>
                  <Pin className="h-4 w-4" /> Pin
                </>
              )}
            </DropdownItem>
            <DropdownItem onClick={() => onEdit(note)}>
              <Pencil className="h-4 w-4" /> Edit
            </DropdownItem>
            <DropdownItem danger onClick={() => onDelete(note)}>
              <Trash2 className="h-4 w-4" /> Delete
            </DropdownItem>
          </Dropdown>
        </div>
      </div>
    </div>
  );
}

// ── NoteFormDialog ─────────────────────────────────────────────────────────────
function NoteFormDialog({ open, onClose, note, leads, onSaved }) {
  const isEditing = Boolean(note);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  // Reset form whenever the dialog opens or the note being edited changes
  useEffect(() => {
    if (open) {
      reset({
        content: note?.content ?? "",
        lead: note?.lead?._id ?? "",
        pinned: note?.pinned ?? false,
      });
    }
  }, [open, note, reset]);

  const onSubmit = async (values) => {
    const payload = {
      content: values.content,
      pinned: values.pinned,
      // Pass lead id only if selected; undefined removes the field on update
      lead: values.lead || undefined,
    };

    try {
      if (isEditing) {
        await notesApi.update(note._id, payload);
        toast.success("Note updated");
      } else {
        await notesApi.create(payload);
        toast.success("Note created");
      }
      onSaved();
    } catch (err) {
      toast.error(err.message ?? "Could not save note");
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isEditing ? "Edit note" : "New note"}
      description={
        isEditing ? "Update your note below." : "Add a note linked to a lead or contact."
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 mt-2">
        {/* Content */}
        <Field label="Note" error={errors.content?.message}>
          <Textarea
            rows={6}
            placeholder="Write your note here…"
            {...register("content", { required: "Note content is required." })}
          />
        </Field>

        {/* Lead picker */}
        <Field label="Link to lead">
          <Select {...register("lead")}>
            <option value="">No linked lead</option>
            {leads.map((l) => (
              <option key={l._id} value={l._id}>
                {l.name}{l.company ? ` — ${l.company}` : ""}
              </option>
            ))}
          </Select>
        </Field>

        {/* Pinned pill toggle */}
        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-line bg-surface-muted/40 px-4 py-3 transition hover:bg-surface-muted/70">
          <div className="relative flex-shrink-0">
            <input type="checkbox" className="peer sr-only" {...register("pinned")} />
            {/* Custom pill */}
            <div className="h-5 w-9 rounded-full bg-line transition peer-checked:bg-brand-500" />
            <div className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-surface shadow transition peer-checked:translate-x-4" />
          </div>
          <div>
            <p className="text-sm font-medium text-ink">Pin this note</p>
            <p className="text-xs text-ink-soft">Pinned notes appear at the top of the list.</p>
          </div>
        </label>

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1" loading={isSubmitting}>
            {isEditing ? "Save changes" : "Create note"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function Notes() {
  // ── Data ─────────────────────────────────────────────────────────────────
  const [notes, setNotes] = useState(null);  // null = loading
  const [leads, setLeads] = useState([]);    // lead picker options

  // ── UI state ──────────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all"); // "all" | "pinned" | "linked" | "unlinked"
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const load = () => {
    setNotes(null);
    notesApi.list().then((res) => setNotes(res.notes)).catch(() => setNotes([]));
  };

  useEffect(() => {
    load();
    leadsApi.list().then((res) => setLeads(res.leads ?? [])).catch(() => {});
  }, []);

  // ── KPI counts (stable — independent of active filter) ───────────────────
  const kpis = useMemo(() => {
    const list = notes || [];
    return {
      total: list.length,
      pinned: list.filter((n) => n.pinned).length,
      linked: list.filter((n) => n.lead || n.contact).length,
      unlinked: list.filter((n) => !n.lead && !n.contact).length,
    };
  }, [notes]);

  // ── Quick-filter chip counts ──────────────────────────────────────────────
  const chipCounts = useMemo(() => ({
    all: kpis.total,
    pinned: kpis.pinned,
    linked: kpis.linked,
    unlinked: kpis.unlinked,
  }), [kpis]);

  // ── Client-side filtering (search + quick-filter chip) ───────────────────
  const filtered = useMemo(() => {
    if (!notes) return [];
    let list = notes;

    // Quick-filter chip
    if (filter === "pinned") list = list.filter((n) => n.pinned);
    else if (filter === "linked") list = list.filter((n) => n.lead || n.contact);
    else if (filter === "unlinked") list = list.filter((n) => !n.lead && !n.contact);

    // Content search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((n) => n.content?.toLowerCase().includes(q));
    }

    return list;
  }, [notes, filter, search]);

  const isActive = search.trim() || filter !== "all";

  // ── Handlers ──────────────────────────────────────────────────────────────
  const openNew = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (note) => { setEditing(note); setFormOpen(true); };
  const handleSaved = () => { setFormOpen(false); load(); };

  const handleTogglePin = async (note) => {
    try {
      await notesApi.update(note._id, { pinned: !note.pinned });
      toast.success(note.pinned ? "Note unpinned" : "Note pinned");
      load();
    } catch (err) {
      toast.error(err.message ?? "Could not update note");
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await notesApi.remove(toDelete._id);
      toast.success("Note deleted");
      setToDelete(null);
      load();
    } catch (err) {
      toast.error(err.message ?? "Could not delete note");
    } finally {
      setDeleting(false);
    }
  };

  const clearAll = () => { setSearch(""); setFilter("all"); };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Page header */}
      <PageHeader title="Notes" subtitle="Capture context across your deals and contacts.">
        <Button onClick={openNew}>
          <Plus className="h-4 w-4" /> New note
        </Button>
      </PageHeader>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile
          icon={StickyNote}
          tint="bg-brand-50 text-brand-600"
          label="Total notes"
          value={kpis.total}
        />
        <StatTile
          icon={Pin}
          tint="bg-amber-50 text-amber-600"
          label="Pinned"
          value={kpis.pinned}
        />
        <StatTile
          icon={Link2}
          tint="bg-sky-50 text-sky-600"
          label="Linked"
          value={kpis.linked}
        />
        <StatTile
          icon={FileText}
          tint="bg-slate-50 text-slate-500"
          label="Unlinked"
          value={kpis.unlinked}
        />
      </div>

      {/* Toolbar */}
      <Card className="space-y-4 p-4">
        {/* Search row */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notes…"
            className="h-10 w-full rounded-xl border border-line bg-surface pl-10 pr-4 text-sm text-ink placeholder:text-ink-soft/60 transition focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>

        {/* Quick-filter chips + result count */}
        <div className="flex flex-wrap items-center gap-2">
          <FilterChip
            label="All"
            count={chipCounts.all}
            active={filter === "all"}
            onClick={() => setFilter("all")}
          />
          <FilterChip
            label="Pinned"
            count={chipCounts.pinned}
            active={filter === "pinned"}
            onClick={() => setFilter("pinned")}
          />
          <FilterChip
            label="Linked"
            count={chipCounts.linked}
            active={filter === "linked"}
            onClick={() => setFilter("linked")}
          />
          <FilterChip
            label="Unlinked"
            count={chipCounts.unlinked}
            active={filter === "unlinked"}
            onClick={() => setFilter("unlinked")}
          />

          <div className="ml-auto flex items-center gap-3">
            {isActive && (
              <button
                onClick={clearAll}
                className="inline-flex items-center gap-1 text-sm font-medium text-ink-soft transition hover:text-ink"
              >
                <X className="h-3.5 w-3.5" /> Clear
              </button>
            )}
            <span className="text-sm text-ink-soft">
              <span className="font-semibold text-ink">{filtered.length}</span> of{" "}
              {notes?.length ?? 0}
            </span>
          </div>
        </div>
      </Card>

      {/* Masonry grid / loading / empty */}
      {notes === null ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={StickyNote}
          title={isActive ? "No notes match" : "No notes yet"}
          description={
            isActive
              ? "Try adjusting your search or filters."
              : "Start capturing context for your leads and deals."
          }
          action={
            !isActive ? (
              <Button onClick={openNew}>
                <Plus className="h-4 w-4" /> New note
              </Button>
            ) : undefined
          }
        />
      ) : (
        /* Masonry via CSS columns */
        <div className="columns-1 sm:columns-2 xl:columns-3 gap-4 *:mb-4">
          {filtered.map((note) => (
            <NoteCard
              key={note._id}
              note={note}
              onEdit={openEdit}
              onDelete={setToDelete}
              onTogglePin={handleTogglePin}
            />
          ))}
        </div>
      )}

      {/* New / Edit dialog */}
      <NoteFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        note={editing}
        leads={leads}
        onSaved={handleSaved}
      />

      {/* Delete confirmation */}
      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Delete this note?"
        description="This note will be permanently removed and cannot be recovered."
        confirmLabel="Delete note"
      />
    </div>
  );
}
