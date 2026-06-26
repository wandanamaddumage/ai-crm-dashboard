import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  CreditCard,
  CalendarRange,
  Plus,
  ArrowUpRight,
  CheckCircle2,
  Target,
  Layers,
  PieChart as PieIcon,
  CalendarClock,
  Trophy,
  Clock,
  AlertTriangle,
  Building2,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  AreaChart,
  Area,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import { format, isPast } from "date-fns";
import { HeroCard } from "../components/dashboard/HeroCard";
import { AiInsightsCard } from "../components/ai/AiInsightsCard";
import {
  Card,
  SectionHeading,
  Badge,
  Tabs,
  Skeleton,
  Avatar,
} from "../components/ui";
import { analyticsApi, contactsApi, leadsApi, tasksApi } from "../lib/services";
import { currency, shortDate, timeOf } from "../lib/format";
import { STAGE_STYLES, PRIORITY_STYLES } from "../lib/constants";
import { useAuth } from "../context/AuthContext";
import { cn } from "../lib/utils";

/* Donut palette — sky-blue family used for the "Leads by Source" chart. */
const SOURCE_COLORS = ["#0ea5e9", "#38bdf8", "#0369a1", "#7dd3fc", "#0284c7", "#bae6fd"];

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [leads, setLeads] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [range, setRange] = useState("monthly");

  useEffect(() => {
    analyticsApi.overview().then(setData).catch(() => setData(false));
    contactsApi.list().then((res) => setContacts(res.contacts || [])).catch(() => {});
    leadsApi.list().then((res) => setLeads(res.leads || [])).catch(() => {});
    tasksApi.list().then((res) => setTasks(res.tasks || [])).catch(() => {});
  }, []);

  if (data === null) return <DashboardSkeleton />;
  const stats = data?.stats || {};

  // A friendly trailing date-range label for the header pill.
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth() - 5, 1);
  const rangeLabel = `${format(start, "dd MMM")} – ${format(today, "dd MMM, yyyy")}`;

  return (
    <div className="space-y-6">
      {/* Title row */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink sm:text-[2.5rem]">
          Welcome Back, <span className="text-ink-soft">{user?.name?.split(" ")[0]}</span>
        </h1>
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-full bg-surface px-4 py-2.5 text-sm font-medium text-ink-soft shadow-[var(--shadow-soft)] sm:flex">
            <CalendarRange className="h-4 w-4" />
            {rangeLabel}
          </div>
          <Link
            to="/leads"
            className="brand-gradient brand-gradient-hover inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold text-white shadow-sm transition"
          >
            <Plus className="h-4 w-4" /> Add New Lead
          </Link>
        </div>
      </div>

      {/* Balanced 3-column composition — cards distributed so the columns end
          at roughly the same height, leaving no large vertical gaps. */}
      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-12">
        {/* ── Left column ───────────────────────────────── */}
        <div className="space-y-5 lg:col-span-3">
          <HeroCard value={stats.pipelineValue} />

          <Card className="p-5">
            <p className="text-sm text-ink-soft">Weekly Revenue</p>
            <div className="mt-2 flex items-end justify-between gap-2">
              <p className="font-display text-2xl font-bold text-ink">
                {currency(stats.revenueWon, { compact: true })}
              </p>
              <Badge className="bg-brand-50 text-brand-700">
                <ArrowUpRight className="h-3 w-3" /> 12.8%
              </Badge>
            </div>
          </Card>

          {/* Conversion stat */}
          <Card className="p-6">
            <SectionHeading icon={Target} title="Conversion" subtitle="Win rate" />
            <div className="mt-4 flex items-end gap-2">
              <p className="font-display text-3xl font-bold text-ink">
                {stats.conversionRate ?? 0}
                <span className="text-xl text-ink-soft">%</span>
              </p>
              <Badge className="mb-1 bg-brand-50 text-brand-700">
                <ArrowUpRight className="h-3 w-3" /> 4.1%
              </Badge>
            </div>
            <p className="mt-1 text-sm text-ink-soft">
              {stats.totalLeads ?? 0} leads · {stats.openTasks ?? 0} open tasks
            </p>
          </Card>

          <UpcomingTasks tasks={tasks} />
          <TopContactsCard contacts={contacts} />
        </div>

        {/* ── Center column ─────────────────────────────── */}
        <div className="space-y-5 lg:col-span-6">
          <Card className="p-6">
            <SectionHeading
              icon={CreditCard}
              title="Pipeline Engagement"
              subtitle="New leads per month"
              action={
                <Tabs
                  value={range}
                  onChange={setRange}
                  tabs={[
                    { value: "monthly", label: "Monthly" },
                    { value: "annually", label: "Annually" },
                  ]}
                />
              }
            />
            <div className="mt-4">
              <EngagementChart trend={data?.trend || []} />
            </div>
          </Card>

          <Card className="p-6">
            <SectionHeading
              title="Lead Activity"
              subtitle="Recent lead movements"
              to="/leads"
            />
            <div className="mt-4">
              <ActivityTable leads={data?.recentLeads || []} />
            </div>
          </Card>

          <PipelineByStage pipeline={data?.pipeline || []} />
        </div>

        {/* ── Right column ──────────────────────────────── */}
        <div className="space-y-5 lg:col-span-3">
          {/* Revenue / balance card */}
          <Card className="p-6">
            <SectionHeading title="Revenue Goal" subtitle="Closed-won total" to="/pipeline" />
            <p className="mt-4 text-center text-sm text-ink-soft">Total Won</p>
            <p className="text-center font-display text-3xl font-bold tracking-tight text-ink">
              {currency(stats.revenueWon)}
            </p>
            <BalanceChart trend={data?.trend || []} />
            <div className="mt-4 flex items-center gap-2">
              <Link
                to="/leads"
                className="brand-gradient brand-gradient-hover inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full text-sm font-semibold text-white transition"
              >
                <Plus className="h-4 w-4" /> Add Lead
              </Link>
              <Link
                to="/tasks"
                className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full border border-line text-sm font-medium text-ink transition hover:bg-surface-muted"
              >
                <CheckCircle2 className="h-4 w-4" /> Task
              </Link>
            </div>
          </Card>

          <AiInsightsCard />
          <LeadsBySource leads={leads} />
          <TopDeals leads={leads} />
        </div>
      </div>
    </div>
  );
}

