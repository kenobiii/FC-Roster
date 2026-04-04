import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { BRAND, FORMAT_DEFAULTS, JERSEY_PRESETS, PITCH_PRESETS,
         LS_ROSTER_KEY, LS_SESSION_KEY } from "./tokens.js";
import { sb, SUPABASE_URL, SUPABASE_ANON } from "./supabase.js";
import { contrastColor, track, saveRosterLocal, loadRosterLocal } from "./helpers.js";
import { FORMATIONS } from "./data.js";
import { injectHead } from "./head.js";
import BuilderLayout, { NetworkSphere, ColorSwatch } from "./components/Builder.jsx";
import CommunityTab from "./components/Community.jsx";
import { ProfileTab, ProfilePanel, PlayerSetupModal } from "./components/Profile.jsx";
import { AuthModal, AboutTab } from "./components/Shared.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";

// ── Inject SEO / GA4 once ─────────────────────────────────────────────────────
injectHead({ ga4Id: "" });

// ── Tab definitions (no Profile tab — profile is a floating panel) ─────────────
const TABS = [
  { id:"builder",   label:"⚽  Builder"   },
  { id:"community", label:"🏟️  Community" },
  { id:"about",     label:"🌍  About"     },
];

// ── Roster helpers ────────────────────────────────────────────────────────────
function initPlayers(fmt, form) {
  return FORMATIONS[fmt][form].map(p => ({ ...p, name: "" }));
}
function initSubs(count) {
  return Array.from({ length: count }, () => "");
}

