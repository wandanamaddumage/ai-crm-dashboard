import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Mail,
  Phone,
  Building2,
  Star,
  Contact2,
  Tag,
  X,
  LayoutGrid,
  Table2,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "../components/common/PageHeader";
import { EmptyState } from "../components/common/EmptyState";
import { ConfirmDialog } from "../components/common/ConfirmDialog";
import {
  Button,
  Card,
  Input,
  Textarea,
  Field,
  Badge,
  Avatar,
  Dialog,
  Drawer,
  Dropdown,
  DropdownItem,
  Spinner,
} from "../components/ui";
import { contactsApi } from "../lib/services";
import { relative, shortDate } from "../lib/format";
import { cn } from "../lib/utils";

/* ─── useFlip ─────────────────────────────────────────────────────────────────
   FLIP animation: when the ordered list changes (e.g. a contact is starred and
   floats to the top), smoothly slide each card from its previous position to
   its new one. Reads element rects before/after the reorder and animates the
   inverse transform to zero. Respects prefers-reduced-motion.
   ──────────────────────────────────────────────────────────────────────────── */
function useFlip(dep) {
  const containerRef = useRef(null);
  const prevRects = useRef(new Map());

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const nodes = Array.from(el.querySelectorAll("[data-flip-id]"));

    // Measure all new positions first, before applying any transforms.
    const nextRects = new Map();
    nodes.forEach((n) => nextRects.set(n.dataset.flipId, n.getBoundingClientRect()));

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (!reduce) {
      nodes.forEach((n) => {
        const oldRect = prevRects.current.get(n.dataset.flipId);
        const newRect = nextRects.get(n.dataset.flipId);
        if (!oldRect) return; // newly added card — no slide-in
        const dx = oldRect.left - newRect.left;
        const dy = oldRect.top - newRect.top;
        if (dx || dy) {
          n.animate(
            [
              { transform: `translate(${dx}px, ${dy}px)` },
              { transform: "translate(0px, 0px)" },
            ],
            { duration: 350, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }
          );
        }
      });
    }

    prevRects.current = nextRects;
  }, [dep]);

  return containerRef;
}

/* ─── Contacts page ──────────────────────────────────────────────────────────
   Full CRUD management: KPI strip, tag chip filter bar, card/table views,
   drawer detail, add/edit dialog (react-hook-form), delete confirm.
   All filtering is client-side for instant response.
   ──────────────────────────────────────────────────────────────────────────── */
