// ─── Player card system + community constants ─────────────────────────────────

// ── Attribute system ──────────────────────────────────────────────────────────
export const POINT_POOL = 420;
export const ATTR_MIN   = 10;
export const ATTR_MAX   = 99;

export const ATTRS = ["pac","sho","pas","dri","def","phy"];

export const ATTR_META = {
  pac: { label:"Pace",     color:"#f59e0b", icon:"⚡" },
  sho: { label:"Shooting", color:"#ef4444", icon:"🎯" },
  pas: { label:"Passing",  color:"#3b82f6", icon:"🎯" },
  dri: { label:"Dribbling",color:"#8b5cf6", icon:"🌀" },
  def: { label:"Defence",  color:"#10b981", icon:"🛡️" },
  phy: { label:"Physical", color:"#f97316", icon:"💪" },
};

// ── Player class tiers ────────────────────────────────────────────────────────
export const PLAYER_CLASSES = [
  { name:"Grass Roots", min:10,  max:44,  color:"#9d7a4a", badge:"🌱" },
  { name:"Rec Player",  min:45,  max:59,  color:"#6b7280", badge:"⚽" },
  { name:"Club/League", min:60,  max:72,  color:"#2563eb", badge:"🏅" },
  { name:"Comp Player", min:73,  max:82,  color:"#7c3aed", badge:"🏆" },
  { name:"Semi-Pro",    min:83,  max:91,  color:"#d97706", badge:"⭐" },
  { name:"Pro",         min:92,  max:99,  color:"#eab308", badge:"💎" },
];

// ── Vibe cards ────────────────────────────────────────────────────────────────
export const VIBE_CARDS = [
  { id:"engine",    label:"The Engine",    emoji:"⚙️",  desc:"Never stops running" },
  { id:"leader",    label:"The Leader",    emoji:"🎖️",  desc:"Commands the pitch" },
  { id:"magician",  label:"The Magician",  emoji:"🪄",  desc:"Impossible touches" },
  { id:"wall",      label:"The Wall",      emoji:"🧱",  desc:"Stops everything" },
  { id:"sniper",    label:"The Sniper",    emoji:"🎯",  desc:"Clinical finisher" },
  { id:"playmaker", label:"The Playmaker", emoji:"🧠",  desc:"Sees passes others don't" },
  { id:"speedster", label:"The Speedster", emoji:"⚡",  desc:"Impossible to catch" },
  { id:"warrior",   label:"The Warrior",   emoji:"⚔️",  desc:"Wins every battle" },
];

// ── All positions ─────────────────────────────────────────────────────────────
export const ALL_POSITIONS = [
  "GK","CB","LB","RB","LWB","RWB",
  "DM","CM","AM","LM","RM","CAM","CDM",
  "LW","RW","SS","ST","CF","FW",
];

// ── Roles in sport ────────────────────────────────────────────────────────────
export const ROLES_IN_SPORT = [
  { id:"player",   label:"Player",          emoji:"⚽" },
  { id:"coach",    label:"Coach / Manager", emoji:"📋" },
  { id:"referee",  label:"Referee",         emoji:"🟨" },
  { id:"fan",      label:"Fan",             emoji:"📣" },
];

// ── Role designations (captain / assistant / player) ─────────────────────────
export const ROLE_DESIGNATIONS = [
  { id:"captain",           label:"Captain",           emoji:"🎖️" },
  { id:"assistant_captain", label:"Assistant Captain", emoji:"⭐" },
  { id:"player",            label:"Player",            emoji:"⚽" },
];

