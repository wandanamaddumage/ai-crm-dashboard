/* ─────────────────────────────────────────────────────────────────────────
   API service layer — UI-ONLY BOILERPLATE (mock mode).

   Every method currently resolves MOCK data from lib/mockData.js so the whole
   app runs without a backend. The real axios calls are kept commented right
   above each mock so that, once your backend is live, you:

     1. Enable the axios client in lib/api.js (uncomment it there).
     2. Uncomment the `import api` line below.
     3. In each method, swap the mock line for the commented real line.

   The shapes returned here match the real API exactly, so no page/component
   needs to change.
   ───────────────────────────────────────────────────────────────────────── */

// import api from "./api";
import {
  mockUser,
  makeLeads,
  makeContacts,
  makeNotes,
  makeTasks,
  mockAiStatus,
  mockAiSummary,
  mockAiEmail,
  mockAiInsights,
} from "./mockData";

/* In-memory stores so create / edit / delete feel real during the UI phase.
   They reset on page refresh — that's expected for a mock. */
let leads = makeLeads();
let contacts = makeContacts();
let notes = makeNotes();
let tasks = makeTasks();

const uid = () => "id_" + Math.random().toString(36).slice(2, 10);
const clone = (d) => JSON.parse(JSON.stringify(d));
// Resolve like a network call would: a short delay + a fresh copy of the data.
const reply = (data, ms = 250) =>
  new Promise((resolve) => setTimeout(() => resolve(clone(data)), ms));

const leadLite = (id) => {
  const l = leads.find((x) => x._id === id);
  return l ? { _id: l._id, name: l.name, company: l.company } : null;
};

/* ── Auth ───────────────────────────────────────────────────────────── */
export const authApi = {
  // login: (data) => api.post("/auth/login", data),
  login: () => reply({ success: true, token: "mock-token", user: mockUser }),

  // register: (data) => api.post("/auth/register", data),
  register: (data) =>
    reply({ success: true, token: "mock-token", user: { ...mockUser, ...data } }),

  // me: () => api.get("/auth/me"),
  me: () => reply({ success: true, user: mockUser }),

  // updateProfile: (data) => api.put("/auth/profile", data),
  updateProfile: (data) => {
    Object.assign(mockUser, data);
    return reply({ success: true, user: mockUser });
  },
};

/* ── Leads ──────────────────────────────────────────────────────────── */
export const leadsApi = {
  // list: (params) => api.get("/leads", { params }),
  list: () => reply({ success: true, count: leads.length, leads }),

  // get: (id) => api.get(`/leads/${id}`),
  get: (id) => reply({ success: true, lead: leads.find((l) => l._id === id) }),

  // create: (data) => api.post("/leads", data),
  create: (data) => {
    const lead = {
      _id: uid(),
      order: 0,
      tags: [],
      aiSummary: "",
      aiRiskScore: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...data,
    };
    leads = [lead, ...leads];
    return reply({ success: true, lead });
  },

  // update: (id, data) => api.put(`/leads/${id}`, data),
  update: (id, data) => {
    leads = leads.map((l) =>
      l._id === id ? { ...l, ...data, updatedAt: new Date().toISOString() } : l
    );
    return reply({ success: true, lead: leads.find((l) => l._id === id) });
  },

  // remove: (id) => api.delete(`/leads/${id}`),
  remove: (id) => {
    leads = leads.filter((l) => l._id !== id);
    return reply({ success: true, message: "Lead deleted" });
  },

  // reorder: (updates) => api.patch("/leads/reorder", { updates }),
  reorder: (updates) => {
    updates.forEach((u) => {
      leads = leads.map((l) =>
        l._id === u.id ? { ...l, status: u.status, order: u.order } : l
      );
    });
    return reply({ success: true, message: "Pipeline updated" });
  },
};

/* ── Contacts ───────────────────────────────────────────────────────── */
export const contactsApi = {
  // list: (params) => api.get("/contacts", { params }),
  list: () => reply({ success: true, count: contacts.length, contacts }),

  // get: (id) => api.get(`/contacts/${id}`),
  get: (id) => reply({ success: true, contact: contacts.find((c) => c._id === id) }),

  // create: (data) => api.post("/contacts", data),
  create: (data) => {
    const contact = {
      _id: uid(),
      tags: [],
      favorite: false,
      createdAt: new Date().toISOString(),
      ...data,
    };
    contacts = [contact, ...contacts];
    return reply({ success: true, contact });
  },

  // update: (id, data) => api.put(`/contacts/${id}`, data),
  update: (id, data) => {
    contacts = contacts.map((c) => (c._id === id ? { ...c, ...data } : c));
    return reply({ success: true, contact: contacts.find((c) => c._id === id) });
  },

  // remove: (id) => api.delete(`/contacts/${id}`),
  remove: (id) => {
    contacts = contacts.filter((c) => c._id !== id);
    return reply({ success: true, message: "Contact deleted" });
  },
};

