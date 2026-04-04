// ─── FCRoster App — main component (state + routing only) ────────────────────
import React, { useState, useRef, useEffect, useMemo,
                useCallback, memo, lazy, Suspense } from "react";
import "./head.js";

// ── Tokens & constants ───────────────────────────────────────────────────────
import { GLASS, BRAND, CLS_HDR, CLS_BADGE, CLS_CARD, CLS_ROW,
         APP_TABS, LOGO_SRC, FAVICON_SRC,
         JERSEY_PRESETS, PITCH_PRESETS, FORMAT_DEFAULTS,
         LS_SESSION_KEY, FORMATION_KEYS,
         ROLE_CAPTAIN, ROLE_ASSISTANT, ROLE_PLAYER,
         ROLE_BADGE, ROLE_LABEL }                        from "./tokens.js";

// ── Services ─────────────────────────────────────────────────────────────────
import { sb }                                            from "./supabase.js";
import { track, saveRosterLocal, loadRosterLocal,
         calcOverall, calcClass, getTopStats,
         pointsUsed, isNonPlayer, contrastColor }        from "./helpers.js";

// ── Shared always-loaded components ──────────────────────────────────────────
import ErrorBoundary                                     from "./components/ErrorBoundary.jsx";

// ── Lazy-loaded tab components (load on first visit) ─────────────────────────
const BuilderLayout = lazy(() => import("./components/Builder.jsx"));
const CommunityTab  = lazy(() => import("./components/Community.jsx"));
const AboutTab      = lazy(() =>
  import("./components/Shared.jsx").then(m => ({ default: m.AboutTab })));
// Note: ErrorBoundary imported directly above (tiny, always needed)

// ── Lazy-loaded profile + modals (pre-loaded on sign-in) ─────────────────────
const ProfileTab    = lazy(() =>
  import("./components/Profile.jsx").then(m => ({ default: m.ProfileTab })));
const ProfilePanel  = lazy(() =>
  import("./components/Profile.jsx").then(m => ({ default: m.ProfilePanel })));
const AuthModal     = lazy(() =>
  import("./components/Shared.jsx").then(m => ({ default: m.AuthModal })));
const PlayerSetupModal = lazy(() =>
  import("./components/Profile.jsx").then(m => ({ default: m.PlayerSetupModal })));
const CreateTeamModal  = lazy(() =>
  import("./components/Profile.jsx").then(m => ({ default: m.CreateTeamModal })));
const JoinTeamModal    = lazy(() =>
  import("./components/Profile.jsx").then(m => ({ default: m.JoinTeamModal })));
const ManageSquadModal = lazy(() =>
  import("./components/Profile.jsx").then(m => ({ default: m.ManageSquadModal })));

// ── Loading fallback ──────────────────────────────────────────────────────────
function TabLoader() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="text-xs font-bold tracking-widest animate-pulse"
        style={{ color: "#475569", letterSpacing: 3 }}>LOADING…</div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