// ── Main App ──────────────────────────────────────────────────────────────────
function App() {
  // ── Tab ────────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState("builder");

  // ── Auth / profile ─────────────────────────────────────────────────────────
  const [session,      setSession]      = useState(null);
  const [profile,      setProfile]      = useState(null);
  const [profileReady, setProfileReady] = useState(false);
  const [showAuth,      setShowAuth]      = useState(false);
  const [showWizard,    setShowWizard]    = useState(false);
  const [showProfile,   setShowProfile]   = useState(false); // floating slide-in panel
  const [showEditProfile, setShowEditProfile] = useState(false); // edit wizard

  // ── Team ───────────────────────────────────────────────────────────────────
  const [team,        setTeam]        = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);

  // ── Builder state ──────────────────────────────────────────────────────────
  const [format,      setFormat]      = useState(11);
  const [formation,   setFormation]   = useState("4-4-2");
  const [pitchColor,  setPitchColor]  = useState("#3d8b40");
  const [jerseyColor, setJerseyColor] = useState("#111111");
  const [teamName,    setTeamName]    = useState("My Team FC");
  const [players,     setPlayers]     = useState(() => initPlayers(11, "4-4-2"));
  const [subs,        setSubs]        = useState(() => initSubs(FORMATIONS[11]["4-4-2"].length));

  // ── Drag ───────────────────────────────────────────────────────────────────
  const [dragging,      setDragging]      = useState(null);
  const [moveMode,      setMoveMode]      = useState(false);
  const moveModeRef     = useRef(false);
  const dragOffset      = useRef({ x: 0, y: 0 });
  const dragLivePos     = useRef(null);
  const rafId           = useRef(null);
  const positionHistory = useRef([]);
  const [historyLen,    setHistoryLen]    = useState(0);
  useEffect(() => { moveModeRef.current = moveMode; }, [moveMode]);

  // ── Draw ───────────────────────────────────────────────────────────────────
  const [drawMode,   setDrawMode]   = useState(null);
  const [strokes,    setStrokes]    = useState([]);
  const [balls,      setBalls]      = useState([]);
  const [drawing,    setDrawing]    = useState(false);
  const [currentPts, setCurrentPts] = useState([]);
  const [history,    setHistory]    = useState([]);
  const drawRef          = useRef(null);
  const drawingRef       = useRef(false);
  const drawModeRef      = useRef(null);
  const currentPtsRef    = useRef([]);
  const drawRafRef       = useRef(null);
  useEffect(() => { drawModeRef.current = drawMode; }, [drawMode]);

  // ── Opposition ─────────────────────────────────────────────────────────────
  const [showOpposition, setShowOpposition] = useState(false);
  const [oppFormation,   setOppFormation]   = useState("4-4-2");
  const [oppPlayers,     setOppPlayers]     = useState(() => FORMATIONS[11]["4-4-2"].map(p => ({ ...p })));

  // ── Export ─────────────────────────────────────────────────────────────────
  const [exporting, setExporting] = useState(false);
  const pitchRef  = useRef(null);
  const exportRef = useRef(null);

  // ── Restore session on load ────────────────────────────────────────────────
  useEffect(() => {
    // Clear any OAuth error params from URL silently
    if (window.location.search.includes("error")) {
      window.history.replaceState(null, "", window.location.pathname);
    }

    // Check URL hash for OAuth token
    const hash   = window.location.hash;
    const params = new URLSearchParams(hash.slice(1));
    const token  = params.get("access_token");

    if (token) {
      window.history.replaceState(null, "", window.location.pathname);
      fetch(`${SUPABASE_URL}/auth/v1/user`, {
        headers: {
          "apikey":        SUPABASE_ANON,
          "Authorization": `Bearer ${token}`,
        },
      })
        .then(r => r.json())
        .then(u => {
          if (u?.id) {
            const sess = { token, user: u, email: u.email };
            setSession(sess);
            try { localStorage.setItem(LS_SESSION_KEY, JSON.stringify(sess)); } catch {}
            fetchProfile(sess);
          } else { setProfileReady(true); }
        })
        .catch(() => setProfileReady(true));
      return;
    }

    // Try stored session
    try {
      const stored = localStorage.getItem(LS_SESSION_KEY);
      if (stored) {
        const sess = JSON.parse(stored);
        setSession(sess);
        fetchProfile(sess);
        return;
      }
    } catch {}
    setProfileReady(true);
  }, []);

  // ── Restore roster from localStorage ──────────────────────────────────────
  useEffect(() => {
    const saved = loadRosterLocal();
    if (saved) {
      if (saved.teamName)    setTeamName(saved.teamName);
      if (saved.pitchColor)  setPitchColor(saved.pitchColor);
      if (saved.jerseyColor) setJerseyColor(saved.jerseyColor);
      // Only restore format/formation/players if they look valid
      if (saved.format && saved.formation && saved.players?.length > 0) {
        setFormat(saved.format);
        setFormation(saved.formation);
        setPlayers(saved.players);
        if (saved.subs?.length > 0) setSubs(saved.subs);
      }
    }
  }, []);

  // ── Auto-save roster ───────────────────────────────────────────────────────
  useEffect(() => {
    saveRosterLocal({ teamName, format, formation, pitchColor, jerseyColor, players, subs });
  }, [teamName, format, formation, pitchColor, jerseyColor, players, subs]);

  // ── Fetch profile + team from Supabase ────────────────────────────────────
  async function fetchProfile(sess) {
    try {
      const rows = await sb.select("profiles", `?id=eq.${sess.user.id}&select=*`);
      const prof = Array.isArray(rows) ? rows[0] : null;
      setProfile(prof || null);
      if (!prof || !prof.setup_complete) {
        setShowWizard(true);
      } else {
        // Fetch team if profile has team_id
        if (prof.team_id) fetchTeam(prof.team_id, sess);
      }
    } catch {
      setProfile(null);
    } finally {
      setProfileReady(true);
    }
  }

  async function fetchTeam(teamId, sess) {
    try {
      const teams = await sb.select("teams", `?id=eq.${teamId}&select=*`);
      const t = Array.isArray(teams) ? teams[0] : null;
      setTeam(t || null);
      if (t) {
        const members = await sb.select(
          "team_members",
          `?team_id=eq.${t.id}&select=*,profiles(display_name,avatar_emoji)`
        );
        setTeamMembers(Array.isArray(members) ? members : []);
      }
    } catch {}
  }

  // ── Auth handlers ──────────────────────────────────────────────────────────
  function handleAuth(sess) {
    setSession(sess);
    try { localStorage.setItem(LS_SESSION_KEY, JSON.stringify(sess)); } catch {}
    fetchProfile(sess);
    setShowAuth(false);
  }

  async function handleSignOut() {
    if (session) {
      await sb.signOut(session.token).catch(() => {});
      try { localStorage.removeItem(LS_SESSION_KEY); } catch {}
    }
    setSession(null);
    setProfile(null);
    setProfileReady(true);
    setTeam(null);
    setTeamMembers([]);
    setShowProfile(false);
    setShowWizard(false);
  }

  function handleWizardComplete(prof) {
    setProfile(prof);
    setShowWizard(false);
    if (prof.team_name) setTeamName(prof.team_name);
    track("profile_setup_complete");
  }

  // ── Builder handlers ───────────────────────────────────────────────────────
  function handleFormat(f) {
    const def = FORMAT_DEFAULTS[f];
    setFormat(f); setFormation(def);
    setPlayers(initPlayers(f, def));
    setSubs(initSubs(FORMATIONS[f][def].length));
    setOppFormation(FORMAT_DEFAULTS[f]);
    setOppPlayers(FORMATIONS[f][FORMAT_DEFAULTS[f]].map(p => ({ ...p })));
  }

  function handleFormation(f) {
    setFormation(f);
    const tpl = FORMATIONS[format][f];
    setPlayers(tpl.map((t, i) => ({ ...t, name: players[i]?.name || "" })));
    setSubs(prev => tpl.map((_, i) => prev[i] ?? ""));
  }

  function handleOppFormation(f) {
    setOppFormation(f);
    setOppPlayers(FORMATIONS[format][f].map(p => ({ ...p })));
  }

  // ── Drag handlers ──────────────────────────────────────────────────────────
  function undoPosition() {
    if (!positionHistory.current.length) return;
    const snapshot = positionHistory.current.pop();
    setHistoryLen(positionHistory.current.length);
    setPlayers(snapshot);
  }

  function resetFormation() {
    positionHistory.current = [];
    setHistoryLen(0);
    setPlayers(FORMATIONS[format][formation].map(p => ({
      ...p, name: players.find(q => q.id === p.id)?.name || ""
    })));
  }

  function handleCirclePointerDown(e, id) {
    if (!moveModeRef.current) return;
    e.preventDefault(); e.stopPropagation();
    const rect = pitchRef.current?.getBoundingClientRect();
    if (!rect) return;
    const player = players.find(p => p.id === id);
    if (!player) return;
    positionHistory.current = [...positionHistory.current.slice(-19), players.map(p => ({ ...p }))];
    setHistoryLen(positionHistory.current.length);
    const px = ((e.clientX - rect.left) / rect.width)  * 100;
    const py = ((e.clientY - rect.top)  / rect.height) * 100;
    dragOffset.current  = { x: px - player.x, y: py - player.y };
    dragLivePos.current = { x: player.x, y: player.y };
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
    setDragging(id);
  }

  function handleCirclePointerMove(e, id) {
    if (!dragging || dragging !== id || !pitchRef.current) return;
    e.preventDefault();
    const rect = pitchRef.current.getBoundingClientRect();
    const x = Math.max(4, Math.min(96, (e.clientX - rect.left) / rect.width  * 100 - dragOffset.current.x));
    const y = Math.max(4, Math.min(96, (e.clientY - rect.top)  / rect.height * 100 - dragOffset.current.y));
    dragLivePos.current = { x, y };
    if (!rafId.current) {
      rafId.current = requestAnimationFrame(() => {
        rafId.current = null;
        const live = dragLivePos.current;
        if (live) setPlayers(prev => prev.map(p => p.id === id ? { ...p, x: live.x, y: live.y } : p));
      });
    }
  }

  function handleCirclePointerUp(e, id) {
    if (dragging !== id) return;
    if (rafId.current) { cancelAnimationFrame(rafId.current); rafId.current = null; }
    if (pitchRef.current) {
      const rect = pitchRef.current.getBoundingClientRect();
      const x = Math.max(4, Math.min(96, (e.clientX - rect.left) / rect.width  * 100 - dragOffset.current.x));
      const y = Math.max(4, Math.min(96, (e.clientY - rect.top)  / rect.height * 100 - dragOffset.current.y));
      setPlayers(prev => prev.map(p => p.id === id ? { ...p, x, y } : p));
    }
    setDragging(null);
  }

  // ── Draw handlers ──────────────────────────────────────────────────────────
  function getPitchPoint(e) {
    const el = drawRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: ((clientX - rect.left) / rect.width)  * 100,
      y: ((clientY - rect.top)  / rect.height) * 100,
    };
  }

  function onDrawStart(e) {
    const mode = drawModeRef.current;
    if (!mode) return;
    if (e.touches) e.preventDefault();
    const pt = getPitchPoint(e);
    if (!pt) return;
    if (mode === "ball") {
      setBalls([pt]);
      setHistory(h => [...h, { type: "ball" }]);
      setDrawMode(null);
      return;
    }
    drawingRef.current = true;
    currentPtsRef.current = [pt];
    setDrawing(true);
    setCurrentPts([pt]);
  }

  function onDrawMove(e) {
    if (!drawingRef.current) return;
    if (e.touches) e.preventDefault();
    const pt = getPitchPoint(e);
    if (!pt) return;
    const prev = currentPtsRef.current;
    if (prev.length > 0) {
      const last = prev[prev.length - 1];
      if ((pt.x - last.x) ** 2 + (pt.y - last.y) ** 2 < 0.25) return;
    }
    currentPtsRef.current = [...prev, pt];
    if (!drawRafRef.current) {
      drawRafRef.current = requestAnimationFrame(() => {
        drawRafRef.current = null;
        setCurrentPts([...currentPtsRef.current]);
      });
    }
  }

  function onDrawEnd(e) {
    if (!drawingRef.current) return;
    if (e.touches) e.preventDefault();
    if (drawRafRef.current) { cancelAnimationFrame(drawRafRef.current); drawRafRef.current = null; }
    drawingRef.current = false;
    setDrawing(false);
    const pts = currentPtsRef.current;
    currentPtsRef.current = [];
    setCurrentPts([]);
    if (pts.length > 1) {
      const simplified = simplifyPts(pts, 0.35);
      setStrokes(s => [...s, { pts: simplified, type: drawModeRef.current }]);
      setHistory(h => [...h, { type: "stroke" }]);
    }
  }

  function ptsToSmoothPath(pts) {
    if (pts.length < 2) return "";
    if (pts.length === 2) return `M${pts[0].x},${pts[0].y} L${pts[1].x},${pts[1].y}`;
    const t = 0.5;
    let d = `M${pts[0].x},${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[Math.min(pts.length - 1, i + 2)];
      const cp1x = p1.x + (p2.x - p0.x) * t / 3;
      const cp1y = p1.y + (p2.y - p0.y) * t / 3;
      const cp2x = p2.x - (p3.x - p1.x) * t / 3;
      const cp2y = p2.y - (p3.y - p1.y) * t / 3;
      d += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
    }
    return d;
  }

  function simplifyPts(pts, tolerance = 0.4) {
    if (pts.length <= 2) return pts;
    function perpendicularDist(pt, start, end) {
      const dx = end.x - start.x, dy = end.y - start.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len === 0) return Math.sqrt((pt.x - start.x) ** 2 + (pt.y - start.y) ** 2);
      return Math.abs((dy * pt.x - dx * pt.y + end.x * start.y - end.y * start.x) / len);
    }
    function rdp(points, eps) {
      let maxDist = 0, maxIdx = 0;
      for (let i = 1; i < points.length - 1; i++) {
        const d = perpendicularDist(points[i], points[0], points[points.length - 1]);
        if (d > maxDist) { maxDist = d; maxIdx = i; }
      }
      if (maxDist > eps) {
        return [...rdp(points.slice(0, maxIdx + 1), eps).slice(0, -1), ...rdp(points.slice(maxIdx), eps)];
      }
      return [points[0], points[points.length - 1]];
    }
    return rdp(pts, tolerance);
  }

  function getArrowHead(pts) {
    if (pts.length < 2) return null;
    const tip  = pts[pts.length - 1];
    const base = pts[pts.length - 2];
    const dx = tip.x - base.x, dy = tip.y - base.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 0.01) return null;
    const ux = dx / dist, uy = dy / dist;
    const armLen = 3.5, angle = Math.PI / 5;
    const cos = Math.cos(angle), sin = Math.sin(angle);
    return {
      top:    { x1: tip.x + armLen * (-ux * cos - (-uy) * sin), y1: tip.y + armLen * (-uy * cos + (-ux) * sin), x2: tip.x, y2: tip.y },
      bottom: { x1: tip.x + armLen * (-ux * cos + (-uy) * sin), y1: tip.y + armLen * (-uy * cos - (-ux) * sin), x2: tip.x, y2: tip.y },
    };
  }

  function undoLast() {
    setHistory(prev => {
      if (!prev.length) return prev;
      const last = prev[prev.length - 1];
      if (last.type === "stroke") setStrokes(s => s.slice(0, -1));
      if (last.type === "ball")   setBalls(b => b.slice(0, -1));
      return prev.slice(0, -1);
    });
  }

  function clearStrokes() { setStrokes([]); setBalls([]); setCurrentPts([]); setHistory([]); }

  // ── Export handler ─────────────────────────────────────────────────────────
  async function handleExport() {
    setExporting(true);
    try {
      const SCALE = 2, W = 400 * SCALE, PADDING = 40 * SCALE;
      const HEADER = 120 * SCALE, FOOTER = 64 * SCALE;
      const PW = W - PADDING * 2, PH = Math.round(PW * 1.5);
      const H  = HEADER + PH + FOOTER;
      const canvas = document.createElement("canvas");
      canvas.width = W; canvas.height = H;
      const ctx = canvas.getContext("2d");

      function rRect(x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
        ctx.arcTo(x + w, y, x + w, y + r, r); ctx.lineTo(x + w, y + h - r);
        ctx.arcTo(x + w, y + h, x + w - r, y + h, r); ctx.lineTo(x + r, y + h);
        ctx.arcTo(x, y + h, x, y + h - r, r); ctx.lineTo(x, y + r);
        ctx.arcTo(x, y, x + r, y, r); ctx.closePath();
      }

      ctx.fillStyle = "#030712"; ctx.fillRect(0, 0, W, H);
      const midX = W / 2;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillStyle = "#ffffff"; ctx.font = `900 ${34 * SCALE}px Impact,sans-serif`;
      ctx.fillText((teamName || "MY TEAM FC").toUpperCase(), midX, 26 * SCALE);
      ctx.fillStyle = "#f5c518"; ctx.font = `900 ${26 * SCALE}px Impact,sans-serif`;
      ctx.fillText(`${format}V${format}`, midX, 60 * SCALE);
      ctx.fillStyle = "#ffffff"; ctx.font = `900 ${18 * SCALE}px Impact,sans-serif`;
      ctx.fillText(formation, midX, 90 * SCALE);

      const PX = PADDING, PY = HEADER;
      const grad = ctx.createRadialGradient(PX + PW / 2, PY + PH * 0.35, 0, PX + PW / 2, PY + PH * 0.35, PH * 0.8);
      grad.addColorStop(0, pitchColor + "f2"); grad.addColorStop(0.65, pitchColor + "bb"); grad.addColorStop(1, "#122018");
      rRect(PX, PY, PW, PH, 14 * SCALE); ctx.fillStyle = grad; ctx.fill();

      ctx.save(); rRect(PX, PY, PW, PH, 14 * SCALE); ctx.clip();
      ctx.strokeStyle = "rgba(255,255,255,0.42)"; ctx.lineWidth = 1.5 * SCALE;
      const toPx = x => PX + (x / 100) * PW;
      const toPy = y => PY + (y / 100) * PH;
      rRect(PX + (3/100)*PW, PY + (2/100)*PH, PW - (6/100)*PW, PH - (4/100)*PH, 6 * SCALE); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(toPx(3), toPy(50)); ctx.lineTo(toPx(97), toPy(50)); ctx.stroke();
      ctx.beginPath(); ctx.arc(toPx(50), toPy(50), PH * 0.09, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeRect(toPx(23), toPy(2),  (54/100)*PW, (14/100)*PH);
      ctx.strokeRect(toPx(35), toPy(2),  (30/100)*PW, (6/100)*PH);
      ctx.strokeRect(toPx(23), toPy(84), (54/100)*PW, (14/100)*PH);
      ctx.strokeRect(toPx(35), toPy(92), (30/100)*PW, (6/100)*PH);
      ctx.restore();

      players.forEach((p, i) => {
        const cx2 = toPx(p.x), cy2 = toPy(p.y), R = 17 * SCALE;
        ctx.beginPath(); ctx.arc(cx2, cy2, R, 0, Math.PI * 2);
        ctx.fillStyle = jerseyColor; ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.65)"; ctx.lineWidth = 1.5 * SCALE; ctx.stroke();
        const fg2   = contrastColor(jerseyColor);
        const posFs = p.pos.length >= 3 ? 9 : p.pos.length === 2 ? 13 : 16;
        ctx.fillStyle = fg2; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.font = `900 ${posFs * SCALE}px Impact,sans-serif`;
        ctx.fillText(p.pos, cx2, cy2);
        ctx.fillStyle = "rgba(255,255,255,0.92)";
        ctx.font = `700 ${8 * SCALE}px Arial,sans-serif`;
        ctx.textBaseline = "top";
        ctx.fillText((p.name || "Starter").toUpperCase(), cx2, cy2 + R + 3 * SCALE);
        ctx.fillStyle = "rgba(245,197,24,0.9)";
        ctx.font = `italic 600 ${7 * SCALE}px Arial,sans-serif`;
        ctx.fillText((subs[i] || "+ Sub").toUpperCase(), cx2, cy2 + R + 14 * SCALE);
      });

      ctx.fillStyle = "#a855f7"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.font = `900 ${10 * SCALE}px Impact,sans-serif`;
      ctx.fillText("FCROSTER.COM", midX, PY + PH + FOOTER / 2);

      const link = document.createElement("a");
      link.download = `${(teamName || "FCRoster").replace(/\s+/g, "_")}_${formation}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      console.error("Export error:", err);
      alert("Export failed — try a screenshot instead.");
    } finally {
      setExporting(false);
    }
  }

  // ── Derived ────────────────────────────────────────────────────────────────
  const pitchBg  = `radial-gradient(ellipse at 50% 35%, ${pitchColor}f2, ${pitchColor}bb 65%, #122018)`;
  const accentFg = contrastColor(jerseyColor);
  const availForms = useMemo(() => Object.keys(FORMATIONS[format]), [format]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col" style={{ minHeight:"100dvh", width:"100%", background:BRAND.colors.navy,
      color:BRAND.colors.white, fontFamily:BRAND.fonts.body,
      WebkitFontSmoothing:"antialiased", MozOsxFontSmoothing:"grayscale" }}>

      {/* ── Modals ── */}
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onAuth={handleAuth}/>}

      {showWizard && session && profileReady && (
        <PlayerSetupModal
          session={session} profile={profile} mode="onboarding"
          onClose={() => setShowWizard(false)}
          onComplete={handleWizardComplete}/>
      )}

      {showEditProfile && session && (
        <PlayerSetupModal
          session={session} profile={profile} mode="edit"
          onClose={() => setShowEditProfile(false)}
          onComplete={prof => {
            setProfile(prev => ({ ...prev, ...prof }));
            setShowEditProfile(false);
          }}/>
      )}

      {/* ── Header ── */}
      <header style={{ background:"#fdfef8", borderBottom:"1px solid rgba(0,0,0,0.08)" }}>
        {/* Logo row */}
        <button style={{ display:"flex", alignItems:"center", gap:16, padding:"16px 16px 12px 16px", width:"100%", textAlign:"left", background:"none", border:"none", cursor:"pointer" }}
          onClick={() => setActiveTab("builder")} title="Go to Builder">
          <NetworkSphere size={56}/>
          <div className="flex flex-col justify-center">
            <div className="font-black leading-none tracking-tight"
              style={{ fontFamily:BRAND.fonts.display, fontSize:32, color:"#111827", letterSpacing:1 }}>
              FCROSTER.COM
            </div>
            <div className="text-[10px] tracking-widest mt-1" style={{ color:"#4a5568", fontFamily:BRAND.fonts.body }}>
              CONNECT · ORGANIZE · COMPETE
            </div>
          </div>
          {/* Auth / profile button top-right */}
          <div className="ml-auto shrink-0">
            {session ? (
              <button onClick={e => { e.stopPropagation(); setShowProfile(v => !v); }}
                style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 14px",
                  borderRadius:12, border:"none", cursor:"pointer",
                  background:BRAND.colors.green, color:"#fff",
                  fontFamily:BRAND.fonts.body, fontSize:13, fontWeight:700,
                  boxShadow:`0 2px 12px ${BRAND.colors.green}55` }}>
                <span style={{ fontSize:18 }}>{profile?.avatar_emoji || "⚽"}</span>
                <span style={{ maxWidth:100, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                  {profile?.display_name || session?.email?.split("@")[0]}
                </span>
              </button>
            ) : (
              <button onClick={e => { e.stopPropagation(); setShowAuth(true); }}
                style={{ padding:"8px 18px", borderRadius:12, border:"none", cursor:"pointer",
                  background:BRAND.colors.yellow, color:"#111", fontFamily:BRAND.fonts.display,
                  fontSize:14, fontWeight:900, letterSpacing:1.5, whiteSpace:"nowrap",
                  boxShadow:`0 2px 12px ${BRAND.colors.yellow}55` }}>
                SIGN IN
              </button>
            )}
          </div>
        </button>

        {/* Tab row */}
        <div style={{ display:"flex", gap:6, padding:"8px 16px 12px 16px", overflowX:"auto", borderTop:"1px solid rgba(0,0,0,0.08)", background:"#e8eaed" }}>
          {TABS.map(({ id, label }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              style={{ padding:"6px 16px", borderRadius:10, border:"none", cursor:"pointer",
                fontFamily:BRAND.fonts.body, fontSize:12, fontWeight:700, whiteSpace:"nowrap",
                ...(activeTab === id
                  ? { background:BRAND.colors.green, color:"#fff", boxShadow:`0 2px 8px ${BRAND.colors.green}55` }
                  : { background:"#fff", color:"#374151", border:"1px solid rgba(0,0,0,0.18)", boxShadow:"0 1px 3px rgba(0,0,0,0.08)" })
              }}>
              {label}
            </button>
          ))}
        </div>

        {/* Builder controls */}
        {activeTab === "builder" && (
          <>
            <div style={{ display:"flex", alignItems:"flex-end", gap:12, padding:"10px 16px", flexWrap:"wrap", borderTop:"1px solid rgba(0,0,0,0.12)", background:"#d4d6da" }}>
              <div style={{ display:"flex", flexDirection:"column", gap:2, flex:1, minWidth:110, maxWidth:200 }}>
                <span className="text-[9px] font-bold tracking-widest uppercase" style={{ color:"#4b5563", letterSpacing:1.5 }}>Team Name</span>
                <input className="rounded-md px-2 py-1 text-xs placeholder-gray-500 focus:outline-none w-full"
                  style={{ background:"#bfc1c6", border:"1px solid #a8aab0", color:"#111827" }}
                  placeholder="Team name…" value={teamName}
                  onChange={e => setTeamName(e.target.value)}/>
              </div>
              <ColorSwatch label="Jersey" value={jerseyColor} onChange={setJerseyColor} presets={JERSEY_PRESETS}/>
              <ColorSwatch label="Pitch"  value={pitchColor}  onChange={setPitchColor}  presets={PITCH_PRESETS}/>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:12, padding:"8px 16px", borderTop:"1px solid rgba(0,0,0,0.1)", background:"#caccd1" }}>
              <span className="text-[9px] font-bold tracking-widest uppercase shrink-0" style={{ color:"#4b5563", letterSpacing:1.5 }}>Format</span>
              <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                {[5,7,9,11].map(f => (
                  <button key={f} onClick={() => handleFormat(f)}
                    style={{ padding:"4px 10px", borderRadius:8, border:"none", cursor:"pointer",
                      fontFamily:BRAND.fonts.body, fontSize:12, fontWeight:700,
                      ...(format===f ? { background:BRAND.colors.green, color:"#fff" } : { background:"rgba(0,0,0,0.12)", color:"#374151" }) }}>
                    {f}v{f}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 16px 10px 16px", flexWrap:"wrap", borderTop:"1px solid rgba(0,0,0,0.1)", background:"#c0c2c8" }}>
              <span className="text-[9px] font-bold tracking-widest uppercase shrink-0" style={{ color:"#4b5563", letterSpacing:1.5 }}>Formation</span>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                {availForms.map(f => (
                  <button key={f} onClick={() => handleFormation(f)}
                    style={{ padding:"5px 12px", borderRadius:10, border:"none", cursor:"pointer",
                      fontFamily:BRAND.fonts.body, fontSize:12, fontWeight:700,
                      ...(formation===f
                        ? { background:BRAND.colors.green, color:"#fff", boxShadow:`0 1px 6px ${BRAND.colors.green}44` }
                        : { background:"rgba(0,0,0,0.08)", color:"#374151", border:"1px solid rgba(0,0,0,0.15)" }) }}>
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </header>

      {/* ── Floating profile panel (slide-in from right) ── */}
      {showProfile && session && (
        <ProfilePanel
          session={session}
          profile={profile}
          team={team}
          teamMembers={teamMembers}
          onClose={() => setShowProfile(false)}
          onSignOut={handleSignOut}
          onGoProfile={() => { setShowProfile(false); setShowEditProfile(true); }}/>
      )}

      {/* ── Content ── */}
      <main className="flex-1 flex flex-col">
        {activeTab === "builder" && (
          <BuilderLayout
            exportRef={exportRef} pitchRef={pitchRef} drawRef={drawRef}
            teamName={teamName} format={format} formation={formation}
            jerseyColor={jerseyColor} accentFg={accentFg} pitchBg={pitchBg}
            players={players} setPlayers={setPlayers}
            subs={subs} setSubs={setSubs}
            drawMode={drawMode} drawing={drawing} currentPts={currentPts}
            strokes={strokes} balls={balls}
            showOpposition={showOpposition} oppPlayers={oppPlayers}
            onCirclePointerDown={handleCirclePointerDown}
            onCirclePointerMove={handleCirclePointerMove}
            onCirclePointerUp={handleCirclePointerUp}
            dragging={dragging}
            moveMode={moveMode} setMoveMode={setMoveMode}
            undoPosition={undoPosition} positionHistoryLen={historyLen}
            resetFormation={resetFormation}
            onDrawStart={onDrawStart} onDrawMove={onDrawMove} onDrawEnd={onDrawEnd}
            ptsToSmoothPath={ptsToSmoothPath} getArrowHead={getArrowHead}
            setDrawMode={setDrawMode}
            undoLast={undoLast} clearStrokes={clearStrokes}
            oppFormation={oppFormation} handleOppFormation={handleOppFormation}
            setShowOpposition={setShowOpposition}
            exporting={exporting} handleExport={handleExport}/>
        )}

        <div style={{ display: activeTab === "community" ? "block" : "none" }}>
          <CommunityTab session={session} profile={profile}/>
        </div>

        {activeTab === "about" && <AboutTab/>}
      </main>

      {/* ── Footer ── */}
      <footer className="shrink-0 text-center py-3 text-[10px]"
        style={{ color:BRAND.colors.muted, borderTop:`1px solid ${BRAND.colors.border}`, fontFamily:BRAND.fonts.body }}>
        © 2025 FCRoster.com · Connect. Organize. Compete.
      </footer>
    </div>
  );
}

export default function FCRosterApp() {
  return <ErrorBoundary><App/></ErrorBoundary>;
}
