// ─── Design tokens — shared across all components ────────────────────────────

export const GLASS = {
  xs:     "rgba(255,255,255,0.03)",
  sm:     "rgba(255,255,255,0.05)",
  md:     "rgba(255,255,255,0.07)",
  lg:     "rgba(255,255,255,0.09)",
  xl:     "rgba(255,255,255,0.12)",
  border: "rgba(255,255,255,0.10)",
};

export const BRAND = {
  colors: {
    green:  "#2d7a3a",
    yellow: "#f5c518",
    red:    "#dc2626",
    navy:   "#0f172a",
    card:   "#1e293b",
    border: "rgba(255,255,255,0.08)",
    muted:  "#64748b",
    white:  "#ffffff",
  },
  fonts: {
    display: "'Bebas Neue', 'Impact', sans-serif",
    body:    "'DM Sans', 'Segoe UI', system-ui, sans-serif",
  },
};

export const CLS_HDR   = "font-black tracking-wider";
export const CLS_BADGE = "text-xs font-bold";
export const CLS_CARD  = "rounded-2xl overflow-hidden";
export const CLS_ROW   = "flex items-center gap-2";

export const LOGO_SRC    = "/logo.png";
export const FAVICON_SRC = "/favicon.png";

export const JERSEY_PRESETS = [
  "#e63946","#e07b1a","#f7c948","#4caf50","#2196f3","#9c27b0",
  "#ffffff","#cccccc","#888888","#333333","#111111","#1a237e",
  "#b71c1c","#004d00","#ff6f91",
];
export const PITCH_PRESETS = [
  "#3d8b40","#1a5c2e","#7ec8a0","#8d6e63","#e0d5c0",
  "#9e9e9e","#212121","#6a1b9a","#c62828",
];

export const APP_TABS = [
  { id:"builder",   label:"⚽  Builder"   },
  { id:"community", label:"🏟️  Community" },
  { id:"profile",   label:"👤  Profile"   },
  { id:"about",     label:"🌍  About"     },
];

export const LS_ROSTER_KEY  = "fcroster_v1";
export const LS_SESSION_KEY = "fcroster_sess_v1";

export const ROLE_CAPTAIN   = "captain";
export const ROLE_ASSISTANT = "assistant_captain";
export const ROLE_PLAYER    = "player";

export const ROLE_BADGE = {
  [ROLE_CAPTAIN]:   "🎖️",
  [ROLE_ASSISTANT]: "⭐",
  [ROLE_PLAYER]:    "",
};
export const ROLE_LABEL = {
  [ROLE_CAPTAIN]:   "Captain",
  [ROLE_ASSISTANT]: "Asst. Captain",
  [ROLE_PLAYER]:    "Player",
};

export const FORMAT_DEFAULTS = { 11:"4-4-2", 9:"3-3-2", 7:"3-2-1", 5:"1-2-1" };
