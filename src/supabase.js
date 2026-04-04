// ─── Supabase client — all database access ───────────────────────────────────
export const SUPABASE_URL  = "https://myorudjfmsmixgjygsuk.supabase.co";
export const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15b3J1ZGpmbXNtaXhnanlnc3VrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1MjYxNDIsImV4cCI6MjA5MDEwMjE0Mn0.nENeexKGlEWkUhp-Z7tDmMVcng9KD7_tAFDJqf5rzfQ";

// ── Internal helpers ──────────────────────────────────────────────────────────
function hdrs(token) {
  return {
    "Content-Type":  "application/json",
    "apikey":        SUPABASE_ANON,
    "Authorization": `Bearer ${token || SUPABASE_ANON}`,
  };
}

async function rest(path, opts = {}) {
  const res  = await fetch(`${SUPABASE_URL}${path}`, opts);
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) throw new Error(typeof data === "string" ? data : JSON.stringify(data));
  return data;
}

// ── Exported sb object ────────────────────────────────────────────────────────
export const sb = {

  // ── Auth (used by Shared.jsx) ─────────────────────────────────────────────
  async signUp(email, password) {
    return rest("/auth/v1/signup", {
      method:  "POST",
      headers: hdrs(),
      body:    JSON.stringify({ email, password }),
    });
  },

  async signIn(email, password) {
    return rest("/auth/v1/token?grant_type=password", {
      method:  "POST",
      headers: hdrs(),
      body:    JSON.stringify({ email, password }),
    });
  },

  async signOut(token) {
    try {
      await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
        method:  "POST",
        headers: hdrs(token),
      });
    } catch {}
  },

  signInWithGoogle() {
    const redirectTo = encodeURIComponent(window.location.origin);
    window.location.href =
      `${SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${redirectTo}`;
  },

  // ── Generic REST (used by Community.jsx) ──────────────────────────────────
  async select(table, query = "") {
    return rest(`/rest/v1/${table}${query}`, {
      headers: { ...hdrs(), Accept: "application/json" },
    });
  },

  async authedInsert(table, data, token) {
    return rest(`/rest/v1/${table}`, {
      method:  "POST",
      headers: { ...hdrs(token), Prefer: "return=representation" },
      body:    JSON.stringify(data),
    });
  },

  // ── Profile upsert (used by Profile.jsx) ─────────────────────────────────
  async upsert(table, data, token) {
    return rest(`/rest/v1/${table}`, {
      method:  "POST",
      headers: {
        ...hdrs(token),
        Prefer: "resolution=merge-duplicates,return=representation",
      },
      body: JSON.stringify(data),
    });
  },

  // ── Post edit / delete (used by Community.jsx) ───────────────────────────
  async updatePost(postId, data) {
    return rest(`/rest/v1/posts?id=eq.${postId}`, {
      method:  "PATCH",
      headers: { ...hdrs(), Prefer: "return=representation" },
      body:    JSON.stringify(data),
    });
  },

  async deletePost(postId, token) {
    await rest(`/rest/v1/posts?id=eq.${postId}`, {
      method:  "DELETE",
      headers: hdrs(token),
    });
    return true;
  },

  // ── Reactions (used by Community.jsx) ────────────────────────────────────
  async getReactions(postId) {
    const rows = await rest(
      `/rest/v1/reactions?post_id=eq.${postId}&select=type`,
      { headers: { ...hdrs(), Accept: "application/json" } }
    ).catch(() => []);
    const counts = {};
    (rows || []).forEach(r => { counts[r.type] = (counts[r.type] || 0) + 1; });
    return counts;
  },

  async getUserReactions(postId, userId, token) {
    const rows = await rest(
      `/rest/v1/reactions?post_id=eq.${postId}&user_id=eq.${userId}&select=type`,
      { headers: { ...hdrs(token), Accept: "application/json" } }
    ).catch(() => []);
    return (rows || []).map(r => r.type);
  },

  async toggleReaction(postId, type, userId, token) {
    const existing = await rest(
      `/rest/v1/reactions?post_id=eq.${postId}&user_id=eq.${userId}&type=eq.${type}&select=id`,
      { headers: { ...hdrs(token), Accept: "application/json" } }
    ).catch(() => []);

    if (existing && existing.length > 0) {
      await rest(
        `/rest/v1/reactions?post_id=eq.${postId}&user_id=eq.${userId}&type=eq.${type}`,
        { method: "DELETE", headers: hdrs(token) }
      );
    } else {
      await rest("/rest/v1/reactions", {
        method:  "POST",
        headers: { ...hdrs(token), Prefer: "return=minimal" },
        body:    JSON.stringify({ post_id: postId, user_id: userId, type }),
      });
    }
  },

  // ── Teams (used by Profile.jsx) ───────────────────────────────────────────
  async createTeam(name, format, userId, token) {
    const inviteCode = Math.random().toString(36).slice(2, 8).toUpperCase();
    const rows = await rest("/rest/v1/teams", {
      method:  "POST",
      headers: { ...hdrs(token), Prefer: "return=representation" },
      body:    JSON.stringify({ name, format, owner_id: userId, invite_code: inviteCode }),
    });
    const team = Array.isArray(rows) ? rows[0] : rows;
    if (team?.id) {
      await rest("/rest/v1/team_members", {
        method:  "POST",
        headers: { ...hdrs(token), Prefer: "return=minimal" },
        body:    JSON.stringify({ team_id: team.id, user_id: userId, role: "captain" }),
      }).catch(() => {});
    }
    return team;
  },

  async getTeamByInviteCode(code) {
    const rows = await rest(
      `/rest/v1/teams?invite_code=eq.${code}&select=*`,
      { headers: { ...hdrs(), Accept: "application/json" } }
    );
    return Array.isArray(rows) ? rows[0] : null;
  },

  async joinTeam(teamId, userId, token) {
    await rest("/rest/v1/team_members", {
      method:  "POST",
      headers: { ...hdrs(token), Prefer: "return=minimal" },
      body:    JSON.stringify({ team_id: teamId, user_id: userId, role: "player" }),
    });
    return true;
  },

  async updateMember(teamId, userId, data, token) {
    await rest(
      `/rest/v1/team_members?team_id=eq.${teamId}&user_id=eq.${userId}`,
      {
        method:  "PATCH",
        headers: { ...hdrs(token), Prefer: "return=minimal" },
        body:    JSON.stringify(data),
      }
    );
    return true;
  },

  async removeMember(teamId, userId, token) {
    await rest(
      `/rest/v1/team_members?team_id=eq.${teamId}&user_id=eq.${userId}`,
      { method: "DELETE", headers: hdrs(token) }
    );
    return true;
  },

  async regenerateInviteCode(teamId, token) {
    const newCode = Math.random().toString(36).slice(2, 8).toUpperCase();
    await rest(`/rest/v1/teams?id=eq.${teamId}`, {
      method:  "PATCH",
      headers: { ...hdrs(token), Prefer: "return=minimal" },
      body:    JSON.stringify({ invite_code: newCode }),
    });
    return newCode;
  },
};