/* ── Pipeline by stage (funnel-style breakdown) ─────────────────────── */
function PipelineByStage({ pipeline, className }) {
  const maxValue = Math.max(...pipeline.map((s) => s.value), 1);
  const totalValue = pipeline.reduce((sum, s) => sum + s.value, 0);

  return (
    <Card className={cn("p-6", className)}>
      <SectionHeading
        icon={Layers}
        title="Pipeline by Stage"
        subtitle="Deal value across each stage"
        to="/pipeline"
      />
      <div className="mt-5 space-y-4">
        {pipeline.map((s) => {
          const style = STAGE_STYLES[s.stage] || STAGE_STYLES.New;
          const pct = totalValue ? Math.round((s.value / totalValue) * 100) : 0;
          return (
            <div key={s.stage}>
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 font-medium text-ink">
                  <span className={cn("h-2.5 w-2.5 rounded-full", style.dot)} />
                  {s.stage}
                  <span className="text-ink-soft">· {s.count}</span>
                </span>
                <span className="font-semibold text-ink">
                  {currency(s.value, { compact: true })}
                  <span className="ml-1.5 text-xs font-normal text-ink-soft">{pct}%</span>
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-surface-muted">
                <div
                  className={cn("h-full rounded-full transition-all", style.bar)}
                  style={{ width: `${Math.max((s.value / maxValue) * 100, 2)}%` }}
                />
              </div>
            </div>
          );
        })}
        {pipeline.length === 0 && (
          <p className="py-6 text-center text-sm text-ink-soft">No pipeline data yet.</p>
        )}
      </div>
    </Card>
  );
}