export default function Contacts() {
  // null = loading, [] = empty, [...] = loaded
  const [contacts, setContacts] = useState(null);
  const [filters, setFilters] = useState({ search: "", tag: "" });
  const [view, setView] = useState("grid"); // "grid" | "table"

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);   // contact being edited
  const [selected, setSelected] = useState(null); // contact open in drawer
  const [toDelete, setToDelete] = useState(null); // contact pending deletion
  const [deleting, setDeleting] = useState(false);
  const [favLoading, setFavLoading] = useState({}); // { [id]: bool }

  // Fetch all contacts and store them
  const load = () => {
    setContacts(null);
    contactsApi
      .list()
      .then((res) => setContacts(res.contacts))
      .catch(() => setContacts([]));
  };
  useEffect(load, []);

  // ── Derived data ────────────────────────────────────────────────────

  // Collect unique tags across all contacts for the chip filter row
  const allTags = useMemo(() => {
    if (!contacts) return [];
    const set = new Set();
    contacts.forEach((c) => (c.tags || []).forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [contacts]);

  // Per-tag counts (from all contacts, not just filtered) for live chip counts
  const tagCounts = useMemo(() => {
    const c = { All: contacts?.length || 0 };
    allTags.forEach((t) => {
      c[t] = (contacts || []).filter((contact) =>
        (contact.tags || []).includes(t)
      ).length;
    });
    return c;
  }, [contacts, allTags]);

  // KPI numbers computed from the full (unfiltered) contacts list
  const kpis = useMemo(() => {
    const list = contacts || [];
    const favorites = list.filter((c) => c.favorite).length;
    const uniqueCompanies = new Set(list.map((c) => c.company).filter(Boolean)).size;
    const tagged = list.filter((c) => (c.tags || []).length > 0).length;
    return { total: list.length, favorites, companies: uniqueCompanies, tagged };
  }, [contacts]);

  // Client-side filtering: search by name/email/company and by tag
  const filtered = useMemo(() => {
    if (!contacts) return [];
    return contacts.filter((c) => {
      if (filters.tag && !(c.tags || []).includes(filters.tag)) return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        return (
          c.name?.toLowerCase().includes(q) ||
          c.email?.toLowerCase().includes(q) ||
          c.company?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [contacts, filters]);

  // Favorites float to the top; everything else keeps its relative order
  // (Array.prototype.sort is stable).
  const ordered = useMemo(
    () => [...filtered].sort((a, b) => (b.favorite ? 1 : 0) - (a.favorite ? 1 : 0)),
    [filtered]
  );

  const filtersActive = filters.search || filters.tag;

  // FLIP refs — animate cards/rows sliding to their new position on reorder.
  const gridRef = useFlip(ordered);
  const tableRef = useFlip(ordered);

  // ── Handlers ──────────────────────────────────────────────────────

  const openNew = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (contact) => {
    setSelected(null);
    setEditing(contact);
    setFormOpen(true);
  };

  const handleSaved = () => load();

  // Toggle favorite star — optimistic in-place update (no full reload, so the
  // grid doesn't unmount and the scroll position is preserved).
  const toggleFavorite = async (e, contact) => {
    e.stopPropagation();
    if (favLoading[contact._id]) return;
    const next = !contact.favorite;
    setFavLoading((prev) => ({ ...prev, [contact._id]: true }));
    // Flip the star immediately in local state.
    setContacts((prev) =>
      (prev || []).map((c) => (c._id === contact._id ? { ...c, favorite: next } : c))
    );
    try {
      await contactsApi.update(contact._id, { favorite: next });
    } catch (err) {
      // Revert on failure.
      setContacts((prev) =>
        (prev || []).map((c) =>
          c._id === contact._id ? { ...c, favorite: !next } : c
        )
      );
      toast.error(err?.message || "Could not update favorite");
    } finally {
      setFavLoading((prev) => ({ ...prev, [contact._id]: false }));
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await contactsApi.remove(toDelete._id);
      toast.success("Contact removed");
      setToDelete(null);
      setSelected(null);
      load();
    } catch (err) {
      toast.error(err?.message || "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Page header ── */}
      <PageHeader
        title="Contacts"
        subtitle="Your people and professional relationships."
      >
        <Button onClick={openNew}>
          <Plus className="h-4 w-4" /> Add contact
        </Button>
      </PageHeader>

      {/* ── KPI strip ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile
          icon={Users}
          tint="bg-brand-50 text-brand-600"
          label="Total contacts"
          value={kpis.total}
        />
        <StatTile
          icon={Star}
          tint="bg-amber-50 text-amber-500"
          label="Favorites"
          value={kpis.favorites}
        />
        <StatTile
          icon={Building2}
          tint="bg-sky-50 text-sky-600"
          label="Companies"
          value={kpis.companies}
        />
        <StatTile
          icon={Tag}
          tint="bg-violet-50 text-violet-600"
          label="Tagged"
          value={kpis.tagged}
        />
      </div>

      {/* ── Toolbar Card ── */}
      <Card className="space-y-4 p-4">
        {/* Search */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
          <input
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            placeholder="Search by name, email, or company…"
            className="h-10 w-full rounded-xl border border-line bg-surface pl-10 pr-4 text-sm text-ink placeholder:text-ink-soft/60 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition"
          />
        </div>

        {/* Tag chips + meta row */}
        <div className="flex flex-wrap items-center gap-2">
          {/* "All" chip */}
          <TagChip
            label="All"
            count={tagCounts.All}
            active={!filters.tag}
            onClick={() => setFilters({ ...filters, tag: "" })}
          />
          {/* One chip per unique tag */}
          {allTags.map((t) => (
            <TagChip
              key={t}
              label={t}
              count={tagCounts[t] || 0}
              active={filters.tag === t}
              onClick={() =>
                setFilters({ ...filters, tag: filters.tag === t ? "" : t })
              }
            />
          ))}

          {/* Right-aligned controls */}
          <div className="ml-auto flex items-center gap-3">
            {filtersActive && (
              <button
                onClick={() => setFilters({ search: "", tag: "" })}
                className="inline-flex items-center gap-1 text-sm font-medium text-ink-soft transition hover:text-ink"
              >
                <X className="h-3.5 w-3.5" /> Clear
              </button>
            )}
            <span className="text-sm text-ink-soft">
              <span className="font-semibold text-ink">{filtered.length}</span> of{" "}
              {contacts?.length ?? 0}
            </span>
            <ViewToggle view={view} onChange={setView} />
          </div>
        </div>
      </Card>

      {/* ── Results — loading / empty / grid / table ── */}
      {contacts === null ? (
        <div className="flex items-center justify-center py-20">
          <Spinner />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Contact2}
          title={filtersActive ? "No contacts match" : "No contacts yet"}
          description={
            filtersActive
              ? "Try different search terms or clear the tag filter."
              : "Add your first contact to start building your network."
          }
          action={
            !filtersActive ? (
              <Button onClick={openNew}>
                <Plus className="h-4 w-4" /> Add contact
              </Button>
            ) : null
          }
        />
      ) : view === "grid" ? (
        /* ── Card grid view ── */
        <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {ordered.map((contact) => (
            <ContactCard
              key={contact._id}
              contact={contact}
              flipId={contact._id}
              favLoading={!!favLoading[contact._id]}
              onToggleFavorite={toggleFavorite}
              onOpen={() => setSelected(contact)}
              onEdit={() => openEdit(contact)}
              onDelete={() => setToDelete(contact)}
            />
          ))}
        </div>
      ) : (
        /* ── Table view ── */
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-line bg-surface-muted/40">
                <tr className="text-left text-xs uppercase tracking-wide text-ink-soft">
                  <th className="px-6 py-3.5 font-medium">Contact</th>
                  <th className="px-6 py-3.5 font-medium">Title</th>
                  <th className="px-6 py-3.5 font-medium">Tags</th>
                  <th className="px-6 py-3.5 font-medium">Email</th>
                  <th className="px-6 py-3.5 font-medium">Phone</th>
                  <th className="px-6 py-3.5 w-24" />
                </tr>
              </thead>
              <tbody ref={tableRef}>
                {ordered.map((contact) => (
                  <ContactTableRow
                    key={contact._id}
                    contact={contact}
                    flipId={contact._id}
                    favLoading={!!favLoading[contact._id]}
                    onToggleFavorite={toggleFavorite}
                    onOpen={() => setSelected(contact)}
                    onEdit={() => openEdit(contact)}
                    onDelete={() => setToDelete(contact)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ── Detail Drawer ── */}
      <ContactDrawer
        open={Boolean(selected)}
        contact={selected}
        onClose={() => setSelected(null)}
        onEdit={() => openEdit(selected)}
        onDelete={() => setToDelete(selected)}
      />

      {/* ── Add / Edit Dialog ── */}
      <ContactFormDialog
        open={formOpen}
        contact={editing}
        onClose={() => setFormOpen(false)}
        onSaved={handleSaved}
      />

      {/* ── Delete confirmation ── */}
      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Remove this contact?"
        description={`"${toDelete?.name}" will be permanently deleted and cannot be recovered.`}
        confirmLabel="Remove contact"
      />
    </div>
  );
}

/* ─── StatTile ───────────────────────────────────────────────────────────────
   KPI card: tinted icon square + label + large value.
   Copied from Leads' StatTile pattern.
   ──────────────────────────────────────────────────────────────────────────── */
function StatTile({ icon: Icon, label, value, tint }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl",
            tint
          )}
        >
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

/* ─── TagChip ────────────────────────────────────────────────────────────────
   Quick-filter pill for a single tag. Copied from Leads' StageChip pattern.
   ──────────────────────────────────────────────────────────────────────────── */
function TagChip({ label, count, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition",
        active
          ? "border-transparent bg-brand-600 text-white shadow-sm"
          : "border-line bg-surface text-ink-soft hover:text-ink hover:bg-surface-muted"
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

/* ─── ViewToggle ─────────────────────────────────────────────────────────────
   Segmented Table2 / LayoutGrid icon toggle. Copied from Leads.
   ──────────────────────────────────────────────────────────────────────────── */
function ViewToggle({ view, onChange }) {
  const options = [
    { value: "grid", icon: LayoutGrid, label: "Card view" },
    { value: "table", icon: Table2, label: "Table view" },
  ];
  return (
    <div className="flex items-center gap-1 rounded-full border border-line bg-surface-muted p-1">
      {options.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => onChange(value)}
          title={label}
          aria-label={label}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full transition",
            view === value
              ? "bg-surface text-ink shadow-sm"
              : "text-ink-soft hover:text-ink"
          )}
        >
          <Icon className="h-4 w-4" />
        </button>
      ))}
    </div>
  );
}

/* ─── ContactCard ────────────────────────────────────────────────────────────
   Single premium contact tile for the card grid view.
   Shows avatar, name, title/company, favorite toggle, tags, email/phone.
   ──────────────────────────────────────────────────────────────────────────── */
function ContactCard({
  contact,
  flipId,
  favLoading,
  onToggleFavorite,
  onOpen,
  onEdit,
  onDelete,
}) {
  return (
    <div
      data-flip-id={flipId}
      onClick={onOpen}
      className="relative cursor-pointer rounded-2xl border border-line bg-surface p-5 shadow-(--shadow-card) transition-all duration-200 hover:-translate-y-0.5 hover:shadow-(--shadow-pop)"
    >
      {/* Favorite star — top right, stopPropagation so card click doesn't fire */}
      <button
        onClick={(e) => onToggleFavorite(e, contact)}
        disabled={favLoading}
        aria-label={contact.favorite ? "Unmark favorite" : "Mark as favorite"}
        className="absolute right-4 top-4 rounded-lg p-1 text-ink-soft/40 transition hover:text-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
      >
        <Star
          className={cn(
            "h-4 w-4 transition",
            contact.favorite ? "fill-amber-400 text-amber-400" : ""
          )}
        />
      </button>

      {/* Dropdown — positioned below the star */}
      <div
        className="absolute right-3 top-10 mt-1"
        onClick={(e) => e.stopPropagation()}
      >
        <Dropdown
          trigger={
            <button className="rounded-lg p-1.5 text-ink-soft/50 transition hover:bg-surface-muted hover:text-ink-soft">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          }
        >
          <DropdownItem onClick={onEdit}>
            <Pencil className="h-4 w-4" /> Edit
          </DropdownItem>
          <DropdownItem danger onClick={onDelete}>
            <Trash2 className="h-4 w-4" /> Delete
          </DropdownItem>
        </Dropdown>
      </div>

      {/* Avatar + identity */}
      <div className="flex items-start gap-3 pr-8">
        <Avatar name={contact.name} size="md" />
        <div className="min-w-0">
          <p className="font-semibold text-ink leading-tight truncate">
            {contact.name}
          </p>
          {(contact.title || contact.company) && (
            <p className="mt-0.5 text-sm text-ink-soft truncate">
              {[contact.title, contact.company].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
      </div>

      {/* Tags */}
      {contact.tags?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {contact.tags.slice(0, 3).map((tag) => (
            <Badge
              key={tag}
              className="bg-brand-50 text-brand-700 text-[11px] px-2 py-0.5"
            >
              {tag}
            </Badge>
          ))}
          {contact.tags.length > 3 && (
            <Badge className="bg-surface-muted text-ink-soft text-[11px] px-2 py-0.5">
              +{contact.tags.length - 3}
            </Badge>
          )}
        </div>
      )}

      {/* Contact info rows */}
      <div className="mt-3 space-y-1.5">
        {contact.email && (
          <div className="flex items-center gap-2 text-sm text-ink-soft min-w-0">
            <Mail className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{contact.email}</span>
          </div>
        )}
        {contact.phone && (
          <div className="flex items-center gap-2 text-sm text-ink-soft">
            <Phone className="h-3.5 w-3.5 shrink-0" />
            <span>{contact.phone}</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── ContactTableRow ────────────────────────────────────────────────────────
   Single row for the table view.
   ──────────────────────────────────────────────────────────────────────────── */
function ContactTableRow({
  contact,
  flipId,
  favLoading,
  onToggleFavorite,
  onOpen,
  onEdit,
  onDelete,
}) {
  return (
    <tr
      data-flip-id={flipId}
      onClick={onOpen}
      className="group cursor-pointer border-b border-line last:border-0 transition hover:bg-surface-muted/50"
    >
      {/* Contact (avatar + name + company) */}
      <td className="px-6 py-3.5">
        <div className="flex items-center gap-3">
          <Avatar name={contact.name} size="sm" />
          <div>
            <p className="font-medium text-ink">{contact.name}</p>
            <p className="text-xs text-ink-soft">
              {contact.company || contact.email || "—"}
            </p>
          </div>
        </div>
      </td>

      {/* Title */}
      <td className="px-6 py-3.5 text-sm text-ink-soft">
        {contact.title || "—"}
      </td>

      {/* Tags */}
      <td className="px-6 py-3.5">
        <div className="flex flex-wrap gap-1">
          {(contact.tags || []).slice(0, 2).map((tag) => (
            <Badge
              key={tag}
              className="bg-brand-50 text-brand-700 text-[11px] px-2 py-0.5"
            >
              {tag}
            </Badge>
          ))}
          {(contact.tags || []).length > 2 && (
            <Badge className="bg-surface-muted text-ink-soft text-[11px] px-2 py-0.5">
              +{contact.tags.length - 2}
            </Badge>
          )}
          {!(contact.tags?.length) && (
            <span className="text-xs text-ink-soft/50">—</span>
          )}
        </div>
      </td>

      {/* Email */}
      <td className="px-6 py-3.5 text-sm text-ink-soft">
        {contact.email ? (
          <a
            href={`mailto:${contact.email}`}
            onClick={(e) => e.stopPropagation()}
            className="hover:text-brand-700 hover:underline transition"
          >
            {contact.email}
          </a>
        ) : (
          "—"
        )}
      </td>

      {/* Phone */}
      <td className="px-6 py-3.5 text-sm text-ink-soft">
        {contact.phone || "—"}
      </td>

      {/* Actions */}
      <td className="px-6 py-3.5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-end gap-1">
          {/* Favorite star */}
          <button
            onClick={(e) => onToggleFavorite(e, contact)}
            disabled={favLoading}
            aria-label={contact.favorite ? "Unmark favorite" : "Mark as favorite"}
            className="rounded-lg p-1.5 text-ink-soft/40 transition hover:text-amber-400"
          >
            <Star
              className={cn(
                "h-4 w-4 transition",
                contact.favorite ? "fill-amber-400 text-amber-400" : ""
              )}
            />
          </button>
          <Dropdown
            trigger={
              <button className="rounded-lg p-1.5 text-ink-soft transition hover:bg-surface-muted">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            }
          >
            <DropdownItem onClick={onEdit}>
              <Pencil className="h-4 w-4" /> Edit
            </DropdownItem>
            <DropdownItem danger onClick={onDelete}>
              <Trash2 className="h-4 w-4" /> Delete
            </DropdownItem>
          </Dropdown>
        </div>
      </td>
    </tr>
  );
}

/* ─── ContactDrawer ──────────────────────────────────────────────────────────
   Right slide-over detail panel for a single contact.
   ──────────────────────────────────────────────────────────────────────────── */
function ContactDrawer({ open, contact, onClose, onEdit, onDelete }) {
  if (!contact) return null;

  return (
    <Drawer open={open} onClose={onClose} title="Contact details">
      <div className="space-y-6">
        {/* Identity hero */}
        <div className="flex items-center gap-4">
          <Avatar name={contact.name} size="lg" />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold text-ink">{contact.name}</h2>
              {contact.favorite && (
                <Star className="h-4 w-4 fill-amber-400 text-amber-400 shrink-0" />
              )}
            </div>
            {(contact.title || contact.company) && (
              <p className="text-sm text-ink-soft mt-0.5">
                {[contact.title, contact.company].filter(Boolean).join(" · ")}
              </p>
            )}
            {contact.favorite && (
              <Badge className="mt-1.5 bg-amber-50 text-amber-700 text-[11px]">
                Favorite
              </Badge>
            )}
          </div>
        </div>

        {/* Contact fields */}
        <div className="rounded-2xl border border-line divide-y divide-line">
          {contact.email && (
            <DrawerRow icon={<Mail className="h-4 w-4" />} label="Email">
              <a
                href={`mailto:${contact.email}`}
                className="text-brand-700 hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {contact.email}
              </a>
            </DrawerRow>
          )}
          {contact.phone && (
            <DrawerRow icon={<Phone className="h-4 w-4" />} label="Phone">
              <a
                href={`tel:${contact.phone}`}
                className="text-brand-700 hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {contact.phone}
              </a>
            </DrawerRow>
          )}
          {contact.company && (
            <DrawerRow icon={<Building2 className="h-4 w-4" />} label="Company">
              <span className="text-ink">{contact.company}</span>
            </DrawerRow>
          )}
        </div>

        {/* Tags */}
        {contact.tags?.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-ink-soft uppercase tracking-wide mb-2">
              <Tag className="h-3.5 w-3.5" /> Tags
            </div>
            <div className="flex flex-wrap gap-1.5">
              {contact.tags.map((tag) => (
                <Badge key={tag} className="bg-brand-50 text-brand-700">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {contact.notes && (
          <div>
            <p className="text-xs font-medium text-ink-soft uppercase tracking-wide mb-2">
              Notes
            </p>
            <p className="text-sm text-ink leading-relaxed whitespace-pre-line rounded-xl bg-surface-muted px-4 py-3">
              {contact.notes}
            </p>
          </div>
        )}

        {/* Meta */}
        <p className="text-xs text-ink-soft">
          Added {shortDate(contact.createdAt)}{" "}
          <span className="opacity-60">({relative(contact.createdAt)})</span>
        </p>

        {/* Action buttons */}
        <div className="flex gap-3 pt-2 border-t border-line">
          <Button variant="outline" className="flex-1" onClick={onEdit}>
            <Pencil className="h-4 w-4" /> Edit
          </Button>
          <Button variant="danger" size="sm" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Drawer>
  );
}

/* ── Single row in the drawer info table ── */
function DrawerRow({ icon, label, children }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span className="text-ink-soft shrink-0">{icon}</span>
      <span className="text-xs text-ink-soft w-16 shrink-0">{label}</span>
      <span className="text-sm min-w-0">{children}</span>
    </div>
  );
}

/* ─── ContactFormDialog ──────────────────────────────────────────────────────
   Add / Edit dialog backed by react-hook-form.
   Tags are entered as a comma-separated string and split on submit.
   ──────────────────────────────────────────────────────────────────────────── */
function ContactFormDialog({ open, contact, onClose, onSaved }) {
  const isEdit = Boolean(contact);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  // Reset form defaults when dialog opens or the editing target changes
  useEffect(() => {
    if (open) {
      reset(
        contact
          ? {
              name: contact.name || "",
              title: contact.title || "",
              company: contact.company || "",
              email: contact.email || "",
              phone: contact.phone || "",
              tags: (contact.tags || []).join(", "),
              notes: contact.notes || "",
              favorite: contact.favorite || false,
            }
          : {
              name: "",
              title: "",
              company: "",
              email: "",
              phone: "",
              tags: "",
              notes: "",
              favorite: false,
            }
      );
    }
  }, [open, contact, reset]);

  const onSubmit = async (values) => {
    // Parse comma-separated tags into a clean array
    const tags = values.tags
      ? values.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : [];

    const payload = { ...values, tags };

    try {
      if (isEdit) {
        await contactsApi.update(contact._id, payload);
        toast.success("Contact updated");
      } else {
        await contactsApi.create(payload);
        toast.success("Contact added");
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err?.message || "Something went wrong");
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit contact" : "New contact"}
      description={
        isEdit
          ? "Update the details below."
          : "Fill in the details to add a new contact."
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
        {/* Name (required) */}
        <Field label="Full name" error={errors.name?.message}>
          <Input
            {...register("name", { required: "Name is required" })}
            placeholder="Jane Doe"
            autoFocus
          />
        </Field>

        {/* Title + Company in a two-column row */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Title">
            <Input {...register("title")} placeholder="Head of Design" />
          </Field>
          <Field label="Company">
            <Input {...register("company")} placeholder="Acme Inc." />
          </Field>
        </div>

        {/* Email + Phone */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Email">
            <Input
              {...register("email")}
              type="email"
              placeholder="jane@acme.com"
            />
          </Field>
          <Field label="Phone">
            <Input
              {...register("phone")}
              type="tel"
              placeholder="+1 555 000 0000"
            />
          </Field>
        </div>

        {/* Tags — comma-separated */}
        <Field label="Tags" error={errors.tags?.message}>
          <div className="relative">
            <Tag className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
            <Input
              {...register("tags")}
              placeholder="e.g. client, vip, partner"
              className="pl-10"
            />
          </div>
          <p className="mt-1 text-xs text-ink-soft">
            Separate multiple tags with commas.
          </p>
        </Field>

        {/* Notes */}
        <Field label="Notes">
          <Textarea
            {...register("notes")}
            placeholder="Any relevant context, history, or reminders…"
            rows={3}
          />
        </Field>

        {/* Favorite toggle */}
        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-line px-4 py-3 transition hover:bg-surface-muted select-none">
          <input
            type="checkbox"
            {...register("favorite")}
            className="h-4 w-4 rounded accent-brand-600"
          />
          <div>
            <p className="text-sm font-medium text-ink">Mark as favorite</p>
            <p className="text-xs text-ink-soft">
              Starred contacts appear highlighted in your grid.
            </p>
          </div>
          <Star className="ml-auto h-4 w-4 text-amber-400" />
        </label>

        {/* Form actions */}
        <div className="flex gap-3 pt-1">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button type="submit" className="flex-1" loading={isSubmitting}>
            {isEdit ? "Save changes" : "Add contact"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
