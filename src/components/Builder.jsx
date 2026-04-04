// ─── Builder components ───────────────────────────────────────────────────────
import React, { useState, useRef, useEffect, useMemo, memo } from "react";
import { BRAND, LOGO_SRC, JERSEY_PRESETS, PITCH_PRESETS } from "../tokens.js";
import { FORMATIONS } from "../data.js";
import { contrastColor } from "../helpers.js";

// ── Logo ──────────────────────────────────────────────────────────────────────
function NetworkSphere({ size = 48 }) {
  return (
    <img src={LOGO_SRC} alt="FCRoster.com logo" width={size} height={size}
      style={{ objectFit:"contain", display:"block", flexShrink:0 }}/>
  );
}

// ── Inline name editor ────────────────────────────────────────────────────────
function InlineEdit({ value, onChange, placeholder, textStyle = {}, className = "" }) {
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState(value);
  const ref = useRef(null);

  function open(e) { e.stopPropagation(); setDraft(value); setEditing(true); setTimeout(() => ref.current?.select(), 0); }
  function commit() { setEditing(false); onChange(draft); }

  if (editing) {
    return (
      <input ref={ref} autoFocus
        className="text-center font-bold bg-white text-gray-900 rounded px-1 outline-none shadow-xl"
        style={{ width:90, fontSize:11, zIndex:60, position:"relative", border:`2px solid ${BRAND.colors.yellow}`, textTransform:"uppercase", letterSpacing:0.5 }}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key==="Enter") commit(); if (e.key==="Escape") setEditing(false); }}
        onClick={e => e.stopPropagation()}/>
    );
  }
  return (
    <span onClick={open} className={`cursor-pointer select-none text-center block truncate leading-tight ${className}`}
      style={{ maxWidth:120, ...textStyle }} title="Tap to edit">
      {value || <span style={{ opacity:0.38 }}>{placeholder}</span>}
    </span>
  );
}

// ── Player spot ───────────────────────────────────────────────────────────────
function PlayerSpot({ player, subName, jerseyColor, onStarterChange, onSubChange, onCirclePointerDown, moveMode }) {
  const fg = contrastColor(jerseyColor);
  return (
    <div className="absolute flex flex-col items-center select-none"
      style={{ left:`${player.x}%`, top:`${player.y}%`, transform:"translate(-50%,-50%)", zIndex:10, gap:1 }}>
      <div
        className="rounded-full flex items-center justify-center font-black shadow-xl border-2 border-white/60"
        style={{ width:44, height:44, flexShrink:0, background:jerseyColor, color:fg,
          letterSpacing:0, fontSize: player.pos.length >= 3 ? 11 : player.pos.length === 2 ? 15 : 18,
          lineHeight:1, textAlign:"center",
          cursor: moveMode ? "grab" : "default", touchAction:"none" }}
        onPointerDown={moveMode ? (e => onCirclePointerDown(e, player.id)) : undefined}>
        {player.pos}
      </div>
      <InlineEdit value={player.name} onChange={onStarterChange} placeholder="STARTER"
        className="font-bold text-white"
        textStyle={{ fontSize:13, textShadow:"0 1px 6px rgba(0,0,0,1)", fontWeight:700, textTransform:"uppercase", letterSpacing:0.5 }}/>
      <InlineEdit value={subName} onChange={onSubChange} placeholder="+ SUB"
        className="font-medium"
        textStyle={{ fontSize:12, textShadow:"0 1px 5px rgba(0,0,0,0.95)", color:BRAND.colors.yellow, opacity:0.9, fontStyle:"italic", textTransform:"uppercase", letterSpacing:0.5 }}/>
    </div>
  );
}

