// ─── Player card system + community constants ────────────────────────────────

// ─── Player Card System ───────────────────────────────────────────────────────
const POINT_POOL  = 400;
const ATTR_MIN    = 10;
const ATTR_MAX    = 95;
const ATTRS       = ["pac","sho","pas","dri","def","phy"];
const ATTR_META   = {
  pac: { label:"PAC", full:"Pace",         desc:"Speed & Acceleration",        color:"#f97316" },
  sho: { label:"SHO", full:"Shooting",     desc:"Accuracy & Finishing",        color:"#ef4444" },
  pas: { label:"PAS", full:"Passing",      desc:"Vision & Distribution",       color:"#60a5fa" },
  dri: { label:"DRI", full:"Dribbling",    desc:"Agility & Ball Control",      color:"#a78bfa" },
  def: { label:"DEF", full:"Defending",    desc:"Tackling & Interceptions",    color:"#22c55e" },
  phy: { label:"PHY", full:"Physicality",  desc:"Strength, Stamina & Grit",    color:"#f5c518" },
};

const PLAYER_CLASSES = [
  { emoji:"🌱", name:"Grass Roots", min:0,  max:20,  stars:1, color:"#94a3b8", glow:"rgba(148,163,184,0.3)" },
  { emoji:"⚽", name:"Rec Player",  min:21, max:40,  stars:2, color:"#4ade80", glow:"rgba(74,222,128,0.3)"  },
  { emoji:"🏟️", name:"Club/League", min:41, max:60,  stars:3, color:"#60a5fa", glow:"rgba(96,165,250,0.3)"  },
  { emoji:"📈", name:"Comp Player", min:61, max:80,  stars:4, color:"#a78bfa", glow:"rgba(167,139,250,0.3)" },
  { emoji:"🌟", name:"Semi-Pro",    min:81, max:95,  stars:5, color:"#f5c518", glow:"rgba(245,197,24,0.3)"  },
  { emoji:"👑", name:"Pro",         min:96, max:100, stars:6, color:"#fbbf24", glow:"rgba(251,191,36,0.5)"  },
];

const ROLE_DESIGNATIONS = {
  referee: { emoji:"🦓", name:"Referee",          skipAttrs:true  },
  fan:     { emoji:"👀", name:"Fan / Supporter",  skipAttrs:true  },
};

const ROLES_IN_SPORT = [
  { id:"player",   label:"Player",             emoji:"⚽" },
  { id:"captain",  label:"Team Captain",       emoji:"🎖️" },
  { id:"coach",    label:"Coach / Manager",    emoji:"📋" },
  { id:"referee",  label:"Referee",            emoji:"🦓" },
  { id:"scout",    label:"Scout / Analyst",    emoji:"🔭" },
  { id:"fan",      label:"Fan / Supporter",    emoji:"👀" },
  { id:"parent",   label:"Parent / Guardian",  emoji:"👨‍👧" },
  { id:"admin",    label:"Club Administrator", emoji:"🏢" },
];

const VIBE_CARDS = [
  { id:"newbie",  label:"Newbie",      emoji:"🌱", desc:"Just getting started",         attrs:{pac:10,sho:10,pas:10,dri:10,def:10,phy:10} },
  { id:"casual",  label:"Casual",      emoji:"⚽", desc:"Playing for fun",              attrs:{pac:50,sho:50,pas:50,dri:50,def:50,phy:50} },
  { id:"regular", label:"The Regular", emoji:"🏟️", desc:"Show up every week",           attrs:{pac:65,sho:62,pas:68,dri:65,def:68,phy:72} },
  { id:"sweat",   label:"Sweat",       emoji:"📈", desc:"Here to compete",              attrs:{pac:85,sho:75,pas:60,dri:80,def:50,phy:50} },
  { id:"goat",    label:"GOAT",        emoji:"👑", desc:"Elite level — no excuses",     attrs:{pac:68,sho:68,pas:66,dri:66,def:66,phy:66} },
];