function App() {
  const [activeTab,   setActiveTab]   = useState("builder");

  // ── Auth & profile state (global — shared across all tabs) ─────────────────
  // Restore persisted session on first load
  const [session, setSession] = useState(() => {
    try {
      const saved = localStorage.getItem(LS_SESSION_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [showAuth,        setShowAuth]        = useState(false);
  const [showProfile,     setShowProfile]     = useState(false);
  const [profile,         setProfile]         = useState(null);
  const [showOnboarding,  setShowOnboarding]  = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  // ── Team state ────────────────────────────────────────────────────────────
  const [team,            setTeam]            = useState(null);
  const [teamMembers,     setTeamMembers]     = useState([]);
  const [showCreateTeam,  setShowCreateTeam]  = useState(false);
  const [showJoinTeam,    setShowJoinTeam]    = useState(false);
  const [showManageSquad, setShowManageSquad] = useState(false);
  const rosterSyncRef  = useRef(null); // debounce timer for Supabase roster sync
  const lsSaveRef      = useRef(null); // debounce timer for localStorage saves
  const serverLoadRef  = useRef(false); // true while applying server roster — skip sync
  const [rosterLoading, setRosterLoading] = useState(false); // shows feedback while loading from server

  // ── Builder state — init from localStorage (single read, lazy) ──────────
  const [format,      setFormat]      = useState(() => loadRosterLocal()?.format      ?? 11);
  const [formation,   setFormation]   = useState(() => loadRosterLocal()?.formation   ?? "4-4-2");
  const [pitchColor,  setPitchColor]  = useState(() => loadRosterLocal()?.pitchColor  ?? "#3d8b40");
  const [jerseyColor, setJerseyColor] = useState(() => loadRosterLocal()?.jerseyColor ?? "#111111");
  const [teamName,    setTeamName]    = useState(() => loadRosterLocal()?.teamName    ?? "My Team FC");
  const [players,     setPlayers]     = useState(() => loadRosterLocal()?.players || []);
  const [subs,        setSubs]        = useState(() => loadRosterLocal()?.subs    || []);
  const [dragging,      setDragging]      = useState(null);
  const [moveMode,      setMoveMode]      = useState(false);
  const moveModeRef     = useRef(false);
  const dragOffset      = useRef({ x: 0, y: 0 });
  const dragLivePos     = useRef(null);
  const rafId           = useRef(null);
  const positionHistory = useRef([]);
  const [historyLen,    setHistoryLen]    = useState(0); // triggers re-render when history changes

  // ── Debounced localStorage save (100ms) — prevents blocking on rapid drags ─
  useEffect(() => {
    clearTimeout(lsSaveRef.current);
    lsSaveRef.current = setTimeout(() => {
      saveRosterLocal({ format, formation, pitchColor, jerseyColor, teamName, players, subs });
    }, 100);
    return () => clearTimeout(lsSaveRef.current);
  }, [format, formation, pitchColor, jerseyColor, teamName, players, subs]);

  // ── Debounced Supabase roster sync — skips during server-load to avoid cascade
  useEffect(() => {
    if (!session || serverLoadRef.current) return;
    clearTimeout(rosterSyncRef.current);
    rosterSyncRef.current = setTimeout(async () => {
      try {
        await sb.upsert("rosters", {
          user_id:     session.user.id,
          format, formation, pitch_color: pitchColor, jersey_color: jerseyColor,
          team_name:   teamName,
          players:     JSON.stringify(players),
          subs:        JSON.stringify(subs),
          updated_at:  new Date().toISOString(),
        }, session.token);
      } catch {} // silently fail — localStorage is the fallback
    }, 2000);
    return () => clearTimeout(rosterSyncRef.current);
  }, [session, format, formation, pitchColor, jerseyColor, teamName, players, subs]);

  // ── On login: load Supabase roster + profile ──────────────────────────────
  useEffect(() => {
    if (!session) return;
    (async () => {
      setRosterLoading(true);
      // Load profile
      const prof = await sb.getProfile(session.user.id, session.token).catch(() => null);
      if (prof) {
        // Always load profile into state so wizard can pre-fill if needed
        setProfile(prof);
        if (prof.team_name && teamName === "My Team FC") setTeamName(prof.team_name);
      }
      if (!prof?.setup_complete) {
        setShowOnboarding(true); // first sign-in or incomplete setup — wizard pre-fills from profile
      } else {
        // Load team if profile has one
        if (prof.team_id) {
          const t = await sb.getTeam(prof.team_id, session.token).catch(() => null);
          if (t) {
            setTeam(t);
            const members = await sb.getTeamMembers(t.id, session.token).catch(() => []);
            setTeamMembers(members);
          }
        }
      }
      // Pre-load Profile chunk now that user is signed in
      import("./components/Profile.jsx").catch(() => {});

      // Load post count
      const postCount = await sb.getPostCount(session.user.id, session.token).catch(() => 0);
      setProfile(prev => prev ? { ...prev, post_count: postCount } : null);

      // Load roster — flag serverLoadRef so the sync effect doesn't fire 8×
      const roster = await sb.getRoster(session.user.id, session.token).catch(() => null);
      if (roster) {
        serverLoadRef.current = true;
        setFormat(roster.format ?? 11);
        setFormation(roster.formation ?? "4-4-2");
        setPitchColor(roster.pitch_color ?? "#3d8b40");
        setJerseyColor(roster.jersey_color ?? "#111111");
        setTeamName(roster.team_name ?? "My Team FC");
        if (roster.players) {
          try { const p = JSON.parse(roster.players); if (p?.length) setPlayers(p); } catch {}
        }
        if (roster.subs) {
          try { const s = JSON.parse(roster.subs); if (s) setSubs(s); } catch {}
        }
        // Release guard after React has batched all the state updates
        setTimeout(() => { serverLoadRef.current = false; }, 50);
      }
      setRosterLoading(false);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  // ── GA4: track tab changes as virtual page views ─────────────────────────
  useEffect(() => {
    const tabTitles = { builder:"Builder", community:"Community", profile:"Profile", about:"About" };
    track("page_view", {
      page_title: `FCRoster.com — ${tabTitles[activeTab] || activeTab}`,
      page_location: window.location.href,
      page_path: `/${activeTab}`,
    });
  }, [activeTab]);

  // ── OAuth / Magic-link token in URL hash (handles Google + magic link) ──────
  useEffect(() => {
    if (typeof window === "undefined") return;
    const p = new URLSearchParams(window.location.hash.slice(1));
    const tok = p.get("access_token");
    const typ = p.get("type");
    // Google OAuth returns access_token with type "bearer" or no type
    // Magic link / email confirm returns type "signup","magiclink","recovery","invite"
    const isOAuth     = tok && (!typ || typ === "bearer");
    const isMagicLink = tok && ["invite","signup","magiclink","recovery"].includes(typ);
    if (isOAuth || isMagicLink) {
      fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { ...sb.headers, "Authorization": `Bearer ${tok}` } })
        .then(r => r.json())
        .then(u => {
          if (u?.id) {
            setSession({ token:tok, user:u, email:u.email });
            window.history.replaceState(null, "", window.location.pathname);
          }
        })
        .catch(() => {});
    }
  }, []);

  // Persist session changes to localStorage (save on login, clear on logout)
  useEffect(() => {
    try {
      if (session) {
        localStorage.setItem(LS_SESSION_KEY, JSON.stringify(session));
      } else {
        localStorage.removeItem(LS_SESSION_KEY);
      }
    } catch {}
  }, [session]);

  // On load: validate any restored token — clear it if Supabase says it's expired
  useEffect(() => {
    if (!session?.token) return;
    fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { ...sb.headers, "Authorization": `Bearer ${session.token}` }
    })
      .then(r => r.ok ? r.json() : null)
      .then(u => { if (!u?.id) setSession(null); })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally run once on mount only

  const onPlayerUpdate = useCallback((id, updates) => {
    setPlayers(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  }, []);

  async function handleSignOut() {
    if (session) await sb.signOut(session.token).catch(() => {});
    try { localStorage.removeItem(LS_SESSION_KEY); } catch {}
    setSession(null);
    setProfile(null);
    setTeam(null);
    setTeamMembers([]);
    setShowProfile(false);
    setShowOnboarding(false);
    setShowEditProfile(false);
  }

  useEffect(() => { moveModeRef.current = moveMode; }, [moveMode]);

  function undoPosition() {
    if (!positionHistory.current.length) return;
    const snapshot = positionHistory.current.pop();
    setHistoryLen(positionHistory.current.length);
    setPlayers(snapshot);
  }

  function resetFormation() {
    positionHistory.current = [];
    setHistoryLen(0);
    setPlayers([]);   // Builder useEffect re-initialises preserving names from serverLoadRef
  }

  // Called ONLY from the circle element's onPointerDown when moveMode is on
  function handleCirclePointerDown(e, id) {
    if (!moveModeRef.current) return;
    e.preventDefault();
    e.stopPropagation();

    const rect = pitchRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Read current player position synchronously from current players state
    const player = players.find(p => p.id === id);
    if (!player) return;

    // ── Save snapshot NOW, before any movement ──
    positionHistory.current = [...positionHistory.current.slice(-19), players.map(p => ({...p}))];
    setHistoryLen(positionHistory.current.length);

    // Compute drag offset: pointer position minus player centre (in % units)
    const px = ((e.clientX - rect.left) / rect.width)  * 100;
    const py = ((e.clientY - rect.top)  / rect.height) * 100;
    dragOffset.current = { x: px - player.x, y: py - player.y };
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
    // Throttle to one rAF per frame — coalesce rapid pointer events
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

    // Commit final drop using exact pointer position at release
    if (pitchRef.current) {
      const rect = pitchRef.current.getBoundingClientRect();
      const x = Math.max(4, Math.min(96, (e.clientX - rect.left) / rect.width  * 100 - dragOffset.current.x));
      const y = Math.max(4, Math.min(96, (e.clientY - rect.top)  / rect.height * 100 - dragOffset.current.y));
      setPlayers(prev => prev.map(p => p.id === id ? { ...p, x, y } : p));
    }
    setDragging(null);
  }

  const [exporting,   setExporting]   = useState(false);
  const pitchRef  = useRef(null);
  const exportRef = useRef(null);

  function handleFormat(f) {
    track("select_format", { format: f });
    const def = FORMAT_DEFAULTS[f];
    setFormat(f); setFormation(def);
    setPlayers([]);           // signals Builder useEffect to re-initialise
    setSubs([]);              // signals Builder useEffect to re-initialise
    setOppFormation(def);
    setOppPlayers([]);        // Builder handles opp re-init
  }
  function handleFormation(f) {
    track("select_formation", { formation: f, format });
    setFormation(f);
    setPlayers([]);  // Builder useEffect re-initialises preserving names
    setSubs([]);;
    setExporting(true);
    try {
      // ── Canvas dimensions ──────────────────────────────────────────────────
      const SCALE   = 2;
      const W       = 400 * SCALE;
      const PADDING = 40 * SCALE;
      const HEADER  = 120 * SCALE;
      const FOOTER  = 64 * SCALE;
      const PW      = W - PADDING * 2;
      const PH      = Math.round(PW * 1.5);   // 2:3 ratio
      const H       = HEADER + PH + FOOTER;

      const canvas  = document.createElement("canvas");
      canvas.width  = W;
      canvas.height = H;
      const ctx     = canvas.getContext("2d");

      // Rounded-rect helper (replaces ctx.roundRect for broad browser compat)
      function rRect(x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.arcTo(x + w, y, x + w, y + r, r);
        ctx.lineTo(x + w, y + h - r);
        ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
        ctx.lineTo(x + r, y + h);
        ctx.arcTo(x, y + h, x, y + h - r, r);
        ctx.lineTo(x, y + r);
        ctx.arcTo(x, y, x + r, y, r);
        ctx.closePath();
      }

      // ── Background ────────────────────────────────────────────────────────
      ctx.fillStyle = "#030712";
      ctx.fillRect(0, 0, W, H);

      // ── Header text ───────────────────────────────────────────────────────
      const midX = W / 2;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      ctx.fillStyle = "#ffffff";
      ctx.font = `900 ${34 * SCALE}px Impact, sans-serif`;
      ctx.fillText((teamName || "MY TEAM FC").toUpperCase(), midX, 26 * SCALE);

      ctx.fillStyle = "#f5c518";
      ctx.font = `900 ${26 * SCALE}px Impact, sans-serif`;
      ctx.fillText(`${format}V${format}`, midX, 60 * SCALE);

      ctx.fillStyle = "#ffffff";
      ctx.font = `900 ${18 * SCALE}px Impact, sans-serif`;
      ctx.fillText(formation, midX, 90 * SCALE);

      // ── Pitch background ──────────────────────────────────────────────────
      const PX = PADDING;
      const PY = HEADER;
      const grad = ctx.createRadialGradient(
        PX + PW / 2, PY + PH * 0.35, 0,
        PX + PW / 2, PY + PH * 0.35, PH * 0.8
      );
      grad.addColorStop(0,    pitchColor + "f2");
      grad.addColorStop(0.65, pitchColor + "bb");
      grad.addColorStop(1,    "#122018");

      rRect(PX, PY, PW, PH, 14 * SCALE);
      ctx.fillStyle = grad;
      ctx.fill();

      // ── Pitch lines ───────────────────────────────────────────────────────
      // Clip subsequent strokes to the pitch rounded rect so lines don't spill
      ctx.save();
      rRect(PX, PY, PW, PH, 14 * SCALE);
      ctx.clip();

      ctx.strokeStyle = "rgba(255,255,255,0.42)";
      ctx.lineWidth   = 1.5 * SCALE;

      // px/py: convert 0-100 x, 0-100 y player coords → canvas px
      const toPx = x => PX + (x / 100) * PW;
      const toPy = y => PY + (y / 100) * PH;

      // Border (inset 3%)
      rRect(PX + (3/100)*PW, PY + (2/100)*PH, PW - (6/100)*PW, PH - (4/100)*PH, 6 * SCALE);
      ctx.stroke();
      // Halfway line
      ctx.beginPath(); ctx.moveTo(toPx(3), toPy(50)); ctx.lineTo(toPx(97), toPy(50)); ctx.stroke();
      // Centre circle (radius ~9% of height)
      ctx.beginPath(); ctx.arc(toPx(50), toPy(50), PH * 0.09, 0, Math.PI * 2); ctx.stroke();
      // Top penalty box (upper third)
      ctx.strokeRect(toPx(23), toPy(2), (54/100)*PW, (14/100)*PH);
      // Top 6-yard box
      ctx.strokeRect(toPx(35), toPy(2), (30/100)*PW, (6/100)*PH);
      // Bottom penalty box
      ctx.strokeRect(toPx(23), toPy(84), (54/100)*PW, (14/100)*PH);
      // Bottom 6-yard box
      ctx.strokeRect(toPx(35), toPy(92), (30/100)*PW, (6/100)*PH);

      ctx.restore(); // end clip

      // ── Players ───────────────────────────────────────────────────────────
      players.forEach((p, i) => {
        const cx2 = toPx(p.x);
        const cy2 = toPy(p.y);
        const R   = 17 * SCALE;

        // Jersey circle
        ctx.beginPath();
        ctx.arc(cx2, cy2, R, 0, Math.PI * 2);
        ctx.fillStyle = jerseyColor;
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.65)";
        ctx.lineWidth = 1.5 * SCALE;
        ctx.stroke();

        // Position text — centred in circle
        const fg2  = contrastColor(jerseyColor);
        const posFs = p.pos.length >= 3 ? 9 : p.pos.length === 2 ? 13 : 16;
        ctx.fillStyle   = fg2;
        ctx.textAlign   = "center";
        ctx.textBaseline = "middle";
        ctx.font = `900 ${posFs * SCALE}px Impact, sans-serif`;
        ctx.fillText(p.pos, cx2, cy2);

        // Starter name
        const starter = (p.name || "Starter").toUpperCase();
        ctx.fillStyle    = "rgba(255,255,255,0.92)";
        ctx.font         = `700 ${8 * SCALE}px Arial, sans-serif`;
        ctx.textAlign    = "center";
        ctx.textBaseline = "top";
        ctx.fillText(starter, cx2, cy2 + R + 3 * SCALE);

        // Sub name
        const sub = (subs[i] || "+ Sub").toUpperCase();
        ctx.fillStyle = "rgba(245,197,24,0.9)";
        ctx.font      = `italic 600 ${7 * SCALE}px Arial, sans-serif`;
        ctx.fillText(sub, cx2, cy2 + R + 14 * SCALE);
      });

      // ── Footer branding ───────────────────────────────────────────────────
      ctx.fillStyle    = "#a855f7";
      ctx.textAlign    = "center";
      ctx.textBaseline = "middle";
      ctx.font         = `900 ${10 * SCALE}px Impact, sans-serif`;
      ctx.fillText("FCROSTER.COM", midX, PY + PH + FOOTER / 2);

      // ── Download ──────────────────────────────────────────────────────────
      const link = document.createElement("a");
      link.download = `${(teamName || "FCRoster").replace(/\s+/g, "_")}_${formation}.png`;
      link.href     = canvas.toDataURL("image/png");
      link.click();

    } catch (err) {
      if (process.env.NODE_ENV !== "production") console.error("Export error:", err);
      alert("Export failed — try a screenshot instead.");
    } finally {
      setExporting(false);
    }
  }

  const pitchBg    = useMemo(() => `radial-gradient(ellipse at 50% 35%, ${pitchColor}f2, ${pitchColor}bb 65%, #122018)`, [pitchColor]);
  const accentFg   = useMemo(() => contrastColor(jerseyColor), [jerseyColor]);
  const availForms = useMemo(() => FORMATION_KEYS[format] || [], [format]);

  // ─── Opposition state ─────────────────────────────────────────────────────────
  const [oppFormation, setOppFormation] = useState("4-4-2");
  const [oppPlayers,   setOppPlayers]   = useState([]);

  function handleOppFormation(f) {
    setOppFormation(f);
    setOppPlayers([]);  // Builder re-initialises opp positions
  }

  // ─── Drawing tool state ──────────────────────────────────────────────────────
  const [drawMode,    setDrawMode]    = useState(null);
  const [strokes,     setStrokes]     = useState([]);
  const [balls,       setBalls]       = useState([]);
  const [drawing,     setDrawing]     = useState(false);
  const [currentPts,  setCurrentPts]  = useState([]);
  const [history,     setHistory]     = useState([]);
  const drawRef = useRef(null);

  // Refs so handlers never read stale closure values
  const drawingRef    = useRef(false);
  const drawModeRef   = useRef(null);
  const currentPtsRef = useRef([]);
  const drawRafRef    = useRef(null);

  useEffect(() => { drawModeRef.current = drawMode; }, [drawMode]);

  // ─── Phase state (Playmaker phases — premium behind login) ───────────────────
  const [phases,          setPhases]          = useState([{ id:"ph_0", label:"Phase 1", players:[], strokes:[], balls:[] }]);
  const [currentPhaseIdx, setCurrentPhaseIdx] = useState(0);
  const [isAnimating,     setIsAnimating]     = useState(false);
  const [animSpeed,       setAnimSpeed]       = useState(1200); // ms per phase
  const switchingPhaseRef = useRef(false);
  const animIntervalRef   = useRef(null);

  // Sync drawing/player state back into the current phase snapshot (debounced)
  const phaseSyncRef = useRef(null);
  useEffect(() => {
    if (switchingPhaseRef.current) return;
    clearTimeout(phaseSyncRef.current);
    phaseSyncRef.current = setTimeout(() => {
      setPhases(prev => prev.map((ph, i) =>
        i === currentPhaseIdx ? { ...ph, players:[...players], strokes:[...strokes], balls:[...balls] } : ph
      ));
    }, 150);
    return () => clearTimeout(phaseSyncRef.current);
  }, [players, strokes, balls, currentPhaseIdx]);

  // Stop animation on unmount
  useEffect(() => () => clearInterval(animIntervalRef.current), []);

  function switchToPhase(idx) {
    if (idx === currentPhaseIdx) return;
    // Save current before switching
    setPhases(prev => prev.map((ph, i) =>
      i === currentPhaseIdx ? { ...ph, players:[...players], strokes:[...strokes], balls:[...balls] } : ph
    ));
    switchingPhaseRef.current = true;
    const target = phases[idx];
    setCurrentPhaseIdx(idx);
    setStrokes(target.strokes ?? []);
    setBalls(target.balls ?? []);
    if (target.players?.length) setPlayers(target.players.map(p => ({...p})));
    setHistory([]);
    setDrawMode(null);
    setTimeout(() => { switchingPhaseRef.current = false; }, 80);
  }

  function addPhase() {
    // Copy current state as starting point for new phase
    const newPhase = {
      id: `ph_${Date.now()}`,
      label: `Phase ${phases.length + 1}`,
      players: players.map(p => ({...p})),
      strokes: [...strokes],
      balls: [...balls],
    };
    setPhases(prev => [...prev, newPhase]);
    switchingPhaseRef.current = true;
    track("playmaker_add_phase", { phase_count: phases.length + 1 });
    setCurrentPhaseIdx(phases.length);
    // State already matches new phase — just clear draw history
    setHistory([]);
    setDrawMode(null);
    setTimeout(() => { switchingPhaseRef.current = false; }, 80);
  }

  function deletePhase(idx) {
    if (phases.length <= 1) return;
    const next = phases.filter((_, i) => i !== idx);
    const nextIdx = Math.min(idx, next.length - 1);
    setPhases(next);
    switchingPhaseRef.current = true;
    setCurrentPhaseIdx(nextIdx);
    const target = next[nextIdx];
    setStrokes(target.strokes ?? []);
    setBalls(target.balls ?? []);
    if (target.players?.length) setPlayers(target.players.map(p => ({...p})));
    setHistory([]);
    setTimeout(() => { switchingPhaseRef.current = false; }, 80);
  }

  function renamePhase(idx, label) {
    setPhases(prev => prev.map((ph, i) => i === idx ? { ...ph, label } : ph));
  }

  function toggleAnimation() {
    if (isAnimating) {
      clearInterval(animIntervalRef.current);
      setIsAnimating(false);
      return;
    }
    if (phases.length < 2) return;
    track("playmaker_animate", { phase_count: phases.length });
    setIsAnimating(true);
    let idx = currentPhaseIdx;
    animIntervalRef.current = setInterval(() => {
      idx = (idx + 1) % phases.length;
      // Load phase directly without triggering sync
      switchingPhaseRef.current = true;
      const ph = phases[idx];
      setCurrentPhaseIdx(idx);
      setStrokes(ph.strokes ?? []);
      setBalls(ph.balls ?? []);
      if (ph.players?.length) setPlayers(ph.players.map(p => ({...p})));
      setTimeout(() => { switchingPhaseRef.current = false; }, 40);
    }, animSpeed);
  }

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
      setBalls([pt]);                           // replace — only one ball on pitch at a time
      setHistory(h => [...h, { type:"ball" }]);
      setDrawMode(null);                        // auto-exit ball mode after placing
      return;
    }
    // Start stroke — write first point to ref only, no state update
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
    // Append to ref (always fast, no re-render)
    const prev = currentPtsRef.current;
    if (prev.length > 0) {
      const last = prev[prev.length - 1];
      if ((pt.x - last.x) ** 2 + (pt.y - last.y) ** 2 < 0.25) return;
    }
    currentPtsRef.current = [...prev, pt];
    // Throttle live SVG preview to one rAF per frame
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
    // Cancel any pending rAF preview
    if (drawRafRef.current) { cancelAnimationFrame(drawRafRef.current); drawRafRef.current = null; }
    drawingRef.current = false;
    setDrawing(false);
    // Read final points directly from ref — never stale
    const pts = currentPtsRef.current;
    currentPtsRef.current = [];
    setCurrentPts([]);
    if (pts.length > 1) {
      const simplified = simplifyPts(pts, 0.35);
      setStrokes(s => [...s, { pts: simplified, type: drawModeRef.current }]);
      setHistory(h => [...h, { type:"stroke" }]);
    }
  }

  // Convert point array to smooth SVG cubic bezier path (Catmull-Rom spline)
  function ptsToSmoothPath(pts) {
    if (pts.length < 2) return "";
    if (pts.length === 2) {
      return `M${pts[0].x},${pts[0].y} L${pts[1].x},${pts[1].y}`;
    }
    // Catmull-Rom with tension 0.5
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

  // Ramer-Douglas-Peucker point simplification for clean stored strokes
  function simplifyPts(pts, tolerance = 0.4) {
    if (pts.length <= 2) return pts;
    function perpendicularDist(pt, start, end) {
      const dx = end.x - start.x, dy = end.y - start.y;
      const len = Math.sqrt(dx*dx + dy*dy);
      if (len === 0) return Math.sqrt((pt.x-start.x)**2 + (pt.y-start.y)**2);
      return Math.abs((dy*pt.x - dx*pt.y + end.x*start.y - end.y*start.x) / len);
    }
    function rdp(points, eps) {
      let maxDist = 0, maxIdx = 0;
      for (let i = 1; i < points.length - 1; i++) {
        const d = perpendicularDist(points[i], points[0], points[points.length-1]);
        if (d > maxDist) { maxDist = d; maxIdx = i; }
      }
      if (maxDist > eps) {
        return [...rdp(points.slice(0, maxIdx + 1), eps).slice(0,-1), ...rdp(points.slice(maxIdx), eps)];
      }
      return [points[0], points[points.length-1]];
    }
    return rdp(pts, tolerance);
  }

  // Compute arrowhead — two arms extending from tip back along stroke at ±30°
  function getArrowHead(pts) {
    if (pts.length < 2) return null;
    const tip  = pts[pts.length - 1];
    const base = pts[pts.length - 2]; // local tangent: only look 1 step back
    const dx = tip.x - base.x;
    const dy = tip.y - base.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 0.01) return null;
    const ux = dx / dist;
    const uy = dy / dist;
    const armLen = 3.5;
    const angle  = Math.PI / 5;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return {
      top: {
        x1: tip.x + armLen * (-ux * cos - (-uy) * sin),
        y1: tip.y + armLen * (-uy * cos + (-ux) * sin),
        x2: tip.x, y2: tip.y,
      },
      bottom: {
        x1: tip.x + armLen * (-ux * cos + (-uy) * sin),
        y1: tip.y + armLen * (-uy * cos - (-ux) * sin),
        x2: tip.x, y2: tip.y,
      },
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

  const [showOpposition, setShowOpposition] = useState(false);

  return (
    <div className="flex flex-col" style={{ minHeight:"100dvh", background: BRAND.colors.navy, color: BRAND.colors.white, fontFamily: BRAND.fonts.body, WebkitFontSmoothing:"antialiased", MozOsxFontSmoothing:"grayscale", textRendering:"optimizeLegibility" }}>

      {/* ── Nav ── */}
      <header style={{ background:"#fdfef8", borderBottom:`1px solid rgba(0,0,0,0.08)` }}>
        {/* Row 1: Logo + wordmark — click returns to builder */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3">
          <button className="flex items-center gap-4 text-left hover:opacity-80 transition-opacity flex-1 min-w-0"
            onClick={() => setActiveTab("builder")} title="Go to Builder">
            <NetworkSphere size={56}/>
            <div className="flex flex-col justify-center">
              <div className="font-black leading-none tracking-tight" style={{ fontFamily: BRAND.fonts.display, fontSize: 32, color: "#111827", letterSpacing: 1 }}>
                FCROSTER.COM
              </div>
              <div className="text-[10px] tracking-widest mt-1" style={{ color: "#4a5568", fontFamily: BRAND.fonts.body }}>
                CONNECT · ORGANIZE · COMPETE
              </div>
            </div>
          </button>
          {/* Profile / Sign In */}
          {session ? (
            <button onClick={() => setShowProfile(true)}
              className="flex items-center gap-1.5 px-2.5 rounded-full transition-all hover:opacity-90 shrink-0 ml-2"
              title="My Profile"
              style={{ height:36, background: BRAND.colors.green, border:`2px solid ${BRAND.colors.green}`, color:"#fff", maxWidth:140 }}>
              <span style={{ fontSize:15 }}>{profile?.avatar_emoji || session?.email?.[0]?.toUpperCase() || "?"}</span>
              <span className="text-xs font-black truncate" style={{ maxWidth:80, letterSpacing:0.3 }}>
                {profile?.display_name || session?.email?.split("@")[0] || "Me"}
              </span>
            </button>
          ) : (
            <button onClick={() => setShowAuth(true)}
              className="px-4 py-2 rounded-xl font-black text-xs tracking-wide transition-all hover:brightness-110 shrink-0 ml-3"
              style={{ background: BRAND.colors.yellow, color:"#111", border:`2px solid ${BRAND.colors.yellow}`, fontFamily: BRAND.fonts.body }}>
              Sign In
            </button>
          )}
        </div>

        {/* Row 2: Tabs */}
        <div className="flex gap-1.5 px-4 pb-3 pt-2 overflow-x-auto" style={{ borderTop:`1px solid rgba(0,0,0,0.08)`, background:"#e8eaed" }}>
          {APP_TABS.map(({ id, label }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className="px-4 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap"
              style={activeTab === id
                ? { background: BRAND.colors.green, color: "#fff", boxShadow:`0 2px 8px ${BRAND.colors.green}55` }
                : { background:"#fff", color: "#374151", border:"1px solid rgba(0,0,0,0.18)", boxShadow:"0 1px 3px rgba(0,0,0,0.08)" }}>
              {label}
            </button>
          ))}
        </div>

        {/* Builder controls */}
        {activeTab === "builder" && (<Suspense fallback={<TabLoader/>}>
          <>
            <div className="flex items-end gap-3 px-4 pt-2.5 pb-2.5 flex-wrap" style={{ borderTop:`1px solid rgba(0,0,0,0.12)`, background:"#d4d6da" }}>
              <div className="flex flex-col gap-0.5 flex-1 min-w-[110px] max-w-[200px]">
                <span className="text-[9px] font-bold tracking-widest uppercase" style={{ color: "#4b5563", letterSpacing:1.5 }}>Team Name</span>
                <input className="rounded-md px-2 py-1 text-xs placeholder-gray-500 focus:outline-none w-full"
                  style={{ background:"#bfc1c6", border:`1px solid #a8aab0`, color:"#111827" }}
                  maxLength={40} placeholder="Team name…" value={teamName} onChange={e => setTeamName(e.target.value)}
                  onFocus={e => e.target.style.borderColor = BRAND.colors.green}
                  onBlur={e => e.target.style.borderColor = "#a8aab0"}/>
              </div>
              <ColorSwatch label="Jersey" value={jerseyColor} onChange={setJerseyColor} presets={JERSEY_PRESETS}/>
              <ColorSwatch label="Pitch"  value={pitchColor}  onChange={setPitchColor}  presets={PITCH_PRESETS}/>
            </div>
            <div className="flex items-center gap-3 px-4 pt-2 pb-2" style={{ borderTop:`1px solid rgba(0,0,0,0.1)`, background:"#caccd1" }}>
              <span className="text-[9px] font-bold tracking-widest uppercase shrink-0" style={{ color: "#4b5563", letterSpacing:1.5 }}>Format</span>
              <div className="flex gap-1 flex-wrap flex-1">
                {[5,7,9,11].map(f => (
                  <button key={f} onClick={() => handleFormat(f)}
                    className="px-2.5 py-1 rounded text-xs font-bold transition-all"
                    style={format===f ? { background: BRAND.colors.green, color:"#fff" } : { background:"rgba(0,0,0,0.12)", color: "#374151" }}>
                    {f}v{f}
                  </button>
                ))}
              </div>
              {/* Load Team button — only shown when signed in and on a team */}
              {session && team && (
                <button onClick={async () => {
                  const members = await sb.getTeamMembers(team.id, session.token).catch(() => []);
                  if (!members.length) return;
                  // Map members to current formation slots by position preference
                  const slots = [...players];
                  const available = [...members];
                  // First pass: fill by matching position
                  const filled = new Set();
                  const usedMember = new Set();
                  slots.forEach((slot, idx) => {
                    const match = available.findIndex(m => !usedMember.has(m.user_id) && m.position === slot.pos);
                    if (match >= 0) {
                      const m = available[match];
                      slots[idx] = { ...slot,
                        name: m.profiles?.display_name || "",
                        jersey: m.jersey || "",
                      };
                      filled.add(idx);
                      usedMember.add(m.user_id);
                    }
                  });
                  // Second pass: fill remaining slots with unassigned members
                  const unassigned = available.filter(m => !usedMember.has(m.user_id));
                  let ui = 0;
                  slots.forEach((slot, idx) => {
                    if (!filled.has(idx) && ui < unassigned.length) {
                      const m = unassigned[ui++];
                      slots[idx] = { ...slot,
                        name: m.profiles?.display_name || "",
                        jersey: m.jersey || "",
                      };
                    }
                  });
                  setPlayers(slots);
                  track("team_loaded", { team_size: members.length, format });
                }}
                  className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-black transition-all shrink-0 active:scale-95"
                  style={{ background:BRAND.colors.green, color:"#fff", border:"none", cursor:"pointer",
                    fontFamily:BRAND.fonts.display, letterSpacing:0.5, whiteSpace:"nowrap" }}>
                  ⚽ Load Team
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 px-4 pb-2.5 pt-2 flex-wrap" style={{ borderTop:`1px solid rgba(0,0,0,0.1)`, background:"#c0c2c8" }}>
              <span className="text-[9px] font-bold tracking-widest uppercase shrink-0" style={{ color: "#4b5563", letterSpacing:1.5 }}>Formation</span>
              <div className="flex gap-1.5 flex-wrap">
                {availForms.map(f => (
                  <button key={f} onClick={() => handleFormation(f)}
                    className="px-3 py-1 rounded-lg text-xs font-bold transition-all"
                    style={formation===f
                      ? { background: BRAND.colors.green, color:"#fff" }
                      : { background:"rgba(0,0,0,0.1)", color:"#374151", border:`1px solid rgba(0,0,0,0.15)` }}>
                    {f}
                  </button>
                ))}
              </div>
            </div>

          </>
        )}
      </header>

      {/* ── Content ── */}
      <main className="flex-1 flex flex-col">
        {activeTab === "builder" && (
          <BuilderLayout
            exportRef={exportRef} pitchRef={pitchRef} drawRef={drawRef}
            teamName={teamName} format={format} formation={formation}
            jerseyColor={jerseyColor} accentFg={accentFg} pitchBg={pitchBg}
            players={players} setPlayers={setPlayers}
            subs={subs} setSubs={setSubs} onPlayerUpdate={onPlayerUpdate}
            rosterLoading={rosterLoading}
            team={team}
            drawMode={drawMode} drawing={drawing} currentPts={currentPts} strokes={strokes} balls={balls}
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
            exporting={exporting} handleExport={handleExport}
            phases={phases} currentPhaseIdx={currentPhaseIdx}
            onSwitchPhase={switchToPhase} onAddPhase={addPhase}
            onDeletePhase={deletePhase} onRenamePhase={renamePhase}
            isAnimating={isAnimating} onToggleAnimation={toggleAnimation}
            animSpeed={animSpeed} onSetAnimSpeed={setAnimSpeed}
            session={session} onShowAuth={() => setShowAuth(true)}
            profile={profile}
            serverLoadRef={serverLoadRef}
            setSubs={setSubs}
          />
        )}
        {activeTab === "about" && (<Suspense fallback={<TabLoader/>}><AboutTab session={session} onShowAuth={() => setShowAuth(true)} onGoProfile={() => setActiveTab("profile")}/></Suspense>)}
        {activeTab === "profile" && (<Suspense fallback={<TabLoader/>}>
          <ProfileTab
            session={session}
            profile={profile}
            team={team}
            teamMembers={teamMembers}
            players={players}
            onShowAuth={() => setShowAuth(true)}
            onSignOut={handleSignOut}
            onEditProfile={() => setShowEditProfile(true)}
            onCreateTeam={() => setShowCreateTeam(true)}
            onJoinTeam={() => setShowJoinTeam(true)}
            onManageSquad={() => setShowManageSquad(true)}
            onLeaveTeam={async () => {
              if (!team || !window.confirm(`Leave ${team.name}?`)) return;
              await sb.leaveTeam(team.id, session.user.id, session.token).catch(() => {});
              setTeam(null); setTeamMembers([]);
            }}
          />
        )}
        <div style={{ display: activeTab === "community" ? "block" : "none" }}>
          <Suspense fallback={<TabLoader/>}>
            <CommunityTab session={session} profile={profile} setSession={setSession} showAuth={showAuth} setShowAuth={setShowAuth}/>
          </Suspense>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="shrink-0 text-center py-3 text-[10px]" style={{ color: BRAND.colors.muted, borderTop:`1px solid ${BRAND.colors.border}`, fontFamily: BRAND.fonts.body }}>
        © 2025 FCRoster.com · Connect. Organize. Compete.
      </footer>

      {/* ── Global Auth Modal ── */}
      {showAuth && (
        <Suspense fallback={null}>
          <AuthModal
            onClose={() => setShowAuth(false)}
            onAuth={sess => { setSession(sess); setShowAuth(false); }}
          />
        </Suspense>
      )}

      {/* ── Profile Panel (slide-in) ── */}
      {showProfile && session && (
        <Suspense fallback={null}>
          <ProfilePanel
            session={session}
            profile={profile}
            team={team}
            teamMembers={teamMembers}
            onClose={() => setShowProfile(false)}
            onSignOut={handleSignOut}
            onGoProfile={() => { setActiveTab("profile"); setShowProfile(false); }}
          />
        </Suspense>
      )}

      {/* ── Team Modals ── */}
      {showCreateTeam && session && (
        <Suspense fallback={null}>
          <CreateTeamModal
          session={session}
          onClose={() => setShowCreateTeam(false)}
          onCreated={async t => {
            setTeam(t);
            const members = await sb.getTeamMembers(t.id, session.token).catch(() => []);
            setTeamMembers(members);
            setShowCreateTeam(false);
          }}
        />
        </Suspense>
      )}

      {showJoinTeam && session && (
        <Suspense fallback={null}>
          <JoinTeamModal
          session={session}
          onClose={() => setShowJoinTeam(false)}
          onJoined={async t => {
            setTeam(t);
            const members = await sb.getTeamMembers(t.id, session.token).catch(() => []);
            setTeamMembers(members);
            setShowJoinTeam(false);
          }}
        />
        </Suspense>
      )}

      {showManageSquad && session && team && (
        <Suspense fallback={null}>
          <ManageSquadModal
          session={session}
          team={team}
          members={teamMembers}
          onClose={() => setShowManageSquad(false)}
          onUpdated={updated => setTeamMembers(updated)}
        />
        </Suspense>
      )}

      {/* ── Onboarding Modal (first login) ── */}
      {showOnboarding && session && (
        <Suspense fallback={null}>
          <PlayerSetupModal
            session={session}
            profile={profile}
            mode="onboarding"
            onComplete={prof => {
              setProfile(prev => ({ ...prev, ...prof }));
              setShowOnboarding(false);
              if (prof.team_name) setTeamName(prof.team_name);
            }}
          />
        </Suspense>
      )}
      {showEditProfile && session && (
        <Suspense fallback={null}>
          <PlayerSetupModal
            session={session}
            profile={profile}
            mode="edit"
            onClose={() => setShowEditProfile(false)}
            onComplete={prof => {
              setProfile(prev => ({ ...prev, ...prof }));
              setShowEditProfile(false);
              if (prof.team_name) setTeamName(prof.team_name);
            }}
          />
        </Suspense>
      )}
    </div>
  );
}

export default function FCRosterApp() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<TabLoader/>}>
        <App />
      </Suspense>
    </ErrorBoundary>
  );
}
