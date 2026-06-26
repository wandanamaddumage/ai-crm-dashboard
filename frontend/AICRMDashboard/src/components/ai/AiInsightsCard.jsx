import { useState } from "react";
import { Sparkles, TrendingUp, Lightbulb, RefreshCw } from "lucide-react";
import { Card, Button, Spinner } from "../ui";
import { aiApi } from "../../lib/services";
import { toast } from "sonner";

/**
 * AI Sales Insights panel — calls Gemini to analyse the current pipeline and
 * surface a health score, observations and recommendations.
 */
export function AiInsightsCard() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  const run = async () => {
    setLoading(true);
    try {
      const res = await aiApi.salesInsights({});
      setData(res);
    } catch (err) {
      toast.error(err.message || "Could not generate insights");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="flex h-full flex-col p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-ink">AI Sales Insights</h3>
            <p className="text-xs text-ink-soft">Powered by Gemini</p>
          </div>
        </div>
        {data && (
          <button
            onClick={run}
            className="rounded-lg p-1.5 text-ink-soft transition hover:bg-surface-muted hover:text-ink"
            title="Regenerate"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        )}
      </div>

      {loading ? (
        <Spinner />
      ) : !data ? (
        <div className="flex flex-1 flex-col items-center justify-center py-6 text-center">
          <p className="max-w-xs text-sm text-ink-soft">
            Get an instant, data-driven read on your pipeline health and what to
            do next.
          </p>
          <Button className="mt-4" size="sm" onClick={run}>
            <Sparkles className="h-4 w-4" /> Analyze pipeline
          </Button>
        </div>
      ) : (
        <div className="mt-4 flex-1 space-y-4 overflow-y-auto no-scrollbar">
          <div className="rounded-2xl bg-brand-50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wide text-brand-700">
                Health score
              </span>
              <span className="text-lg font-bold text-brand-700">
                {data.healthScore}/100
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-brand-100">
              <div
                className="h-full rounded-full bg-brand-600 transition-all"
                style={{ width: `${data.healthScore}%` }}
              />
            </div>
            <p className="mt-2.5 text-sm font-medium text-ink">{data.headline}</p>
          </div>

          <Section icon={TrendingUp} title="Observations" items={data.insights} />
          <Section
            icon={Lightbulb}
            title="Recommendations"
            items={data.recommendations}
          />
        </div>
      )}
    </Card>
  );
}

function Section({ icon: Icon, title, items = [] }) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-ink">
        <Icon className="h-4 w-4 text-brand-600" /> {title}
      </div>
      <ul className="space-y-1.5">
        {items.map((t, i) => (
          <li key={i} className="flex gap-2 text-sm text-ink-soft">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-300" />
            {t}
          </li>
        ))}
      </ul>
    </div>
  );
}
