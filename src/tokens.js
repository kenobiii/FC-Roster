// ─── Design tokens — shared across all components ───────────────────────────

export const GLASS = {
  xs:  "rgba(255,255,255,0.04)",
  sm:  "rgba(255,255,255,0.06)",
  md:  "rgba(255,255,255,0.07)",
  lg:  "rgba(255,255,255,0.08)",
  xl:  "rgba(255,255,255,0.10)",
  border: "rgba(255,255,255,0.12)",
};

export const CLS_HDR   = "font-black tracking-wider";
export const CLS_BADGE = "text-xs font-bold";
export const CLS_CARD  = "rounded-2xl overflow-hidden";
export const CLS_ROW   = "flex items-center gap-2";

export const BRAND = {
  colors: {
    green:  "#2d7a3a",
    yellow: "#f5c518",
    red:    "#dc2626",
    muted:  "rgba(255,255,255,0.35)",
    border: "rgba(255,255,255,0.08)",
  },
  fonts: {
    display: "'Bebas Neue', 'Arial Black', sans-serif",
    body:    "'Inter', 'Helvetica Neue', sans-serif",
  },
};

export const LOGO_SRC    = "/logo.png";
export const FAVICON_SRC = "/favicon.png";

export const JERSEY_PRESETS = ["#e63946","#e07b1a","#f7c948","#4caf50","#2196f3","#9c27b0","#fff","#111"];
export const PITCH_PRESETS  = ["#3d8b40","#1a5c2e","#7ec8a0","#8d6e63","#e0d5c0","#9e9e9e"];

export const APP_TABS = [
  { id:"builder",   label:"⚽  Builder" },
  { id:"community", label:"🏟️  Community" },
  { id:"profile",   label:"👤  Profile" },
  { id:"about",     label:"🌍  About" },
];

export const LS_ROSTER_KEY  = "fcroster_v1";
export const LS_SESSION_KEY = "fcroster_sess_v1";

export const ROLE_CAPTAIN   = "captain";
export const ROLE_ASSISTANT = "assistant_captain";
export const ROLE_PLAYER    = "player";
export const ROLE_BADGE     = { [ROLE_CAPTAIN]:"🎖️", [ROLE_ASSISTANT]:"⭐", [ROLE_PLAYER]:"" };
export const ROLE_LABEL     = { [ROLE_CAPTAIN]:"Captain", [ROLE_ASSISTANT]:"Asst. Captain", [ROLE_PLAYER]:"Player" };

export const FORMAT_DEFAULTS = { 11:"4-4-2", 9:"3-3-2", 7:"3-2-1", 5:"1-2-1" };

export const FORMATION_KEYS = {
  11: ["4-4-2","4-3-3","4-2-3-1","3-5-2","3-4-3","5-3-2","5-4-1","4-1-4-1","4-5-1","3-4-2-1"],
   9: ["3-3-2","3-2-3","2-3-3","4-2-2","2-4-2","3-4-1"],
   7: ["3-2-1","2-3-1","2-2-2","3-1-2","1-3-2","2-3-2"],
   5: ["1-2-1","2-1-1","1-1-2","2-2"],
};