/* ── Notes ──────────────────────────────────────────────────────────── */
export const notesApi = {
  // list: (params) => api.get("/notes", { params }),
  list: () => {
    const sorted = [...notes].sort(
      (a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0)
    );
    return reply({ success: true, count: sorted.length, notes: sorted });
  },

  // create: (data) => api.post("/notes", data),
  create: (data) => {
    const note = {
      _id: uid(),
      content: data.content,
      lead: data.lead ? leadLite(data.lead) : null,
      contact: null,
      pinned: Boolean(data.pinned),
      createdAt: new Date().toISOString(),
    };
    notes = [note, ...notes];
    return reply({ success: true, note });
  },

  // update: (id, data) => api.put(`/notes/${id}`, data),
  update: (id, data) => {
    notes = notes.map((n) => {
      if (n._id !== id) return n;
      const next = { ...n, ...data };
      if ("lead" in data) next.lead = data.lead ? leadLite(data.lead) : null;
      return next;
    });
    return reply({ success: true, note: notes.find((n) => n._id === id) });
  },

  // remove: (id) => api.delete(`/notes/${id}`),
  remove: (id) => {
    notes = notes.filter((n) => n._id !== id);
    return reply({ success: true, message: "Note deleted" });
  },
};

/* ── Tasks ──────────────────────────────────────────────────────────── */
export const tasksApi = {
  // list: (params) => api.get("/tasks", { params }),
  list: () => reply({ success: true, count: tasks.length, tasks }),

  // create: (data) => api.post("/tasks", data),
  create: (data) => {
    const task = {
      _id: uid(),
      description: "",
      relatedContact: null,
      createdAt: new Date().toISOString(),
      ...data,
      relatedLead: data.relatedLead ? leadLite(data.relatedLead) : null,
      completedAt: data.status === "Completed" ? new Date().toISOString() : null,
    };
    tasks = [task, ...tasks];
    return reply({ success: true, task });
  },

  // update: (id, data) => api.put(`/tasks/${id}`, data),
  update: (id, data) => {
    tasks = tasks.map((t) => {
      if (t._id !== id) return t;
      const next = { ...t, ...data };
      if ("relatedLead" in data)
        next.relatedLead = data.relatedLead ? leadLite(data.relatedLead) : null;
      if (data.status === "Completed" && !next.completedAt)
        next.completedAt = new Date().toISOString();
      if (data.status && data.status !== "Completed") next.completedAt = null;
      return next;
    });
    return reply({ success: true, task: tasks.find((t) => t._id === id) });
  },

  // remove: (id) => api.delete(`/tasks/${id}`),
  remove: (id) => {
    tasks = tasks.filter((t) => t._id !== id);
    return reply({ success: true, message: "Task deleted" });
  },
};

/* ── AI (canned mock responses) ─────────────────────────────────────── */
export const aiApi = {
  // status: () => api.get("/ai/status"),
  status: () => reply(mockAiStatus),

  // leadSummary: (data) => api.post("/ai/lead-summary", data),
  leadSummary: () => reply(mockAiSummary, 800),

  // generateEmail: (data) => api.post("/ai/generate-email", data),
  generateEmail: () => reply(mockAiEmail, 900),

  // salesInsights: (data) => api.post("/ai/sales-insights", data),
  salesInsights: () => reply(mockAiInsights, 900),
};

/* ── Analytics (computed from the in-memory leads, so the dashboard always
      matches the Leads/Pipeline pages) ──────────────────────────────────── */
export const analyticsApi = {
  // overview: () => api.get("/analytics/overview"),
  overview: () => reply(buildOverview()),
};

function buildOverview() {
  const stages = ["New", "Qualified", "Proposal", "Won", "Lost"];
  const byStage = Object.fromEntries(stages.map((s) => [s, { count: 0, value: 0 }]));
  let totalValue = 0;
  let wonValue = 0;

  for (const l of leads) {
    const b = byStage[l.status] || (byStage[l.status] = { count: 0, value: 0 });
    b.count += 1;
    b.value += l.value || 0;
    totalValue += l.value || 0;
    if (l.status === "Won") wonValue += l.value || 0;
  }
  const won = byStage.Won.count;
  const lost = byStage.Lost.count;
  const closed = won + lost;
  const conversionRate = closed ? Math.round((won / closed) * 100) : 0;

  // Last 6 months trend from lead createdAt.
  const labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const now = new Date();
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: labels[d.getMonth()] });
  }
  const idx = Object.fromEntries(months.map((m, i) => [m.key, i]));
  const trend = months.map((m) => ({ month: m.label, leads: 0, won: 0 }));
  for (const l of leads) {
    const d = new Date(l.createdAt);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (idx[key] !== undefined) {
      trend[idx[key]].leads += 1;
      if (l.status === "Won") trend[idx[key]].won += l.value || 0;
    }
  }

  const recentLeads = [...leads]
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, 6)
    .map((l) => ({
      id: l._id,
      name: l.name,
      company: l.company,
      status: l.status,
      value: l.value,
      updatedAt: l.updatedAt,
    }));

  return {
    success: true,
    stats: {
      revenueWon: wonValue,
      pipelineValue: totalValue,
      totalLeads: leads.length,
      totalContacts: contacts.length,
      openTasks: tasks.filter((t) => t.status !== "Completed").length,
      conversionRate,
    },
    pipeline: stages.map((s) => ({ stage: s, count: byStage[s].count, value: byStage[s].value })),
    trend,
    recentLeads,
  };
}
