// ─── Supabase client — all database access ──────────────────────────────────

// ─── Supabase Client ──────────────────────────────────────────────────────────
const SUPABASE_URL  = "https://myorudjfmsmixgjygsuk.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15b3J1ZGpmbXNtaXhnanlnc3VrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1MjYxNDIsImV4cCI6MjA5MDEwMjE0Mn0.nENeexKGlEWkUhp-Z7tDmMVcng9KD7_tAFDJqf5rzfQ";

// Lightweight Supabase REST helper — no SDK needed
const sb = {
  headers: { "Content-Type":"application/json", "apikey": SUPABASE_ANON, "Authorization": `Bearer ${SUPABASE_ANON}` },

  async select(table, query="") {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}${query}`, { headers: { ...sb.headers, "Accept":"application/json" } });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },

  async signUp(email, password) {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method:"POST", headers: sb.headers,
      body: JSON.stringify({ email, password }),
    });
    return r.json();
  },

  async signIn(email, password) {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method:"POST", headers: sb.headers,
      body: JSON.stringify({ email, password }),
    });
    return r.json();
  },

  async signOut(token) {
    await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
      method:"POST", headers: { ...sb.headers, "Authorization": `Bearer ${token}` },
    });
  },

  // Google OAuth — redirects browser to Google, returns via callback URL
  signInWithGoogle() {
    track("login", { method: "google" });
    const redirectTo = encodeURIComponent(window.location.origin + window.location.pathname);
    window.location.href = `${SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${redirectTo}`;
  },

  async authedInsert(table, data, token) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method:"POST",
      headers: { ...sb.headers, "Authorization": `Bearer ${token}`, "Prefer":"return=representation" },
      body: JSON.stringify(data),
    });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },

  async updatePost(postId, data, token) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/posts?id=eq.${postId}`, {
      method:"PATCH",
      headers: { ...sb.headers, "Authorization":`Bearer ${token}`, "Prefer":"return=minimal" },
      body: JSON.stringify(data),
    });
    return r.ok;
  },

  async deletePost(postId, token) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/posts?id=eq.${postId}`, {
      method:"PATCH",
      headers: { ...sb.headers, "Authorization":`Bearer ${token}`, "Prefer":"return=minimal" },
      body: JSON.stringify({ is_deleted:true, title:"[Deleted]", body:"[This post has been deleted]" }),
    });
    return r.ok;
  },

  // Upsert (insert or update on conflict) — used for roster + profile saves
  async upsert(table, data, token) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method:"POST",
      headers: { ...sb.headers, "Authorization": `Bearer ${token}`, "Prefer":"resolution=merge-duplicates,return=representation" },
      body: JSON.stringify(data),
    });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },

  // Fetch a single user profile
  async getPostCount(userId, token) {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/posts?user_id=eq.${userId}&is_deleted=not.eq.true&select=id`,
      { headers: { ...sb.headers, "Authorization":`Bearer ${token}` } }
    );
    if (!r.ok) return 0;
    const data = await r.json();
    return Array.isArray(data) ? data.length : 0;
  },

  async getProfile(userId, token) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=*`, {
      headers: { ...sb.headers, "Authorization": `Bearer ${token}`, "Accept":"application/json" },
    });
    if (!r.ok) return null;
    const data = await r.json();
    return Array.isArray(data) && data.length ? data[0] : null;
  },

  // Fetch a saved roster for user
  async getRoster(userId, token) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/rosters?user_id=eq.${userId}&select=*`, {
      headers: { ...sb.headers, "Authorization": `Bearer ${token}`, "Accept":"application/json" },
    });
    if (!r.ok) return null;
    const data = await r.json();
    return Array.isArray(data) && data.length ? data[0] : null;
  },

  // Fetch reaction counts for a post (anon-readable)
  async getReactions(postId) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/reactions?post_id=eq.${postId}&select=type`, {
      headers: { ...sb.headers, "Accept":"application/json" },
    });
    if (!r.ok) return {};
    const rows = await r.json();
    return (rows || []).reduce((acc, row) => {
      acc[row.type] = (acc[row.type] || 0) + 1;
      return acc;
    }, {});
  },

  // Fetch which types the current user has reacted with on a post
  async getUserReactions(postId, userId, token) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/reactions?post_id=eq.${postId}&user_id=eq.${userId}&select=type`, {
      headers: { ...sb.headers, "Authorization": `Bearer ${token}`, "Accept":"application/json" },
    });
    if (!r.ok) return [];
    const rows = await r.json();
    return (rows || []).map(row => row.type);
  },

  // Toggle a reaction — insert if not present, delete if already there
  async toggleReaction(postId, type, userId, token) {
    const checkR = await fetch(`${SUPABASE_URL}/rest/v1/reactions?post_id=eq.${postId}&user_id=eq.${userId}&type=eq.${type}&select=id`, {
      headers: { ...sb.headers, "Authorization": `Bearer ${token}`, "Accept":"application/json" },
    });
    const existing = await checkR.json();
    if (Array.isArray(existing) && existing.length > 0) {
      await fetch(`${SUPABASE_URL}/rest/v1/reactions?post_id=eq.${postId}&user_id=eq.${userId}&type=eq.${type}`, {
        method:"DELETE", headers: { ...sb.headers, "Authorization": `Bearer ${token}` },
      });
      return "removed";
    } else {
      await fetch(`${SUPABASE_URL}/rest/v1/reactions`, {
        method:"POST",
        headers: { ...sb.headers, "Authorization": `Bearer ${token}`, "Prefer":"return=minimal" },
        body: JSON.stringify({ post_id: postId, user_id: userId, type }),
      });
      return "added";
    }
  },

  // ── Team management ────────────────────────────────────────────────────────
  async createTeam(name, format, userId, token) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/teams`, {
      method:"POST",
      headers: { ...sb.headers, "Authorization":`Bearer ${token}`, "Prefer":"return=representation" },
      body: JSON.stringify({ name: name.trim(), format, captain_id: userId }),
    });
    if (!r.ok) return null;
    const rows = await r.json();
    const team = Array.isArray(rows) ? rows[0] : rows;
    if (!team?.id) return null;
    // Insert captain row into team_members
    await fetch(`${SUPABASE_URL}/rest/v1/team_members`, {
      method:"POST",
      headers: { ...sb.headers, "Authorization":`Bearer ${token}`, "Prefer":"return=minimal" },
      body: JSON.stringify({ team_id: team.id, user_id: userId, role:"captain" }),
    });
    return team;
  },

  async getTeam(teamId, token) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/teams?id=eq.${teamId}&select=*`, {
      headers: { ...sb.headers, "Authorization":`Bearer ${token}`, "Accept":"application/json" },
    });
    if (!r.ok) return null;
    const rows = await r.json();
    return Array.isArray(rows) && rows.length ? rows[0] : null;
  },

  async getTeamByInviteCode(code) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/teams?invite_code=eq.${encodeURIComponent(code.toUpperCase())}&select=*`, {
      headers: { ...sb.headers, "Accept":"application/json" },
    });
    if (!r.ok) return null;
    const rows = await r.json();
    return Array.isArray(rows) && rows.length ? rows[0] : null;
  },

  async getTeamMembers(teamId, token) {
    // Join team_members with profiles to get display info
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/team_members?team_id=eq.${teamId}&select=*,profiles(display_name,avatar_emoji)`,
      { headers: { ...sb.headers, "Authorization":`Bearer ${token}`, "Accept":"application/json" } },
    );
    if (!r.ok) return [];
    const rows = await r.json();
    return Array.isArray(rows) ? rows : [];
  },

  async joinTeam(teamId, userId, token) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/team_members`, {
      method:"POST",
      headers: { ...sb.headers, "Authorization":`Bearer ${token}`, "Prefer":"return=minimal" },
      body: JSON.stringify({ team_id: teamId, user_id: userId, role:"player" }),
    });
    return r.ok;
  },

  async leaveTeam(teamId, userId, token) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/team_members?team_id=eq.${teamId}&user_id=eq.${userId}`, {
      method:"DELETE",
      headers: { ...sb.headers, "Authorization":`Bearer ${token}` },
    });
    return r.ok;
  },

  async updateMember(teamId, userId, updates, token) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/team_members?team_id=eq.${teamId}&user_id=eq.${userId}`, {
      method:"PATCH",
      headers: { ...sb.headers, "Authorization":`Bearer ${token}`, "Prefer":"return=minimal" },
      body: JSON.stringify(updates),
    });
    return r.ok;
  },

  async removeMember(teamId, userId, token) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/team_members?team_id=eq.${teamId}&user_id=eq.${userId}`, {
      method:"DELETE",
      headers: { ...sb.headers, "Authorization":`Bearer ${token}` },
    });
    return r.ok;
  },

  async regenerateInviteCode(teamId, token) {
    // Generate a new 6-char code client-side
    const code = Math.random().toString(36).substring(2,8).toUpperCase();
    const r = await fetch(`${SUPABASE_URL}/rest/v1/teams?id=eq.${teamId}`, {
      method:"PATCH",
      headers: { ...sb.headers, "Authorization":`Bearer ${token}`, "Prefer":"return=minimal" },
      body: JSON.stringify({ invite_code: code }),
    });
    return r.ok ? code : null;
  },

};

export { sb, SUPABASE_URL, SUPABASE_ANON };
