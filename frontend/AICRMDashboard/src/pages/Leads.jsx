import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Users,
  TrendingUp,
  Trophy,
  Coins,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  X,
  LayoutGrid,
  Table2,
  Download,
  Building2,
} from "lucide-react";
import { PageHeader } from "../components/common/PageHeader";
import { EmptyState } from "../components/common/EmptyState";
import { ConfirmDialog } from "../components/common/ConfirmDialog";
import { LeadFormDialog } from "../components/leads/LeadFormDialog";
import { LeadDrawer } from "../components/leads/LeadDrawer";
import {
  Card,
  Button,
  Badge,
  Avatar,
  Select,
  Dropdown,
  DropdownItem,
  Spinner,
} from "../components/ui";
import { leadsApi } from "../lib/services";
import { currency, relative } from "../lib/format";
import {
  LEAD_STAGES,
  LEAD_PRIORITIES,
  LEAD_SOURCES,
  STAGE_STYLES,
  PRIORITY_STYLES,
} from "../lib/constants";
import { cn } from "../lib/utils";
import { toast } from "sonner";

export default function Leads() {
  const [leads, setLeads] = useState(null);
  const [filters, setFilters] = useState({ status: "", priority: "", source: "", search: "" });
  const [sort, setSort] = useState({ key: "updatedAt", dir: "desc" });
  const [selected, setSelected] = useState(() => new Set());
  const [view, setView] = useState("table"); // "table" | "grid"

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [drawerLead, setDrawerLead] = useState(null);
  const [toDelete, setToDelete] = useState(null); // single lead
  const [bulkOpen, setBulkOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = () => {
    setLeads(null);
    setSelected(new Set());
    leadsApi.list().then((res) => setLeads(res.leads)).catch(() => setLeads([]));
  };
  useEffect(load, []);

  /* ── Derived data ─────────────────────────────────────────────────── */
  // Counts per stage drive the quick-filter chips (independent of the active
  // stage filter so the numbers stay stable).
  const stageCounts = useMemo(() => {
    const c = { All: leads?.length || 0 };
    LEAD_STAGES.forEach((s) => (c[s] = 0));
    (leads || []).forEach((l) => (c[l.status] = (c[l.status] || 0) + 1));
    return c;
  }, [leads]);

  const kpis = useMemo(() => {
    const list = leads || [];
    const open = list.filter((l) => l.status !== "Won" && l.status !== "Lost");
    const openValue = open.reduce((s, l) => s + (l.value || 0), 0);
    const wonValue = list
      .filter((l) => l.status === "Won")
      .reduce((s, l) => s + (l.value || 0), 0);
    const total = list.reduce((s, l) => s + (l.value || 0), 0);
    return {
      count: list.length,
      openValue,
      wonValue,
      avg: list.length ? Math.round(total / list.length) : 0,
    };
  }, [leads]);

  const filtered = useMemo(() => {
    if (!leads) return [];
    return leads.filter((l) => {
      if (filters.status && l.status !== filters.status) return false;
      if (filters.priority && l.priority !== filters.priority) return false;
      if (filters.source && l.source !== filters.source) return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        return (
          l.name?.toLowerCase().includes(q) ||
          l.company?.toLowerCase().includes(q) ||
          l.email?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [leads, filters]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    const { key, dir } = sort;
    arr.sort((a, b) => {
      let av, bv;
      if (key === "name") {
        av = a.name?.toLowerCase() || "";
        bv = b.name?.toLowerCase() || "";
      } else if (key === "value") {
        av = a.value || 0;
        bv = b.value || 0;
      } else {
        av = new Date(a.updatedAt).getTime();
        bv = new Date(b.updatedAt).getTime();
      }
      if (av < bv) return dir === "asc" ? -1 : 1;
      if (av > bv) return dir === "asc" ? 1 : -1;
      return 0;
    });
    return arr;
  }, [filtered, sort]);

  const filtersActive =
    filters.status || filters.priority || filters.source || filters.search;

  /* ── Handlers ─────────────────────────────────────────────────────── */
  const toggleSort = (key) =>
    setSort((s) =>
      s.key === key
        ? { key, dir: s.dir === "asc" ? "desc" : "asc" }
        : { key, dir: key === "name" ? "asc" : "desc" }
    );

  const openNew = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (lead) => {
    setDrawerLead(null);
    setEditing(lead);
    setFormOpen(true);
  };

  const toggleRow = (id) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const allVisibleSelected =
    sorted.length > 0 && sorted.every((l) => selected.has(l._id));
  const toggleAll = () =>
    setSelected(allVisibleSelected ? new Set() : new Set(sorted.map((l) => l._id)));

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await leadsApi.remove(toDelete._id);
      toast.success("Lead deleted");
      setToDelete(null);
      setDrawerLead(null);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const confirmBulkDelete = async () => {
    setDeleting(true);
    try {
      await Promise.all([...selected].map((id) => leadsApi.remove(id)));
      toast.success(`${selected.size} leads deleted`);
      setBulkOpen(false);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  /* Export to CSV. If rows are checked, export just those; otherwise export
     the current filtered + sorted view. */
  const exportCSV = () => {
    const rows = selected.size > 0 ? sorted.filter((l) => selected.has(l._id)) : sorted;
    if (!rows.length) {
      toast.error("Nothing to export");
      return;
    }
    const headers = [
      "Name", "Company", "Email", "Phone", "Stage",
      "Priority", "Source", "Value", "Created", "Updated",
    ];
    // Escape values containing commas, quotes or newlines per RFC 4180.
    const esc = (v) => {
      const s = String(v ?? "");
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const day = (d) => (d ? new Date(d).toISOString().slice(0, 10) : "");
    const lines = [headers.join(",")];
    rows.forEach((l) =>
      lines.push(
        [
          l.name, l.company, l.email, l.phone, l.status,
          l.priority, l.source, l.value, day(l.createdAt), day(l.updatedAt),
        ]
          .map(esc)
          .join(",")
      )
    );
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${rows.length} ${rows.length === 1 ? "lead" : "leads"}`);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Leads" subtitle="Track and qualify every opportunity.">
        <Button variant="outline" onClick={exportCSV}>
          <Download className="h-4 w-4" /> Export
        </Button>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4" /> Add lead
        </Button>
      </PageHeader>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile icon={Users} tint="bg-brand-50 text-brand-600" label="Total leads" value={kpis.count} />
        <StatTile
          icon={TrendingUp}
          tint="bg-sky-50 text-sky-600"
          label="Open pipeline"
          value={currency(kpis.openValue, { compact: true })}
        />
        <StatTile
          icon={Trophy}
          tint="bg-emerald-50 text-emerald-600"
          label="Won value"
          value={currency(kpis.wonValue, { compact: true })}
        />
        <StatTile
          icon={Coins}
          tint="bg-violet-50 text-violet-600"
          label="Avg deal size"
          value={currency(kpis.avg, { compact: true })}
        />
      </div>

      {/* Toolbar */}
      <Card className="space-y-4 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
            <input
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder="Search by name, company or email…"
              className="h-10 w-full rounded-xl border border-line bg-surface pl-10 pr-4 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
          <div className="grid grid-cols-2 gap-2 lg:flex">
            <Filter
              value={filters.priority}
              onChange={(v) => setFilters({ ...filters, priority: v })}
              all="All priority"
              options={LEAD_PRIORITIES}
            />
            <Filter
              value={filters.source}
              onChange={(v) => setFilters({ ...filters, source: v })}
              all="All sources"
              options={LEAD_SOURCES}
            />
          </div>
        </div>

        {/* Stage quick-filter chips */}
        <div className="flex flex-wrap items-center gap-2">
          <StageChip
            label="All"
            count={stageCounts.All}
            active={!filters.status}
            onClick={() => setFilters({ ...filters, status: "" })}
          />
          {LEAD_STAGES.map((s) => (
            <StageChip
              key={s}
              label={s}
              count={stageCounts[s]}
              dot={STAGE_STYLES[s]?.dot}
              active={filters.status === s}
              onClick={() => setFilters({ ...filters, status: s })}
            />
          ))}

          <div className="ml-auto flex items-center gap-3">
            {filtersActive && (
              <button
                onClick={() => setFilters({ status: "", priority: "", source: "", search: "" })}
                className="inline-flex items-center gap-1 text-sm font-medium text-ink-soft transition hover:text-ink"
              >
                <X className="h-3.5 w-3.5" /> Clear
              </button>
            )}
            <span className="text-sm text-ink-soft">
              <span className="font-semibold text-ink">{sorted.length}</span> of{" "}
              {leads?.length ?? 0}
            </span>
            <ViewToggle view={view} onChange={setView} />
          </div>
        </div>
      </Card>

      {/* Results — table or card grid */}
      {leads === null ? (
        <Card>
          <Spinner />
        </Card>
      ) : sorted.length === 0 ? (
        <Card>
          <EmptyState
            icon={Users}
            title="No leads found"
            description={
              filtersActive
                ? "Try adjusting your filters."
                : "Add your first lead to get started."
            }
            action={
              <Button onClick={openNew}>
                <Plus className="h-4 w-4" /> Add lead
              </Button>
            }
          />
        </Card>
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {sorted.map((l) => (
            <LeadGridCard
              key={l._id}
              lead={l}
              selected={selected.has(l._id)}
              onToggle={() => toggleRow(l._id)}
              onOpen={() => setDrawerLead(l)}
              onEdit={openEdit}
              onDelete={setToDelete}
            />
          ))}
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-line bg-surface-muted/40">
                <tr className="text-left text-xs uppercase tracking-wide text-ink-soft">
                  <th className="w-12 pl-6">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={toggleAll}
                      className="h-4 w-4 rounded border-line accent-brand-600"
                      aria-label="Select all"
                    />
                  </th>
                  <SortTh label="Lead" k="name" sort={sort} onSort={toggleSort} />
                  <th className="px-6 py-3.5 font-medium">Stage</th>
                  <th className="px-6 py-3.5 font-medium">Priority</th>
                  <th className="px-6 py-3.5 font-medium">Source</th>
                  <SortTh label="Value" k="value" sort={sort} onSort={toggleSort} align="right" />
                  <SortTh label="Updated" k="updatedAt" sort={sort} onSort={toggleSort} />
                  <th className="px-6 py-3.5" />
                </tr>
              </thead>
              <tbody>
                {sorted.map((l) => {
                  const stage = STAGE_STYLES[l.status] || STAGE_STYLES.New;
                  const isSel = selected.has(l._id);
                  return (
                    <tr
                      key={l._id}
                      onClick={() => setDrawerLead(l)}
                      className={cn(
                        "group cursor-pointer border-b border-line last:border-0 transition",
                        isSel ? "bg-brand-50/50" : "hover:bg-surface-muted/50"
                      )}
                    >
                      <td className="pl-6" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSel}
                          onChange={() => toggleRow(l._id)}
                          className="h-4 w-4 rounded border-line accent-brand-600"
                          aria-label={`Select ${l.name}`}
                        />
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <Avatar name={l.name} size="sm" />
                          <div>
                            <p className="font-medium text-ink">{l.name}</p>
                            <p className="text-xs text-ink-soft">
                              {l.company || l.email || "—"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3.5">
                        <Badge className={stage.badge} dot={stage.dot}>
                          {l.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-3.5">
                        <Badge className={PRIORITY_STYLES[l.priority]}>{l.priority}</Badge>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="inline-flex rounded-lg bg-surface-muted px-2.5 py-1 text-xs font-medium text-ink-soft">
                          {l.source}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-right font-semibold text-ink">
                        {currency(l.value)}
                      </td>
                      <td className="px-6 py-3.5 text-ink-soft">{relative(l.updatedAt)}</td>
                      <td className="px-6 py-3.5" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <ChevronRight className="h-4 w-4 text-ink-soft/0 transition group-hover:text-ink-soft/60" />
                          <Dropdown
                            trigger={
                              <button className="rounded-lg p-1.5 text-ink-soft transition hover:bg-surface-muted">
                                <MoreHorizontal className="h-4 w-4" />
                              </button>
                            }
                          >
                            <DropdownItem onClick={() => openEdit(l)}>
                              <Pencil className="h-4 w-4" /> Edit
                            </DropdownItem>
                            <DropdownItem danger onClick={() => setToDelete(l)}>
                              <Trash2 className="h-4 w-4" /> Delete
                            </DropdownItem>
                          </Dropdown>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Floating bulk action bar */}
      {selected.size > 0 && (
        <div className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-full border border-line bg-surface px-3 py-2 shadow-[var(--shadow-pop)] animate-fade-up">
          <span className="pl-2 text-sm font-medium text-ink">
            {selected.size} selected
          </span>
          <button
            onClick={() => setSelected(new Set())}
            className="text-sm text-ink-soft transition hover:text-ink"
          >
            Clear
          </button>
          <Button size="sm" variant="danger" onClick={() => setBulkOpen(true)}>
            <Trash2 className="h-4 w-4" /> Delete
          </Button>
        </div>
      )}

      {/* Dialogs / drawer */}
      <LeadFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        lead={editing}
        onSaved={load}
      />
      <LeadDrawer
        open={Boolean(drawerLead)}
        onClose={() => setDrawerLead(null)}
        lead={drawerLead}
        onEdit={openEdit}
        onDelete={setToDelete}
      />
      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Delete this lead?"
        description={`"${toDelete?.name}" will be permanently removed.`}
      />
      <ConfirmDialog
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        onConfirm={confirmBulkDelete}
        loading={deleting}
        title={`Delete ${selected.size} leads?`}
        description="These leads will be permanently removed. This can't be undone."
      />
    </div>
  );
}

/* ── Table / grid view toggle ───────────────────────────────────────── */
function ViewToggle({ view, onChange }) {
  const options = [
    { value: "table", icon: Table2, label: "Table view" },
    { value: "grid", icon: LayoutGrid, label: "Card view" },
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
            view === value ? "bg-surface text-ink shadow-sm" : "text-ink-soft hover:text-ink"
          )}
        >
          <Icon className="h-4 w-4" />
        </button>
      ))}
    </div>
  );
}

/* ── Card used in the grid view ─────────────────────────────────────── */
function LeadGridCard({ lead, selected, onToggle, onOpen, onEdit, onDelete }) {
  const stage = STAGE_STYLES[lead.status] || STAGE_STYLES.New;
  return (
    <div
      onClick={onOpen}
      className={cn(
        "group relative cursor-pointer rounded-2xl border bg-surface p-5 shadow-[var(--shadow-card)] transition hover:shadow-[var(--shadow-pop)]",
        selected ? "border-brand-400 ring-2 ring-brand-500/30" : "border-line"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={lead.name} size="md" />
          <div className="min-w-0">
            <p className="truncate font-semibold text-ink">{lead.name}</p>
            <p className="flex items-center gap-1 truncate text-xs text-ink-soft">
              <Building2 className="h-3 w-3 shrink-0" /> {lead.company || lead.email || "—"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggle}
            className="h-4 w-4 rounded border-line accent-brand-600"
            aria-label={`Select ${lead.name}`}
          />
          <Dropdown
            trigger={
              <button className="rounded-lg p-1.5 text-ink-soft transition hover:bg-surface-muted">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            }
          >
            <DropdownItem onClick={() => onEdit(lead)}>
              <Pencil className="h-4 w-4" /> Edit
            </DropdownItem>
            <DropdownItem danger onClick={() => onDelete(lead)}>
              <Trash2 className="h-4 w-4" /> Delete
            </DropdownItem>
          </Dropdown>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Badge className={stage.badge} dot={stage.dot}>
          {lead.status}
        </Badge>
        <Badge className={PRIORITY_STYLES[lead.priority]}>{lead.priority}</Badge>
        <span className="inline-flex rounded-lg bg-surface-muted px-2.5 py-1 text-xs font-medium text-ink-soft">
          {lead.source}
        </span>
      </div>

      <div className="mt-4 flex items-end justify-between border-t border-line pt-4">
        <div>
          <p className="text-xs text-ink-soft">Deal value</p>
          <p className="font-display text-xl font-bold text-ink">{currency(lead.value)}</p>
        </div>
        <span className="text-xs text-ink-soft">{relative(lead.updatedAt)}</span>
      </div>
    </div>
  );
}

/* ── Small building blocks ──────────────────────────────────────────── */

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

function StageChip({ label, count, dot, active, onClick }) {
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
      {dot && <span className={cn("h-1.5 w-1.5 rounded-full", active ? "bg-white" : dot)} />}
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

function SortTh({ label, k, sort, onSort, align = "left" }) {
  const active = sort.key === k;
  return (
    <th className={cn("px-6 py-3.5 font-medium", align === "right" && "text-right")}>
      <button
        onClick={() => onSort(k)}
        className={cn(
          "inline-flex items-center gap-1 transition hover:text-ink",
          active && "text-ink"
        )}
      >
        {label}
        <span className="text-ink-soft">
          {active ? (
            sort.dir === "asc" ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )
          ) : (
            <ChevronDown className="h-3.5 w-3.5 opacity-30" />
          )}
        </span>
      </button>
    </th>
  );
}

function Filter({ value, onChange, all, options }) {
  return (
    <Select value={value} onChange={(e) => onChange(e.target.value)} className="lg:w-40">
      <option value="">{all}</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </Select>
  );
}
