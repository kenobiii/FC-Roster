// ─── Helper functions — analytics, persistence, player card math ──────────────
import { LS_ROSTER_KEY } from "./tokens.js";
import { PLAYER_CLASSES, ATTRS, ATTR_META } from "./playerData.js";

// ── Analytics ─────────────────────────────────────────────────────────────────
export function track(eventName, params = {}) {
  try {
    if (typeof window !== "undefined" && typeof window.gtag === "function") {
      window.gtag("event", eventName, params);
    }
  } catch {}
}

// ── Roster persistence ────────────────────────────────────────────────────────
export function saveRosterLocal(data) {
  try { localStorage.setItem(LS_ROSTER_KEY, JSON.stringify(data)); } catch {}
}
export function loadRosterLocal() {
  try {
    const s = localStorage.getItem(LS_ROSTER_KEY);
    return s ? JSON.parse(s) : null;
  } catch { return null; }
}

// ── Colour contrast helper ────────────────────────────────────────────────────
export function contrastColor(hex = "#000000") {
  const h = hex.replace("#", "").padEnd(6, "0");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) > 150 ? "#111" : "#fff";
}

// ── Player card maths ─────────────────────────────────────────────────────────
export function calcOverall(form) {
  if (!form) return 10;
  const vals = ATTRS.map(a => Number(form[`attr_${a}`] ?? 10));
  return Math.round(vals.reduce((s, v) => s + v, 0) / vals.length);
}

export function calcClass(overall) {
  return (
    PLAYER_CLASSES.find(c => overall >= c.min && overall <= c.max) ||
    PLAYER_CLASSES[0]
  );
}

export function getTopStats(form) {
  if (!form) return [];
  return ATTRS
    .map(a => ({
      key:   ATTR_META[a]?.label || a,
      val:   Number(form[`attr_${a}`] ?? 10),
      color: ATTR_META[a]?.color || "#64748b",
    }))
    .sort((a, b) => b.val - a.val)
    .slice(0, 2);
}

export function pointsUsed(form) {
  if (!form) return 0;
  return ATTRS.reduce((s, a) => s + Number(form[`attr_${a}`] ?? 10), 0);
}

// ── Role helpers ──────────────────────────────────────────────────────────────
export function isNonPlayer(role) {
  return role === "referee" || role === "fan";
}
