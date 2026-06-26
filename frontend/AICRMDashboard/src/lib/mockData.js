/* ─────────────────────────────────────────────────────────────────────────
   Mock data for the UI-only boilerplate.

   This file lets the entire frontend run WITHOUT a backend. lib/services.js
   serves this data (with a tiny artificial delay) so every page, chart and
   dialog works exactly like the real app. Delete this file — and switch
   lib/services.js back to the real API calls — once your backend is ready.
   ───────────────────────────────────────────────────────────────────────── */

const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString();
const daysAhead = (n) => new Date(Date.now() + n * 86400000).toISOString();
const today = () => new Date().toISOString();

export const mockUser = {
  id: "u1",
  name: "Alex Carter",
  email: "alex@timetoprogram.com",
  role: "owner",
  company: "Time To Program",
  avatar: "",
  createdAt: daysAgo(240),
};

/* Each maker returns a FRESH array so the in-memory store can be reset cleanly. */
export const makeLeads = () => [
  lead("l1", "Dribbble Design", "Acme Corp", "New", "High", "Website", 89345, 8),
  lead("l2", "Google Pay", "Globex", "Qualified", "High", "Referral", 124000, 20),
  lead("l3", "Amazon Shopping", "Initech", "Proposal", "Medium", "Cold Outreach", 32123, 35),
  lead("l4", "Stripe", "Umbrella Co", "Won", "High", "Event", 76500, 60),
  lead("l5", "Notion", "Soylent", "New", "Low", "Social", 12400, 4),
  lead("l6", "Figma", "Hooli", "Qualified", "Medium", "Website", 54000, 14),
  lead("l7", "Linear", "Pied Piper", "Proposal", "High", "Referral", 98000, 28),
  lead("l8", "Slack", "Vehement", "Lost", "Low", "Cold Outreach", 21000, 95),
  lead("l9", "Vercel", "Massive Dynamic", "Won", "High", "Referral", 143000, 110),
  lead("l10", "Airtable", "Wayne Ent.", "Qualified", "High", "Event", 67000, 18),
  lead("l11", "Datadog", "Stark Industries", "New", "Medium", "Website", 45000, 2),
  lead("l12", "Snowflake", "Cyberdyne", "Proposal", "High", "Referral", 152000, 48),
  lead("l13", "HubSpot", "Tyrell Corp", "Won", "Medium", "Event", 88000, 150),
  lead("l14", "Asana", "Aperture Labs", "Qualified", "Low", "Social", 30000, 22),
  lead("l15", "Zoom", "Oscorp", "New", "Medium", "Cold Outreach", 26000, 6),
  lead("l16", "GitLab", "LexCorp", "Lost", "Low", "Website", 18000, 70),
];

function lead(_id, name, company, status, priority, source, value, ageDays) {
  return {
    _id,
    name,
    email: `${name.toLowerCase().replace(/[^a-z]/g, "")}@${company
      .toLowerCase()
      .replace(/[^a-z]/g, "")}.com`,
    phone: `+1 555 0${100 + parseInt(_id.slice(1), 10)}`,
    company,
    status,
    priority,
    source,
    value,
    notes:
      status === "Won"
        ? "Closed — annual contract signed."
        : "Active opportunity in the pipeline.",
    tags: ["saas"],
    order: 0,
    aiSummary: "",
    aiRiskScore: null,
    createdAt: daysAgo(ageDays),
    updatedAt: daysAgo(Math.max(0, Math.floor(ageDays / 4))),
  };
}

export const makeContacts = () => [
  contact("c1", "Olivia Bennett", "VP of Sales", "Acme Corp", ["decision-maker", "warm"], true),
  contact("c2", "Noah Carter", "CTO", "Globex", ["technical", "champion"], true),
  contact("c3", "Emma Walsh", "Procurement Manager", "Initech", ["finance"], false),
  contact("c4", "Liam Foster", "Founder", "Umbrella Co", ["executive"], false),
  contact("c5", "Ava Mitchell", "Head of Operations", "Hooli", ["warm"], false),
  contact("c6", "Ethan Brooks", "Product Lead", "Pied Piper", ["champion", "technical"], true),
  contact("c7", "Sophia Reed", "Marketing Director", "Wayne Ent.", ["influencer"], false),
  contact("c8", "Mason Hayes", "CFO", "Cyberdyne", ["finance", "executive"], false),
  contact("c9", "Isabella Diaz", "Head of Growth", "Stark Industries", ["vip", "warm"], false),
  contact("c10", "Lucas Park", "Engineering Manager", "Tyrell Corp", ["technical"], false),
];

function contact(_id, name, title, company, tags, favorite) {
  return {
    _id,
    name,
    title,
    company,
    email: `${name.split(" ")[0].toLowerCase()}@${company
      .toLowerCase()
      .replace(/[^a-z]/g, "")}.com`,
    phone: `+1 555 0${100 + parseInt(_id.slice(1), 10)}`,
    tags,
    favorite,
    notes: favorite ? "Primary point of contact." : "",
    createdAt: daysAgo(parseInt(_id.slice(1), 10) * 7),
  };
}

