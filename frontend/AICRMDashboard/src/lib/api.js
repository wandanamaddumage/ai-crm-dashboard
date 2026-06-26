// import axios from "axios";

/* localStorage key for the auth token — used by AuthContext (and by the real
   API client below, once enabled). */
export const TOKEN_KEY = "ttp_crm_token";

/* ─────────────────────────────────────────────────────────────────────────
   🔌 BACKEND INTEGRATION — currently DISABLED for the UI-only boilerplate.

   While building the UI we run entirely on mock data (see lib/mockData.js,
   served through lib/services.js). When your Express backend is ready:

     1. Uncomment the `import axios` line at the top of this file.
     2. Uncomment the whole block below.
     3. In lib/services.js, swap each method from the mock version back to the
        real `api.<method>(...)` call (both are kept side-by-side there).

   That's the entire switch from "UI demo" to "fully wired app".
   ───────────────────────────────────────────────────────────────────────── */

/*
const baseURL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const api = axios.create({ baseURL });

// Attach the JWT to every request if we have one.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Normalise responses & errors so callers get clean data / messages.
api.interceptors.response.use(
  (res) => res.data,
  (error) => {
    const status = error.response?.status;
    const message =
      error.response?.data?.message || error.message || "Something went wrong";

    // Auto-logout on an expired/invalid token (but not on the login screen).
    if (status === 401 && !window.location.pathname.startsWith("/login")) {
      localStorage.removeItem(TOKEN_KEY);
    }

    return Promise.reject({ status, message });
  }
);

export default api;
*/
