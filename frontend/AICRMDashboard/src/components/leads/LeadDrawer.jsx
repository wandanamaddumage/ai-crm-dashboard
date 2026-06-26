import { useState } from "react";
import {
  Mail,
  Phone,
  Building2,
  Sparkles,
  Pencil,
  Trash2,
  Wand2,
  AlertCircle,
} from "lucide-react";
import { Drawer, Button, Badge, Avatar, Spinner } from "../ui";
import { AiEmailDialog } from "../ai/AiEmailDialog";
import { aiApi } from "../../lib/services";
import { currency, shortDate } from "../../lib/format";
import { STAGE_STYLES, PRIORITY_STYLES } from "../../lib/constants";
import { cn } from "../../lib/utils";
import { toast } from "sonner";

/** Detailed slide-over for a single lead: info, AI summary, email generator. */
export function LeadDrawer({ open, onClose, lead, onEdit, onDelete }) {
  const [summary, setSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);

  if (!lead) return null;
  const stage = STAGE_STYLES[lead.status] || STAGE_STYLES.New;

  const runSummary = async () => {
    setLoadingSummary(true);
    try {
      const res = await aiApi.leadSummary({ leadId: lead._id });
      setSummary(res);
    } catch (err) {
      toast.error(err.message || "Could not summarize lead");
    } finally {
      setLoadingSummary(false);
    }
  };

  const riskTone =
    summary?.riskScore >= 66
      ? "text-rose-600"
      : summary?.riskScore >= 33
      ? "text-amber-600"
      : "text-brand-700";

  return (
    <>
      <Drawer open={open} onClose={onClose} title="Lead details">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Avatar name={lead.name} size="lg" />
          <div className="min-w-0">
            <h2 className="truncate text-xl font-bold text-ink">{lead.name}</h2>
            <p className="truncate text-sm text-ink-soft">{lead.company || "—"}</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Badge className={stage.badge} dot={stage.dot}>
            {lead.status}
          </Badge>
          <Badge className={PRIORITY_STYLES[lead.priority]}>{lead.priority} priority</Badge>
          <Badge>{lead.source}</Badge>
        </div>

        {/* Value */}
        <div className="mt-5 rounded-2xl bg-surface p-4 shadow-[var(--shadow-soft)]">
          <p className="text-xs uppercase tracking-wide text-ink-soft">Deal value</p>
          <p className="mt-1 text-2xl font-bold text-ink">{currency(lead.value)}</p>
        </div>

        {/* Contact info */}
        <div className="mt-4 space-y-2">
          <InfoRow icon={Mail} value={lead.email} href={`mailto:${lead.email}`} />
          <InfoRow icon={Phone} value={lead.phone} href={`tel:${lead.phone}`} />
          <InfoRow icon={Building2} value={lead.company} />
        </div>

        {lead.notes && (
          <div className="mt-4 rounded-2xl bg-surface p-4 shadow-[var(--shadow-soft)]">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-soft">
              Notes
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-ink">{lead.notes}</p>
          </div>
        )}

        {/* AI summary */}
        <div className="mt-5 rounded-2xl border border-brand-100 bg-brand-50/60 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-brand-800">
              <Sparkles className="h-4 w-4" /> AI Lead Summary
            </div>
            {!summary && (
              <Button size="sm" variant="subtle" onClick={runSummary} loading={loadingSummary}>
                Analyze
              </Button>
            )}
          </div>

          {loadingSummary && <Spinner className="p-4" />}

          {summary && (
            <div className="mt-3 space-y-3 animate-fade-up">
              <p className="text-sm leading-relaxed text-ink">{summary.summary}</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-surface p-3 text-center">
                  <p className="text-xs text-ink-soft">Risk score</p>
                  <p className={cn("text-lg font-bold", riskTone)}>
                    {summary.riskScore}
                    <span className="text-sm text-ink-soft">/100</span>
                  </p>
                </div>
                <div className="rounded-xl bg-surface p-3 text-center">
                  <p className="text-xs text-ink-soft">Suggested priority</p>
                  <p className="text-lg font-bold text-ink">{summary.suggestedPriority}</p>
                </div>
              </div>
              <div className="flex items-start gap-2 rounded-xl bg-surface p-3">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                <p className="text-sm text-ink">
                  <span className="font-medium">Next best action: </span>
                  {summary.nextBestAction}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-5 grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={() => setEmailOpen(true)} className="col-span-2">
            <Wand2 className="h-4 w-4" /> Generate AI email
          </Button>
          <Button variant="secondary" onClick={() => onEdit(lead)}>
            <Pencil className="h-4 w-4" /> Edit
          </Button>
          <Button variant="danger" onClick={() => onDelete(lead)}>
            <Trash2 className="h-4 w-4" /> Delete
          </Button>
        </div>

        <p className="mt-4 text-center text-xs text-ink-soft">
          Added {shortDate(lead.createdAt)}
        </p>
      </Drawer>

      <AiEmailDialog open={emailOpen} onClose={() => setEmailOpen(false)} lead={lead} />
    </>
  );
}

function InfoRow({ icon: Icon, value, href }) {
  if (!value) return null;
  const content = (
    <div className="flex items-center gap-3 rounded-xl px-1 py-1.5 text-sm text-ink transition hover:text-brand-700">
      <Icon className="h-4 w-4 text-ink-soft" />
      <span className="truncate">{value}</span>
    </div>
  );
  return href ? (
    <a href={href} className="block">
      {content}
    </a>
  ) : (
    content
  );
}