const leadLite = (_id, name, company) => ({ _id, name, company });

export const makeNotes = () => [
  note("n1", "Decision expected end of month. Loop in a solutions engineer for the technical review.", leadLite("l2", "Google Pay", "Globex"), true, 3),
  note("n2", "Pricing pushback on the Pro tier — prepare an ROI one-pager before the next call.", leadLite("l3", "Amazon Shopping", "Initech"), false, 6),
  note("n3", "Champion is leaving the company; identify a backup stakeholder ASAP.", leadLite("l7", "Linear", "Pied Piper"), true, 9),
  note("n4", "Security questionnaire + SOC 2 report requested. Sent to the trust center.", leadLite("l12", "Snowflake", "Cyberdyne"), false, 12),
  note("n5", "Great discovery call — strong interest in the analytics module.", leadLite("l1", "Dribbble Design", "Acme Corp"), false, 1),
  note("n6", "Expansion likely next quarter — multi-year deal already signed.", leadLite("l9", "Vercel", "Massive Dynamic"), false, 18),
  note("n7", "Scheduling a technical deep-dive with the engineering team.", leadLite("l10", "Airtable", "Wayne Ent."), false, 5),
  note("n8", "Early stage, budget unconfirmed. Re-engage in two weeks.", leadLite("l5", "Notion", "Soylent"), false, 2),
];

function note(_id, content, lead, pinned, ageDays) {
  return { _id, content, lead, contact: null, pinned, createdAt: daysAgo(ageDays) };
}

export const makeTasks = () => [
  task("t1", "Send proposal follow-up to Initech", "High", "Pending", daysAgo(2), leadLite("l3", "Amazon Shopping", "Initech")),
  task("t2", "Schedule technical deep-dive with Wayne Ent.", "Medium", "In Progress", daysAhead(3), leadLite("l10", "Airtable", "Wayne Ent.")),
  task("t3", "Quarterly check-in with Massive Dynamic", "Low", "Pending", daysAhead(7), leadLite("l9", "Vercel", "Massive Dynamic")),
  task("t4", "Draft ROI one-pager for Initech", "High", "Completed", daysAgo(4), leadLite("l3", "Amazon Shopping", "Initech")),
  task("t5", "Negotiate pricing with Cyberdyne", "High", "Pending", today(), leadLite("l12", "Snowflake", "Cyberdyne")),
  task("t6", "Share case study with Globex", "Medium", "Pending", daysAhead(1), leadLite("l2", "Google Pay", "Globex")),
  task("t7", "Confirm contract redlines with Pied Piper", "High", "In Progress", daysAgo(1), leadLite("l7", "Linear", "Pied Piper")),
  task("t8", "Book discovery call with Oscorp", "Low", "Pending", daysAhead(5), leadLite("l15", "Zoom", "Oscorp")),
  task("t9", "Send security docs to Cyberdyne", "Medium", "Completed", daysAgo(8), leadLite("l12", "Snowflake", "Cyberdyne")),
  task("t10", "Re-engage stalled deal at Soylent", "Low", "Pending", daysAhead(14), leadLite("l5", "Notion", "Soylent")),
];

function task(_id, title, priority, status, dueDate, relatedLead) {
  return {
    _id,
    title,
    description: "",
    dueDate,
    status,
    priority,
    relatedLead,
    relatedContact: null,
    completedAt: status === "Completed" ? daysAgo(1) : null,
    createdAt: daysAgo(parseInt(_id.slice(1), 10) * 2),
  };
}

/* Canned AI responses so the AI buttons work without a Gemini key. */
export const mockAiStatus = {
  success: true,
  configured: true,
  model: "gemini-2.5-flash (mock)",
};

export const mockAiSummary = {
  success: true,
  summary:
    "A strong mid-market opportunity with an engaged champion and confirmed budget. The deal is progressing well but hinges on a pending legal review.",
  riskScore: 38,
  suggestedPriority: "High",
  nextBestAction:
    "Send the signed MSA template to accelerate the legal review and lock a close date.",
};

export const mockAiEmail = {
  success: true,
  subject: "Quick follow-up on next steps",
  body:
    "Hi there,\n\nThanks again for the great conversation earlier this week. I wanted to follow up with a quick summary of how we can help your team hit its goals this quarter.\n\nWould you be open to a 20-minute call later this week to walk through the proposal and answer any questions?\n\nBest,\nAlex Carter\nTime To Program",
};

export const mockAiInsights = {
  success: true,
  headline: "Pipeline is healthy, but proposals are stalling at the redline stage.",
  insights: [
    "Qualified-to-Proposal conversion is strong at 64%.",
    "Three high-value deals have sat in Proposal for over 30 days.",
    "Referral leads close at nearly 2x the rate of cold outreach.",
  ],
  recommendations: [
    "Prioritize the three stalled proposals with a tailored ROI one-pager.",
    "Double down on the referral channel — it's your highest-converting source.",
    "Set a 14-day SLA on the Proposal stage to prevent deals going cold.",
  ],
  healthScore: 74,
};