// ── Pitch markings ────────────────────────────────────────────────────────────
function PitchLines() {
  const s = "rgba(255,255,255,0.42)";
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 160" preserveAspectRatio="xMidYMid meet">
      <rect x="3" y="3" width="94" height="154" rx="2" fill="none" stroke={s} strokeWidth="0.8"/>
      <line x1="3" y1="80" x2="97" y2="80" stroke={s} strokeWidth="0.6"/>
      <circle cx="50" cy="80" r="14" fill="none" stroke={s} strokeWidth="0.6"/>
      <circle cx="50" cy="80" r="0.8" fill={s}/>
      <rect x="23" y="3"     width="54" height="22" fill="none" stroke={s} strokeWidth="0.6"/>
      <rect x="35" y="3"     width="30" height="9"  fill="none" stroke={s} strokeWidth="0.6"/>
      <rect x="40" y="0.5"   width="20" height="4"  fill="none" stroke={s} strokeWidth="0.8"/>
      <rect x="23" y="135"   width="54" height="22" fill="none" stroke={s} strokeWidth="0.6"/>
      <rect x="35" y="148"   width="30" height="9"  fill="none" stroke={s} strokeWidth="0.6"/>
      <rect x="40" y="155.5" width="20" height="4"  fill="none" stroke={s} strokeWidth="0.8"/>
      {[[3,3],[97,3],[3,157],[97,157]].map(([cx,cy],i) => (
        <path key={i} d={`M${cx+(cx<50?3:-3)} ${cy} Q${cx} ${cy} ${cx} ${cy+(cy<80?3:-3)}`} fill="none" stroke={s} strokeWidth="0.6"/>
      ))}
    </svg>
  );
}