// ── Countries ─────────────────────────────────────────────────────────────────
// Format: [name, flag_emoji]
export const COUNTRIES = [
  ["Afghanistan","🇦🇫"],["Albania","🇦🇱"],["Algeria","🇩🇿"],["Andorra","🇦🇩"],
  ["Angola","🇦🇴"],["Argentina","🇦🇷"],["Armenia","🇦🇲"],["Australia","🇦🇺"],
  ["Austria","🇦🇹"],["Azerbaijan","🇦🇿"],["Bahrain","🇧🇭"],["Bangladesh","🇧🇩"],
  ["Belarus","🇧🇾"],["Belgium","🇧🇪"],["Bolivia","🇧🇴"],["Bosnia & Herzegovina","🇧🇦"],
  ["Brazil","🇧🇷"],["Bulgaria","🇧🇬"],["Cameroon","🇨🇲"],["Canada","🇨🇦"],
  ["Chile","🇨🇱"],["China","🇨🇳"],["Colombia","🇨🇴"],["Costa Rica","🇨🇷"],
  ["Croatia","🇭🇷"],["Cuba","🇨🇺"],["Czech Republic","🇨🇿"],["Denmark","🇩🇰"],
  ["DR Congo","🇨🇩"],["Ecuador","🇪🇨"],["Egypt","🇪🇬"],["El Salvador","🇸🇻"],
  ["England","🏴󠁧󠁢󠁥󠁮󠁧󠁿"],["Ethiopia","🇪🇹"],["Finland","🇫🇮"],["France","🇫🇷"],
  ["Germany","🇩🇪"],["Ghana","🇬🇭"],["Greece","🇬🇷"],["Guatemala","🇬🇹"],
  ["Honduras","🇭🇳"],["Hungary","🇭🇺"],["Iceland","🇮🇸"],["India","🇮🇳"],
  ["Indonesia","🇮🇩"],["Iran","🇮🇷"],["Iraq","🇮🇶"],["Ireland","🇮🇪"],
  ["Israel","🇮🇱"],["Italy","🇮🇹"],["Ivory Coast","🇨🇮"],["Jamaica","🇯🇲"],
  ["Japan","🇯🇵"],["Jordan","🇯🇴"],["Kazakhstan","🇰🇿"],["Kenya","🇰🇪"],
  ["Kuwait","🇰🇼"],["Lebanon","🇱🇧"],["Libya","🇱🇾"],["Lithuania","🇱🇹"],
  ["Luxembourg","🇱🇺"],["Malaysia","🇲🇾"],["Mali","🇲🇱"],["Malta","🇲🇹"],
  ["Mexico","🇲🇽"],["Moldova","🇲🇩"],["Montenegro","🇲🇪"],["Morocco","🇲🇦"],
  ["Netherlands","🇳🇱"],["New Zealand","🇳🇿"],["Nicaragua","🇳🇮"],["Nigeria","🇳🇬"],
  ["North Korea","🇰🇵"],["North Macedonia","🇲🇰"],["Northern Ireland","🏴"],
  ["Norway","🇳🇴"],["Oman","🇴🇲"],["Pakistan","🇵🇰"],["Palestine","🇵🇸"],
  ["Panama","🇵🇦"],["Paraguay","🇵🇾"],["Peru","🇵🇪"],["Philippines","🇵🇭"],
  ["Poland","🇵🇱"],["Portugal","🇵🇹"],["Qatar","🇶🇦"],["Romania","🇷🇴"],
  ["Russia","🇷🇺"],["Saudi Arabia","🇸🇦"],["Scotland","🏴󠁧󠁢󠁳󠁣󠁴󠁿"],["Senegal","🇸🇳"],
  ["Serbia","🇷🇸"],["Slovakia","🇸🇰"],["Slovenia","🇸🇮"],["Somalia","🇸🇴"],
  ["South Africa","🇿🇦"],["South Korea","🇰🇷"],["Spain","🇪🇸"],["Sudan","🇸🇩"],
  ["Sweden","🇸🇪"],["Switzerland","🇨🇭"],["Syria","🇸🇾"],["Tanzania","🇹🇿"],
  ["Thailand","🇹🇭"],["Trinidad & Tobago","🇹🇹"],["Tunisia","🇹🇳"],["Turkey","🇹🇷"],
  ["Uganda","🇺🇬"],["Ukraine","🇺🇦"],["United Arab Emirates","🇦🇪"],
  ["United Kingdom","🇬🇧"],["United States","🇺🇸"],["Uruguay","🇺🇾"],
  ["Venezuela","🇻🇪"],["Vietnam","🇻🇳"],["Wales","🏴󠁧󠁢󠁷󠁬󠁳󠁿"],["Yemen","🇾🇪"],
  ["Zambia","🇿🇲"],["Zimbabwe","🇿🇼"],
];

// ── Community tags ────────────────────────────────────────────────────────────
export const COMMUNITY_TAGS = [
  "Tactics","Formation","Transfer","General","Debate",
  "Highlights","Coaching","Fitness","Referees","Grassroots",
];

export const COMMUNITY_TAG_COLORS = {
  Tactics:    "#2563eb",
  Formation:  "#7c3aed",
  Transfer:   "#059669",
  General:    "#64748b",
  Debate:     "#dc2626",
  Highlights: "#d97706",
  Coaching:   "#0891b2",
  Fitness:    "#16a34a",
  Referees:   "#eab308",
  Grassroots: "#92400e",
};

// ── Reactions ─────────────────────────────────────────────────────────────────
export const REACTIONS = [
  { emoji:"🔥", key:"fire",    label:"Fire"    },
  { emoji:"⚽", key:"ball",    label:"Iconic"  },
  { emoji:"🏆", key:"trophy",  label:"W"       },
  { emoji:"❌", key:"cross",   label:"Nah"     },
  { emoji:"🤣", key:"laugh",   label:"Funny"   },
];

export const RED_CARD_MOD_THRESHOLD = -15;