// Countries — name + flag emoji
const COUNTRIES = [
  ["Afghanistan","🇦🇫"],["Albania","🇦🇱"],["Algeria","🇩🇿"],["Andorra","🇦🇩"],["Angola","🇦🇴"],
  ["Antigua & Barbuda","🇦🇬"],["Argentina","🇦🇷"],["Armenia","🇦🇲"],["Australia","🇦🇺"],["Austria","🇦🇹"],
  ["Azerbaijan","🇦🇿"],["Bahamas","🇧🇸"],["Bahrain","🇧🇭"],["Bangladesh","🇧🇩"],["Barbados","🇧🇧"],
  ["Belarus","🇧🇾"],["Belgium","🇧🇪"],["Belize","🇧🇿"],["Benin","🇧🇯"],["Bhutan","🇧🇹"],
  ["Bolivia","🇧🇴"],["Bosnia & Herzegovina","🇧🇦"],["Botswana","🇧🇼"],["Brazil","🇧🇷"],["Brunei","🇧🇳"],
  ["Bulgaria","🇧🇬"],["Burkina Faso","🇧🇫"],["Burundi","🇧🇮"],["Cambodia","🇰🇭"],["Cameroon","🇨🇲"],
  ["Canada","🇨🇦"],["Cape Verde","🇨🇻"],["Central African Republic","🇨🇫"],["Chad","🇹🇩"],["Chile","🇨🇱"],
  ["China","🇨🇳"],["Colombia","🇨🇴"],["Comoros","🇰🇲"],["Congo","🇨🇬"],["Costa Rica","🇨🇷"],
  ["Croatia","🇭🇷"],["Cuba","🇨🇺"],["Cyprus","🇨🇾"],["Czech Republic","🇨🇿"],["Denmark","🇩🇰"],
  ["Djibouti","🇩🇯"],["Dominica","🇩🇲"],["Dominican Republic","🇩🇴"],["Ecuador","🇪🇨"],["Egypt","🇪🇬"],
  ["El Salvador","🇸🇻"],["Equatorial Guinea","🇬🇶"],["Eritrea","🇪🇷"],["Estonia","🇪🇪"],["Eswatini","🇸🇿"],
  ["Ethiopia","🇪🇹"],["Fiji","🇫🇯"],["Finland","🇫🇮"],["France","🇫🇷"],["Gabon","🇬🇦"],
  ["Gambia","🇬🇲"],["Georgia","🇬🇪"],["Germany","🇩🇪"],["Ghana","🇬🇭"],["Greece","🇬🇷"],
  ["Grenada","🇬🇩"],["Guatemala","🇬🇹"],["Guinea","🇬🇳"],["Guinea-Bissau","🇬🇼"],["Guyana","🇬🇾"],
  ["Haiti","🇭🇹"],["Honduras","🇭🇳"],["Hungary","🇭🇺"],["Iceland","🇮🇸"],["India","🇮🇳"],
  ["Indonesia","🇮🇩"],["Iran","🇮🇷"],["Iraq","🇮🇶"],["Ireland","🇮🇪"],["Israel","🇮🇱"],
  ["Italy","🇮🇹"],["Ivory Coast","🇨🇮"],["Jamaica","🇯🇲"],["Japan","🇯🇵"],["Jordan","🇯🇴"],
  ["Kazakhstan","🇰🇿"],["Kenya","🇰🇪"],["Kosovo","🇽🇰"],["Kuwait","🇰🇼"],["Kyrgyzstan","🇰🇬"],
  ["Laos","🇱🇦"],["Latvia","🇱🇻"],["Lebanon","🇱🇧"],["Lesotho","🇱🇸"],["Liberia","🇱🇷"],
  ["Libya","🇱🇾"],["Liechtenstein","🇱🇮"],["Lithuania","🇱🇹"],["Luxembourg","🇱🇺"],["Madagascar","🇲🇬"],
  ["Malawi","🇲🇼"],["Malaysia","🇲🇾"],["Maldives","🇲🇻"],["Mali","🇲🇱"],["Malta","🇲🇹"],
  ["Mauritania","🇲🇷"],["Mauritius","🇲🇺"],["Mexico","🇲🇽"],["Moldova","🇲🇩"],["Monaco","🇲🇨"],
  ["Mongolia","🇲🇳"],["Montenegro","🇲🇪"],["Morocco","🇲🇦"],["Mozambique","🇲🇿"],["Myanmar","🇲🇲"],
  ["Namibia","🇳🇦"],["Nepal","🇳🇵"],["Netherlands","🇳🇱"],["New Zealand","🇳🇿"],["Nicaragua","🇳🇮"],
  ["Niger","🇳🇪"],["Nigeria","🇳🇬"],["North Korea","🇰🇵"],["North Macedonia","🇲🇰"],["Norway","🇳🇴"],
  ["Oman","🇴🇲"],["Pakistan","🇵🇰"],["Palestine","🇵🇸"],["Panama","🇵🇦"],["Papua New Guinea","🇵🇬"],
  ["Paraguay","🇵🇾"],["Peru","🇵🇪"],["Philippines","🇵🇭"],["Poland","🇵🇱"],["Portugal","🇵🇹"],
  ["Qatar","🇶🇦"],["Romania","🇷🇴"],["Russia","🇷🇺"],["Rwanda","🇷🇼"],["Saudi Arabia","🇸🇦"],
  ["Senegal","🇸🇳"],["Serbia","🇷🇸"],["Sierra Leone","🇸🇱"],["Slovakia","🇸🇰"],["Slovenia","🇸🇮"],
  ["Somalia","🇸🇴"],["South Africa","🇿🇦"],["South Korea","🇰🇷"],["South Sudan","🇸🇸"],["Spain","🇪🇸"],
  ["Sri Lanka","🇱🇰"],["Sudan","🇸🇩"],["Suriname","🇸🇷"],["Sweden","🇸🇪"],["Switzerland","🇨🇭"],
  ["Syria","🇸🇾"],["Taiwan","🇹🇼"],["Tajikistan","🇹🇯"],["Tanzania","🇹🇿"],["Thailand","🇹🇭"],
  ["Togo","🇹🇬"],["Trinidad & Tobago","🇹🇹"],["Tunisia","🇹🇳"],["Turkey","🇹🇷"],["Turkmenistan","🇹🇲"],
  ["Uganda","🇺🇬"],["Ukraine","🇺🇦"],["United Arab Emirates","🇦🇪"],["United Kingdom","🇬🇧"],
  ["United States","🇺🇸"],["Uruguay","🇺🇾"],["Uzbekistan","🇺🇿"],["Venezuela","🇻🇪"],["Vietnam","🇻🇳"],
  ["Yemen","🇾🇪"],["Zambia","🇿🇲"],["Zimbabwe","🇿🇼"],
];