// ── Color swatch picker ───────────────────────────────────────────────────────
function ColorSwatch({ label, value, onChange, presets }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    function handle(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);
  return (
    <div className="flex flex-col items-start gap-0.5 relative" ref={ref}>
      <span className="text-[9px] font-bold tracking-widest uppercase" style={{ color:"#6b7280", letterSpacing:1.5, fontFamily:BRAND.fonts.body }}>{label}</span>
      <button className="w-7 h-7 rounded-full border-2 shadow-md transition-all hover:scale-110"
        style={{ background:value, borderColor: open ? BRAND.colors.yellow : "rgba(255,255,255,0.25)" }}
        onClick={e => { e.stopPropagation(); setOpen(o => !o); }}/>
      {open && (
        <div className="absolute top-full left-0 mt-2 z-50 p-2 rounded-xl shadow-2xl"
          style={{ background:"#1f2937", border:`1px solid ${BRAND.colors.border}`, minWidth:132 }}
          onClick={e => e.stopPropagation()}>
          <div className="grid gap-1.5" style={{ gridTemplateColumns:"repeat(5, 1fr)" }}>
            {presets.map(c => (
              <button key={c} onClick={() => { onChange(c); setOpen(false); }}
                className="rounded-full border-2 transition-all hover:scale-110"
                style={{ width:20, height:20, background:c, borderColor: value===c ? BRAND.colors.yellow : "rgba(255,255,255,0.15)" }}/>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Roster panel ──────────────────────────────────────────────────────────────
function RosterPanel({ players, subs, teamName, format, formation, defaultExpanded = false }) {
  const [copied,   setCopied]   = useState(false);
  const [expanded, setExpanded] = useState(defaultExpanded);

  const rows = players.map((p, i) => ({
    pos: p.pos, starter: p.name || "", sub: subs[i] || "", y: p.y,
  })).sort((a, b) => b.y - a.y);

  function buildRosterText() {
    const header  = `${teamName || "My Team"} — ${format}v${format} ${formation}`;
    const divider = "-".repeat(header.length);
    const lines   = rows.map(({ pos, starter, sub }) => {
      const line = `  ${pos.padEnd(4)} ${starter || "(unnamed)"}`;
      return sub ? `${line}\n         > sub: ${sub}` : line;
    });
    return [header, divider, ...lines, divider, "FCRoster.com"].join("\n");
  }

  function handleCopy() {
    const text      = buildRosterText();
    const doFallback = () => {
      const el = document.createElement("textarea");
      el.value = text;
      el.style.cssText = "position:fixed;top:0;left:0;opacity:0;pointer-events:none";
      document.body.appendChild(el); el.focus(); el.select();
      try { document.execCommand("copy"); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
      document.body.removeChild(el);
    };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text)
        .then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); })
        .catch(doFallback);
    } else { doFallback(); }
  }

  const hasAnyName = rows.some(r => r.starter || r.sub);

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background:"#0f1b2d", border:`2px solid rgba(255,255,255,0.18)`, boxShadow:"0 0 18px rgba(255,255,255,0.06)" }}>
      <div className="flex items-center justify-between gap-2 px-4 py-3" style={{ background:"rgba(255,255,255,0.07)" }}>
        <div className="flex items-center gap-2">
          <span style={{ fontSize:16 }}>📋</span>
          <span className="font-black tracking-wider" style={{ fontFamily:BRAND.fonts.display, fontSize:15, color:"#e2e8f0", letterSpacing:2 }}>ROSTER</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95"
            style={{ background: copied ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.07)", border:`1px solid ${copied ? "rgba(34,197,94,0.5)" : "rgba(255,255,255,0.12)"}`, color: copied ? "#4ade80" : "#94a3b8", fontFamily:BRAND.fonts.body }}>
            {copied ? "✓ Copied!" : "⎘ Copy"}
          </button>
          <button onClick={() => setExpanded(v => !v)} style={{ background:"none", border:"none", cursor:"pointer", padding:"2px 0" }}>
            <span style={{ color:BRAND.colors.yellow, fontSize:12, display:"inline-block", transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition:"transform 0.2s" }}>▼</span>
          </button>
        </div>
      </div>
      {expanded && (
        <div className="px-3 py-2" style={{ borderTop:`1px solid rgba(255,255,255,0.08)` }}>
          {rows.map(({ pos, starter, sub }, i) => (
            <div key={i} className="flex flex-col py-2" style={{ borderBottom: i < rows.length-1 ? `1px solid rgba(255,255,255,0.05)` : "none" }}>
              <div className="flex items-center gap-2.5">
                <div className="rounded flex items-center justify-center font-black shrink-0"
                  style={{ width:28, height:20, background:"rgba(255,255,255,0.06)", fontSize:8, color:"#94a3b8", fontFamily:BRAND.fonts.display, letterSpacing:0.5 }}>{pos}</div>
                <span className="text-xs font-semibold leading-tight" style={{ color: starter ? "#f1f5f9" : "#374151" }}>
                  {starter || <span style={{ fontStyle:"italic", color:"#374151" }}>Starter</span>}
                </span>
              </div>
              {sub && (
                <div className="flex items-center gap-2.5 mt-1 pl-1">
                  <span style={{ fontSize:9, color:"#4b5563", paddingLeft:3, paddingRight:6 }}>↳</span>
                  <span className="text-[11px] font-medium italic" style={{ color:BRAND.colors.yellow, opacity:0.85 }}>{sub}</span>
                </div>
              )}
            </div>
          ))}
          {!hasAnyName && (
            <p className="text-[10px] text-center py-3 italic" style={{ color:"#374151", fontFamily:BRAND.fonts.body }}>
              Tap player names on the pitch to fill the roster
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Formation diagram (mini preview) ─────────────────────────────────────────
function FormationDiagram({ formation, format = 11 }) {
  const players = FORMATIONS[format]?.[formation] || [];
  const s = "rgba(255,255,255,0.28)";
  return (
    <div className="relative rounded-xl overflow-hidden" style={{ background:"radial-gradient(ellipse at 50% 40%, #2d7a3a, #1a5c2e 70%, #0d3320)", aspectRatio:"2/3", width:"100%" }}>
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 150" preserveAspectRatio="none">
        <rect x="4" y="3" width="92" height="144" rx="2" fill="none" stroke={s} strokeWidth="0.8"/>
        <line x1="4" y1="75" x2="96" y2="75" stroke={s} strokeWidth="0.5"/>
        <circle cx="50" cy="75" r="12" fill="none" stroke={s} strokeWidth="0.5"/>
        <circle cx="50" cy="75" r="0.8" fill={s}/>
        <rect x="28" y="3"   width="44" height="16" fill="none" stroke={s} strokeWidth="0.5"/>
        <rect x="28" y="131" width="44" height="16" fill="none" stroke={s} strokeWidth="0.5"/>
        <rect x="38" y="3"   width="24" height="7"  fill="none" stroke={s} strokeWidth="0.4"/>
        <rect x="38" y="140" width="24" height="7"  fill="none" stroke={s} strokeWidth="0.4"/>
      </svg>
      {players.map(p => (
        <div key={p.id} className="absolute flex flex-col items-center"
          style={{ left:`${p.x}%`, top:`${p.y}%`, transform:"translate(-50%,-50%)", zIndex:2 }}>
          <div className="rounded-full border border-white/70 flex items-center justify-center"
            style={{ width:16, height:16, background:"#111", color:"#fff", fontWeight:900, letterSpacing:0, lineHeight:1,
              fontSize: p.pos.length >= 3 ? 4 : p.pos.length === 2 ? 5.5 : 6.5 }}>
            {p.pos}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Builder Layout (responsive, pitch + playmaker + roster) ───────────────────
function BuilderLayout({
  exportRef, pitchRef, drawRef,
  teamName, format, formation, jerseyColor, accentFg, pitchBg,
  players, setPlayers, subs, setSubs,
  drawMode, drawing, currentPts, strokes, balls,
  showOpposition, oppPlayers,
  onCirclePointerDown, onCirclePointerMove, onCirclePointerUp, dragging,
  moveMode, setMoveMode, undoPosition, positionHistoryLen, resetFormation,
  onDrawStart, onDrawMove, onDrawEnd,
  ptsToSmoothPath, getArrowHead,
  setDrawMode, undoLast, clearStrokes,
  oppFormation, handleOppFormation, setShowOpposition,
  exporting, handleExport,
}) {
  const containerRef   = useRef(null);
  const [pitchSize, setPitchSize] = useState({ w:340, isDesktop:false });
  const [playmakersOpen, setPlaymakerOpen] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    function measure() {
      const W = el.offsetWidth, H = el.offsetHeight;
      const desktop = W >= 768;
      if (desktop) {
        const maxByH = Math.floor((H - 84) * (2/3));
        const maxByW = W - 360 - 32;
        const w = Math.min(maxByH, maxByW, 440);
        setPitchSize({ w: Math.max(w, 200), isDesktop:true });
      } else {
        setPitchSize({ w: Math.min(W - 24, 440), isDesktop:false });
      }
    }
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  function Toggle({ on, color = "#6366f1" }) {
    return (
      <span style={{ display:"inline-flex", alignItems:"center", width:36, height:20, borderRadius:10,
        background: on ? color : "rgba(255,255,255,0.1)", padding:"0 2px",
        justifyContent: on ? "flex-end" : "flex-start", transition:"background 0.2s", flexShrink:0 }}>
        <span style={{ width:16, height:16, borderRadius:"50%", background:"#fff", display:"block", boxShadow:"0 1px 3px rgba(0,0,0,0.4)" }}/>
      </span>
    );
  }

  const Pitch = (
    <>
      <div ref={exportRef} className="flex flex-col items-center gap-3 px-6 pt-4 pb-6 rounded-2xl" style={{ background:"#030712" }}>
        <div className="flex flex-col gap-1 items-center text-center" style={{ width:"100%" }}>
          <div className="tracking-widest" style={{ fontFamily:BRAND.fonts.display, fontSize: pitchSize.isDesktop ? 36 : 28, textShadow:`0 2px 20px ${jerseyColor}99` }}>
            {teamName || "MY TEAM FC"}
          </div>
          <div className="font-black tracking-[3px]" style={{ fontFamily:BRAND.fonts.display, fontSize: pitchSize.isDesktop ? 28 : 24, color:BRAND.colors.yellow }}>
            {format}v{format}
          </div>
          <div className="font-black tracking-widest" style={{ fontFamily:BRAND.fonts.display, fontSize: pitchSize.isDesktop ? 20 : 17, color:"#ffffff", lineHeight:1, textShadow:"0 2px 24px rgba(0,0,0,0.6)" }}>
            {formation}
          </div>
        </div>
        <div style={{ padding:"30px 20px 60px 20px", width:"100%", display:"flex", justifyContent:"center" }}>
          <div ref={pitchRef} className="relative rounded-2xl shadow-2xl"
            style={{ width:pitchSize.w, aspectRatio:"2/3", background:pitchBg, boxShadow:`0 0 60px rgba(0,0,0,0.5), 0 20px 60px rgba(0,0,0,0.7)`, overflow:"visible", flexShrink:0, cursor: dragging ? "grabbing" : "default", touchAction: moveMode ? "none" : "pan-y" }}
            onPointerMove={e => { if (dragging) onCirclePointerMove(e, dragging); }}
            onPointerUp={e => { if (dragging) onCirclePointerUp(e, dragging); }}
            onPointerLeave={e => { if (dragging) onCirclePointerUp(e, dragging); }}>
            <div className="absolute inset-0 rounded-2xl overflow-hidden"><PitchLines/></div>
            {players.map((p,i) => (
              <PlayerSpot key={p.id} player={p} subName={subs[i] ?? ""} jerseyColor={jerseyColor}
                moveMode={moveMode}
                onStarterChange={name => setPlayers(prev => prev.map(q => q.id===p.id ? {...q,name} : q))}
                onSubChange={name => setSubs(prev => prev.map((s,si) => si===i ? name : s))}
                onCirclePointerDown={onCirclePointerDown}/>
            ))}
            {showOpposition && oppPlayers.map(p => (
              <div key={p.id} className="absolute flex flex-col items-center pointer-events-none"
                style={{ left:`${p.x}%`, top:`${100-p.y}%`, transform:"translate(-50%,-50%)", zIndex:15 }}>
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <line x1="5" y1="5" x2="23" y2="23" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round"/>
                  <line x1="23" y1="5" x2="5" y2="23" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
                <div className="text-[11px] font-bold" style={{ color:"#fca5a5", textShadow:"0 1px 4px rgba(0,0,0,0.9)", marginTop:1 }}>{p.pos}</div>
              </div>
            ))}
            {balls.map((b,i) => (
              <div key={i} className="absolute pointer-events-none"
                style={{ left:`${b.x}%`, top:`${b.y}%`, transform:"translate(-50%,-50%)", zIndex:18, fontSize:20, lineHeight:1, filter:"drop-shadow(0 2px 4px rgba(0,0,0,0.7))" }}>⚽</div>
            ))}
            <svg ref={drawRef} className="absolute inset-0 rounded-2xl" viewBox="0 0 100 100" preserveAspectRatio="none"
              style={{ width:"100%", height:"100%", zIndex: drawMode ? 20 : 0, cursor: drawMode ? (drawMode==="ball" ? "cell" : "crosshair") : "default", touchAction:"none", pointerEvents: drawMode ? "all" : "none" }}>
              <rect x="0" y="0" width="100" height="100" fill="transparent"
                onPointerDown={e => { try { e.currentTarget.setPointerCapture(e.pointerId); } catch {} onDrawStart(e); }}
                onPointerMove={onDrawMove} onPointerUp={onDrawEnd}
                onTouchStart={onDrawStart} onTouchMove={onDrawMove} onTouchEnd={onDrawEnd}/>
              {strokes.map((s,i) => {
                const color = s.type==="run" ? "#22c55e" : "#facc15";
                const arrow = getArrowHead(s.pts);
                return (
                  <g key={i} opacity="0.92">
                    <path d={ptsToSmoothPath(s.pts)} fill="none" stroke={color} strokeWidth="0.65" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={s.type==="pass" ? "2.5 1.8" : "none"}/>
                    {arrow && <>
                      <line x1={arrow.top.x1} y1={arrow.top.y1} x2={arrow.top.x2} y2={arrow.top.y2} stroke={color} strokeWidth="0.6" strokeLinecap="round"/>
                      <line x1={arrow.bottom.x1} y1={arrow.bottom.y1} x2={arrow.bottom.x2} y2={arrow.bottom.y2} stroke={color} strokeWidth="1.0" strokeLinecap="round"/>
                    </>}
                  </g>
                );
              })}
              {drawing && currentPts.length > 1 && (() => {
                const color = drawMode==="run" ? "#22c55e" : "#facc15";
                const arrow = getArrowHead(currentPts);
                return (
                  <g opacity="0.6">
                    <path d={ptsToSmoothPath(currentPts)} fill="none" stroke={color} strokeWidth="0.65" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={drawMode==="pass" ? "2.5 1.8" : "none"}/>
                    {arrow && <>
                      <line x1={arrow.top.x1} y1={arrow.top.y1} x2={arrow.top.x2} y2={arrow.top.y2} stroke={color} strokeWidth="0.6" strokeLinecap="round"/>
                      <line x1={arrow.bottom.x1} y1={arrow.bottom.y1} x2={arrow.bottom.x2} y2={arrow.bottom.y2} stroke={color} strokeWidth="1.0" strokeLinecap="round"/>
                    </>}
                  </g>
                );
              })()}
            </svg>
          </div>
        </div>
        <div className="w-full text-center pt-1 pb-2">
          <span className="font-black tracking-widest" style={{ fontFamily:BRAND.fonts.display, fontSize:13, color:"#a855f7", letterSpacing:3 }}>FCROSTER.COM</span>
        </div>
      </div>
      <p className="text-[10px] text-center mt-2 w-full" style={{ color:"#6b7280" }}>
        {drawMode==="run"  && <span style={{ color:"#22c55e" }}>Drawing runs — drag on pitch</span>}
        {drawMode==="pass" && <span style={{ color:"#facc15" }}>Drawing passes — drag on pitch</span>}
        {drawMode==="ball" && <span style={{ color:"#fff" }}>Tap pitch to drop ball</span>}
        {!drawMode && <>Tap <span style={{ textDecoration:"underline" }}>Starter</span> or <span style={{ color:BRAND.colors.yellow, textDecoration:"underline" }}>+sub</span> to enter a name</>}
      </p>
    </>
  );

  const playmakeContent = (
    <div className="px-4 pb-4 flex flex-col gap-2" style={{ borderTop:`1px solid rgba(255,255,255,0.08)` }}>
      <div className="pt-3 pb-1 text-[9px] font-bold tracking-widest uppercase" style={{ color:"#94a3b8", letterSpacing:2 }}>Player Movement</div>
      <button onClick={() => setMoveMode(v => !v)}
        className="flex items-center justify-between px-3 py-2.5 rounded-xl transition-all"
        style={{ background: moveMode ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.03)", border:`1px solid ${moveMode ? "#6366f1" : "rgba(255,255,255,0.07)"}`, fontFamily:BRAND.fonts.body }}>
        <div className="flex items-center gap-3">
          <span style={{ fontSize:16 }}>🕹️</span>
          <span className="text-xs font-bold" style={{ color: moveMode ? "#a5b4fc" : "#cbd5e1" }}>Move Positions</span>
        </div>
        <Toggle on={moveMode} color="#6366f1"/>
      </button>
      {positionHistoryLen > 0 && (
        <div className="flex gap-2">
          <button onClick={undoPosition} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold flex-1"
            style={{ background:"rgba(255,255,255,0.05)", border:`1px solid rgba(255,255,255,0.1)`, color:"#cbd5e1", fontFamily:BRAND.fonts.body }}>
            ↩ Undo move
          </button>
          <button onClick={resetFormation} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold flex-1"
            style={{ background:"rgba(239,68,68,0.07)", border:`1px solid rgba(239,68,68,0.2)`, color:"#f87171", fontFamily:BRAND.fonts.body }}>
            ⟳ Reset
          </button>
        </div>
      )}
      <div className="pt-2 pb-1 text-[9px] font-bold tracking-widest uppercase" style={{ color:"#94a3b8", letterSpacing:2 }}>Draw on Pitch</div>
      {[
        { mode:"run",  label:"Draw Run",  color:"#22c55e", dash:false },
        { mode:"pass", label:"Draw Pass", color:"#facc15", dash:true  },
      ].map(({ mode:m, label, color, dash }) => {
        const isOn = drawMode === m;
        return (
          <button key={m} onClick={() => setDrawMode(isOn ? null : m)}
            className="flex items-center justify-between px-3 py-2.5 rounded-xl transition-all"
            style={{ background: isOn ? `${color}14` : "rgba(255,255,255,0.03)", border:`1px solid ${isOn ? color : "rgba(255,255,255,0.07)"}`, fontFamily:BRAND.fonts.body }}>
            <div className="flex items-center gap-3">
              <svg width="32" height="14" viewBox="0 0 32 14">
                <line x1="2" y1="7" x2="22" y2="7" stroke={color} strokeWidth="1.1" strokeDasharray={dash ? "2.5 1.8" : "none"} strokeLinecap="round"/>
                <line x1="19" y1="3.5" x2="25" y2="7" stroke={color} strokeWidth="0.8" strokeLinecap="round"/>
                <line x1="19" y1="10.5" x2="25" y2="7" stroke={color} strokeWidth="0.8" strokeLinecap="round"/>
              </svg>
              <span className="text-xs font-bold" style={{ color: isOn ? color : "#cbd5e1" }}>{label}</span>
            </div>
            <Toggle on={isOn} color={color}/>
          </button>
        );
      })}
      <button onClick={() => setDrawMode(drawMode==="ball" ? null : "ball")}
        className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all"
        style={{ background: drawMode==="ball" ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.03)", border:`2px solid ${drawMode==="ball" ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.07)"}`, fontFamily:BRAND.fonts.body }}>
        <span style={{ fontSize:20, lineHeight:1, filter: drawMode==="ball" ? "drop-shadow(0 0 4px rgba(255,255,255,0.6))" : "none" }}>⚽</span>
        <span className="text-xs font-bold" style={{ color: drawMode==="ball" ? "#fff" : "#cbd5e1" }}>Drop Ball</span>
      </button>
      {(strokes.length > 0 || balls.length > 0) && (
        <div className="flex gap-2 mt-1">
          <button onClick={undoLast} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold flex-1"
            style={{ background:"rgba(255,255,255,0.05)", border:`1px solid rgba(255,255,255,0.15)`, color:"#cbd5e1", fontFamily:BRAND.fonts.body }}>↩ Undo</button>
          <button onClick={clearStrokes} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold flex-1"
            style={{ background:"rgba(239,68,68,0.07)", border:`1px solid rgba(239,68,68,0.2)`, color:"#f87171", fontFamily:BRAND.fonts.body }}>🗑 Clear all</button>
        </div>
      )}
      <div className="pt-3 pb-1 text-[9px] font-bold tracking-widest uppercase" style={{ color:"#94a3b8", letterSpacing:2 }}>Opposition</div>
      <button onClick={() => setShowOpposition(v => !v)}
        className="flex items-center justify-between px-3 py-2.5 rounded-xl transition-all"
        style={{ background: showOpposition ? "rgba(239,68,68,0.1)" : "rgba(255,255,255,0.03)", border:`1px solid ${showOpposition ? "#ef4444" : "rgba(255,255,255,0.07)"}`, fontFamily:BRAND.fonts.body }}>
        <div className="flex items-center gap-3">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <line x1="4" y1="4" x2="20" y2="20" stroke="#ef4444" strokeWidth="2.2" strokeLinecap="round"/>
            <line x1="20" y1="4" x2="4" y2="20" stroke="#ef4444" strokeWidth="2.2" strokeLinecap="round"/>
          </svg>
          <span className="text-xs font-bold" style={{ color: showOpposition ? "#ef4444" : "#cbd5e1" }}>Show Opposition</span>
        </div>
        <Toggle on={showOpposition} color="#ef4444"/>
      </button>
      {showOpposition && (
        <div className="flex gap-2 items-center mt-1">
          <span className="text-[10px] font-bold shrink-0" style={{ color:"#6b7280" }}>Formation</span>
          <select value={oppFormation} onChange={e => handleOppFormation(e.target.value)}
            className="flex-1 rounded-lg px-2 py-1.5 text-xs font-bold focus:outline-none"
            style={{ background:"#1e293b", border:`1px solid rgba(255,255,255,0.1)`, color:"#fff", fontFamily:BRAND.fonts.body }}>
            {Object.keys(FORMATIONS[format]).map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
      )}
    </div>
  );

  const PlaymakerPanel = (
    <div className="rounded-2xl overflow-hidden" style={{ background:"#0f1b2d", border:`2px solid ${BRAND.colors.yellow}`, boxShadow:`0 0 18px ${BRAND.colors.yellow}30` }}>
      <div className="flex items-center gap-2 px-4 py-3" style={{ background:"rgba(245,197,24,0.10)" }}>
        <span style={{ fontSize:16 }}>🧠</span>
        <span className="font-black tracking-wider" style={{ color:BRAND.colors.yellow, fontFamily:BRAND.fonts.display, letterSpacing:2, fontSize:15 }}>PLAYMAKER MENU 🔥</span>
      </div>
      {playmakeContent}
    </div>
  );

  const DownloadBtn = (
    <div className="rounded-2xl overflow-hidden w-full" style={{ background:"#0f1b2d", border:`2px solid ${BRAND.colors.green}`, boxShadow: exporting ? "none" : `0 0 18px ${BRAND.colors.green}50` }}>
      <button onClick={handleExport} disabled={exporting}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 transition-all hover:brightness-110 active:scale-95"
        style={{ background: exporting ? "rgba(45,122,58,0.3)" : BRAND.colors.green }}>
        <div className="flex items-center gap-2">
          <span style={{ fontSize:15 }}>📥</span>
          <span className="font-black tracking-wider" style={{ color:"#fff", fontFamily:BRAND.fonts.display, letterSpacing:2, fontSize:15 }}>
            {exporting ? "SAVING…" : "DOWNLOAD"}
          </span>
        </div>
        <span style={{ fontSize:13, color:"#fff", fontWeight:900 }}>↓</span>
      </button>
    </div>
  );

  return (
    <div ref={containerRef} className="flex-1 flex" style={{ minHeight:0 }}>
      {pitchSize.isDesktop ? (
        <div className="flex-1 overflow-y-auto" style={{
          display:"grid", gridTemplateColumns:"1fr auto 1fr",
          alignItems:"start", padding:"16px 12px", gap:0, minHeight:0,
        }}>
          <div className="flex justify-center pt-2" style={{ paddingRight:16 }}>
            <div style={{ width:200 }}>{PlaymakerPanel}</div>
          </div>
          <div className="flex flex-col items-center gap-3" style={{ width:pitchSize.w }}>
            {Pitch}
            {DownloadBtn}
          </div>
          <div className="flex justify-center pt-2" style={{ paddingLeft:16 }}>
            <div style={{ width:200 }}>
              <RosterPanel players={players} subs={subs} teamName={teamName} format={format} formation={formation} defaultExpanded={true}/>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center gap-4 py-4 px-3 overflow-y-auto">
          {Pitch}
          <div className="flex flex-col gap-3 w-full" style={{ maxWidth:"min(440px,100%)" }}>
            <div className="rounded-2xl overflow-hidden" style={{ background:"#0f1b2d", border:`2px solid ${BRAND.colors.yellow}`, boxShadow:`0 0 18px ${BRAND.colors.yellow}30` }}>
              <button className="w-full flex items-center justify-between gap-2 px-4 py-3"
                onClick={() => setPlaymakerOpen(v => !v)}
                style={{ background: playmakersOpen ? "rgba(245,197,24,0.13)" : "rgba(245,197,24,0.07)", fontFamily:BRAND.fonts.body }}>
                <div className="flex items-center gap-2">
                  <span style={{ fontSize:16 }}>🧠</span>
                  <span className="font-black tracking-wider" style={{ color:BRAND.colors.yellow, fontFamily:BRAND.fonts.display, letterSpacing:2, fontSize:15 }}>PLAYMAKER MENU 🔥</span>
                </div>
                <span style={{ color:BRAND.colors.yellow, fontSize:12, display:"inline-block", transform: playmakersOpen ? "rotate(180deg)" : "rotate(0deg)", transition:"transform 0.2s" }}>▼</span>
              </button>
              {playmakersOpen && playmakeContent}
            </div>
            {DownloadBtn}
            <RosterPanel players={players} subs={subs} teamName={teamName} format={format} formation={formation}/>
          </div>
        </div>
      )}
    </div>
  );
}

export default BuilderLayout;
export { NetworkSphere, InlineEdit, PlayerSpot, PitchLines, ColorSwatch, RosterPanel, FormationDiagram };
