import { Sparkles, TrendingUp, Bot, ShieldCheck } from "lucide-react";

/* Split-screen auth layout: marketing panel on the left, form on the right. */
export function AuthShell({ children }) {
  return (
    <div className="flex min-h-screen bg-canvas">
      {/* Brand / marketing panel */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-brand-700 p-12 text-white lg:flex">
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-brand-500/40 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-brand-600/50 blur-3xl" />

        <div className="relative flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="font-display text-lg font-bold">Time To Program CRM</span>
        </div>

        <div className="relative">
          <h2 className="font-display text-4xl font-bold leading-tight">
            Close more deals with an AI co-pilot in your pipeline.
          </h2>
          <p className="mt-4 max-w-md text-white/70">
            TTP CRM unifies your leads, contacts and follow-ups — then layers
            Gemini-powered summaries, email drafts and sales insights on top.
          </p>

          <div className="mt-10 space-y-4">
            {[
              { icon: TrendingUp, text: "Visual pipeline with drag-and-drop stages" },
              { icon: Bot, text: "AI lead scoring & instant email drafting" },
              { icon: ShieldCheck, text: "Secure JWT auth, your data stays yours" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
                  <Icon className="h-[18px] w-[18px]" />
                </div>
                <span className="text-sm text-white/90">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-white/50">
          © {new Date().getFullYear()} Time To Program. All rights reserved.
        </p>
      </div>

      {/* Form panel */}
      <div className="flex w-full flex-col items-center justify-center px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-sm animate-fade-up">{children}</div>
      </div>
    </div>
  );
}