// ─── Player Card Helpers ──────────────────────────────────────────────────────
function calcOverall(form) {
  const vals = ATTRS.map(a => Number(form[`attr_${a}`] || 10));
  return Math.round(vals.reduce((s,v) => s+v, 0) / vals.length);
}
function calcClass(overall) {
  return PLAYER_CLASSES.find(c => overall >= c.min && overall <= c.max) || PLAYER_CLASSES[0];
}
function getTopStats(form) {
  return ATTRS
    .map(a => ({ key: ATTR_META[a].label, val: Number(form[`attr_${a}`] || 10), color: ATTR_META[a].color }))
    .sort((a,b) => b.val - a.val).slice(0,2);
}
function pointsUsed(form) {
  return ATTRS.reduce((s,a) => s + Number(form[`attr_${a}`] || 10), 0);
}
function isNonPlayer(role) {
  return role === "referee" || role === "fan";
}

const APP_TABS = [
  { id:"builder",   label:"⚽  Builder" },
  { id:"community", label:"🏟️  Community" },
  { id:"profile",   label:"👤  Profile" },
  { id:"about",     label:"🌍  About" },
];

// ─── LocalStorage roster key ──────────────────────────────────────────────────
const LS_ROSTER_KEY   = "fcroster_v1";
const LS_SESSION_KEY  = "fcroster_sess_v1"; // persisted auth token

function saveRosterLocal(data) {
  try { localStorage.setItem(LS_ROSTER_KEY, JSON.stringify(data)); } catch {}
}
function loadRosterLocal() {
  try { const s = localStorage.getItem(LS_ROSTER_KEY); return s ? JSON.parse(s) : null; } catch { return null; }
}

// ─── Community constants (module-scope to avoid recreation) ──────────────────
const COMMUNITY_TAGS      = ["all","11v11","9v9","7v7","5v5","General"];
const COMMUNITY_TAG_COLORS = { "11v11":"#2d7a3a","9v9":"#6366f1","7v7":"#f5c518","5v5":"#ef4444","General":"#64748b" };

// Team role constants
const ROLE_CAPTAIN   = "captain";
const ROLE_ASSISTANT = "assistant_captain";
const ROLE_PLAYER    = "player";
const ROLE_BADGE     = { [ROLE_CAPTAIN]:"🎖️", [ROLE_ASSISTANT]:"⭐", [ROLE_PLAYER]:"" };
const ROLE_LABEL     = { [ROLE_CAPTAIN]:"Captain", [ROLE_ASSISTANT]:"Asst. Captain", [ROLE_PLAYER]:"Player" };

// All valid player positions (hoisted so RosterPanel altPositions picker never re-creates this)
const ALL_POSITIONS = ["GK","CB","LB","RB","LWB","RWB","DM","CM","LM","RM","CAM","AM","LW","RW","SS","ST"];



// Static — derived once at module load, never needs to re-run
const FORMATION_POSTS = BLOG_POSTS.map(p => ({
  ...p, source:"formation", commentCount:0, lastActivity:"Formation guide", created_at:"2025-01-01",
}));

export {
  POINT_POOL, ATTR_MIN, ATTR_MAX, ATTRS, ATTR_META,
  PLAYER_CLASSES, ROLE_DESIGNATIONS, ROLES_IN_SPORT,
  VIBE_CARDS, COUNTRIES,
  COMMUNITY_TAGS, COMMUNITY_TAG_COLORS,
  ALL_POSITIONS,
};