/* ── Leads by source (donut chart) ──────────────────────────────────── */
function LeadsBySource({ leads }) {
  // Group leads by their source field.
  const grouped = leads.reduce((acc, l) => {
    const key = l.source || "Other";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const dataset = Object.entries(grouped).map(([name, value]) => ({ name, value }));

  return (
    <Card className="p-6">
      <SectionHeading icon={PieIcon} title="Leads by Source" subtitle="Where leads come from" />
      {dataset.length === 0 ? (
        <p className="py-10 text-center text-sm text-ink-soft">No leads yet.</p>
      ) : (
        <div className="mt-2 flex items-center gap-4">
          <div className="relative h-36 w-36 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dataset}
                  dataKey="value"
                  innerRadius={44}
                  outerRadius={66}
                  paddingAngle={2}
                  stroke="none"
                >
                  {dataset.map((_, i) => (
                    <Cell key={i} fill={SOURCE_COLORS[i % SOURCE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip unit=" leads" />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display text-xl font-bold text-ink">{leads.length}</span>
              <span className="text-[11px] text-ink-soft">leads</span>
            </div>
          </div>
          <ul className="flex-1 space-y-1.5">
            {dataset.map((d, i) => (
              <li key={d.name} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-ink-soft">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: SOURCE_COLORS[i % SOURCE_COLORS.length] }}
                  />
                  {d.name}
                </span>
                <span className="font-medium text-ink">{d.value}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}

/* ── Upcoming follow-ups (next due tasks) ───────────────────────────── */
function UpcomingTasks({ tasks }) {
  const upcoming = tasks
    .filter((t) => t.status !== "Completed")
    .sort((a, b) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate) - new Date(b.dueDate);
    })
    .slice(0, 4);

  return (
    <Card className="flex flex-col p-6">
      <SectionHeading
        icon={CalendarClock}
        title="Upcoming Follow-ups"
        subtitle="Don't let these slip"
        to="/tasks"
      />
      {upcoming.length === 0 ? (
        <p className="py-8 text-center text-sm text-ink-soft">You're all caught up 🎉</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {upcoming.map((t) => {
            const overdue = t.dueDate && isPast(new Date(t.dueDate));
            return (
              <li key={t._id} className="flex items-start gap-3">
                <span
                  className={cn(
                    "mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                    overdue ? "bg-rose-50 text-rose-600" : "bg-brand-50 text-brand-600"
                  )}
                >
                  {overdue ? (
                    <AlertTriangle className="h-3.5 w-3.5" />
                  ) : (
                    <Clock className="h-3.5 w-3.5" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{t.title}</p>
                  <p className={cn("text-xs", overdue ? "text-rose-600" : "text-ink-soft")}>
                    {t.dueDate ? shortDate(t.dueDate) : "No due date"}
                    {t.relatedLead?.name ? ` · ${t.relatedLead.name}` : ""}
                  </p>
                </div>
                <Badge className={PRIORITY_STYLES[t.priority]}>{t.priority}</Badge>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

/* ── Top open deals (highest-value active leads) ────────────────────── */
function TopDeals({ leads }) {
  const deals = [...leads]
    .filter((l) => l.status !== "Won" && l.status !== "Lost")
    .sort((a, b) => (b.value || 0) - (a.value || 0))
    .slice(0, 5);

  return (
    <Card className="flex flex-col p-6">
      <SectionHeading icon={Trophy} title="Top Open Deals" subtitle="Biggest active opportunities" to="/leads" />
      {deals.length === 0 ? (
        <p className="py-8 text-center text-sm text-ink-soft">No open deals yet.</p>
      ) : (
        <ul className="mt-4 space-y-2.5">
          {deals.map((l, i) => {
            const style = STAGE_STYLES[l.status] || STAGE_STYLES.New;
            return (
              <li key={l._id} className="flex items-center gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-muted text-xs font-semibold text-ink-soft">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{l.name}</p>
                  <p className="flex items-center gap-1 truncate text-xs text-ink-soft">
                    <Building2 className="h-3 w-3" /> {l.company || "—"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-ink">
                    {currency(l.value, { compact: true })}
                  </p>
                  <span className={cn("text-[11px] font-medium", style.badge, "bg-transparent px-0")}>
                    {l.status}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

/* ── Engagement bar chart with a highlighted peak + floating bubble ──── */
function EngagementChart({ trend }) {
  const counts = trend.map((t) => t.leads);
  const max = Math.max(...counts, 1);
  const maxIndex = counts.indexOf(max);
  const prev = maxIndex > 0 ? counts[maxIndex - 1] : 0;
  const growth = prev > 0 ? Math.round(((max - prev) / prev) * 1000) / 10 : 17.8;

  // Custom label: render a rounded "+x%" bubble above the tallest bar only.
  const renderPeak = (props) => {
    const { x, y, width, index } = props;
    if (index !== maxIndex) return null;
    const cx = x + width / 2;
    return (
      <g>
        <circle cx={cx} cy={y} r={5} fill="#0369a1" stroke="#fff" strokeWidth={2} />
        <rect x={cx - 26} y={y - 34} width={52} height={22} rx={11} fill="#0369a1" />
        <text x={cx} y={y - 19} textAnchor="middle" fontSize="11" fontWeight="700" fill="#fff">
          +{growth}%
        </text>
      </g>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={trend} barCategoryGap="28%" margin={{ top: 30 }}>
        <CartesianGrid vertical={false} stroke="#e8eef3" strokeDasharray="4 4" />
        <XAxis
          dataKey="month"
          axisLine={false}
          tickLine={false}
          tick={{ fill: "#64748b", fontSize: 12 }}
          dy={6}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: "#64748b", fontSize: 12 }}
          width={30}
          tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)}
        />
        <Tooltip cursor={{ fill: "#f1f5f9" }} content={<ChartTooltip unit=" leads" />} />
        <Bar dataKey="leads" radius={[14, 14, 14, 14]} maxBarSize={42} label={renderPeak}>
          {trend.map((t, i) => (
            <Cell key={i} fill={i === maxIndex ? "#0369a1" : "#bae6fd"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function BalanceChart({ trend }) {
  return (
    <ResponsiveContainer width="100%" height={120}>
      <AreaChart data={trend} margin={{ top: 14, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="balance" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0} />
          </linearGradient>
        </defs>
        <Tooltip content={<ChartTooltip prefix="$" />} />
        <Area type="monotone" dataKey="won" stroke="#0284c7" strokeWidth={2.5} fill="url(#balance)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function ChartTooltip({ active, payload, label, prefix = "", unit = "" }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-line bg-surface px-3 py-2 shadow-[var(--shadow-pop)]">
      <p className="text-xs font-medium text-ink-soft">{label}</p>
      <p className="text-sm font-semibold text-ink">
        {prefix}
        {Number(payload[0].value).toLocaleString()}
        {unit}
      </p>
    </div>
  );
}

/* ── Recent activity table (Payment History style) ──────────────────── */
function ActivityTable({ leads }) {
  if (!leads.length)
    return <p className="py-10 text-center text-sm text-ink-soft">No recent activity yet.</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-ink-soft">
            <th className="pb-3 font-medium">Name</th>
            <th className="pb-3 font-medium">Date</th>
            <th className="hidden pb-3 font-medium sm:table-cell">Time</th>
            <th className="pb-3 font-medium">Status</th>
            <th className="pb-3 text-right font-medium">Value</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((l) => {
            const style = STAGE_STYLES[l.status] || STAGE_STYLES.New;
            return (
              <tr
                key={l.id}
                className="border-t border-line transition hover:bg-surface-muted/50"
              >
                <td className="py-3.5">
                  <div className="flex items-center gap-3">
                    <Avatar name={l.name} size="sm" />
                    <div>
                      <p className="font-medium text-ink">{l.name}</p>
                      <p className="text-xs text-ink-soft">{l.company || "—"}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3.5 text-ink-soft">{shortDate(l.updatedAt)}</td>
                <td className="hidden py-3.5 text-ink-soft sm:table-cell">
                  {timeOf(l.updatedAt)}
                </td>
                <td className="py-3.5">
                  <span className="inline-flex items-center gap-1.5 text-sm text-ink">
                    <span className={cn("h-1.5 w-1.5 rounded-full", style.dot)} />
                    {l.status}
                  </span>
                </td>
                <td className="py-3.5 text-right font-semibold text-ink">
                  {currency(l.value)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ── Top contacts (avatar stack — the "Mandatory Payments" slot) ─────── */
function TopContactsCard({ contacts }) {
  const top = contacts.slice(0, 4);
  const overflow = Math.max(contacts.length - top.length, 0);

  return (
    <Card className="p-6">
      <SectionHeading title="Top Contacts" subtitle="Your key relationships" to="/contacts" />
      {contacts.length === 0 ? (
        <p className="mt-4 text-sm text-ink-soft">No contacts yet.</p>
      ) : (
        <div className="mt-5 flex items-center justify-between">
          <div className="flex -space-x-3">
            {top.map((c) => (
              <Avatar
                key={c._id}
                name={c.name}
                src={c.avatar}
                size="md"
                className="ring-2 ring-surface"
              />
            ))}
            {overflow > 0 && (
              <div className="brand-gradient flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white ring-2 ring-surface">
                +{overflow}
              </div>
            )}
          </div>
          <Link
            to="/contacts"
            className="text-sm font-medium text-brand-700 hover:underline"
          >
            View all
          </Link>
        </div>
      )}
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-12 w-80" />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="space-y-5 lg:col-span-3">
          <Skeleton className="h-64 rounded-3xl" />
          <Skeleton className="h-24 rounded-3xl" />
        </div>
        <div className="space-y-5 lg:col-span-6">
          <Skeleton className="h-80 rounded-3xl" />
          <Skeleton className="h-64 rounded-3xl" />
        </div>
        <div className="space-y-5 lg:col-span-3">
          <Skeleton className="h-56 rounded-3xl" />
          <Skeleton className="h-32 rounded-3xl" />
          <Skeleton className="h-32 rounded-3xl" />
        </div>
      </div>
    </div>
  );
}
