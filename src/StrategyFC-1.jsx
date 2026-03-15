import { useState, useRef, useEffect } from "react";

// ─── Formations ───────────────────────────────────────────────────────────────
const FORMATIONS = {
  11: {
    "4-4-2": [
      { id:"gk",  x:50, y:90, pos:"GK" },
      { id:"rb",  x:80, y:72, pos:"RB" }, { id:"rcb", x:62, y:72, pos:"CB" },
      { id:"lcb", x:38, y:72, pos:"CB" }, { id:"lb",  x:20, y:72, pos:"LB" },
      { id:"rm",  x:80, y:50, pos:"RM" }, { id:"rcm", x:62, y:50, pos:"CM" },
      { id:"lcm", x:38, y:50, pos:"CM" }, { id:"lm",  x:20, y:50, pos:"LM" },
      { id:"rs",  x:35, y:25, pos:"ST" }, { id:"ls",  x:65, y:25, pos:"ST" },
    ],
    "4-3-3": [
      { id:"gk",  x:50, y:90, pos:"GK" },
      { id:"rb",  x:80, y:72, pos:"RB" }, { id:"rcb", x:62, y:72, pos:"CB" },
      { id:"lcb", x:38, y:72, pos:"CB" }, { id:"lb",  x:20, y:72, pos:"LB" },
      { id:"rcm", x:65, y:50, pos:"CM" }, { id:"cm",  x:50, y:50, pos:"CM" },
      { id:"lcm", x:35, y:50, pos:"CM" },
      { id:"rw",  x:75, y:22, pos:"RW" }, { id:"st",  x:50, y:16, pos:"ST" },
      { id:"lw",  x:25, y:22, pos:"LW" },
    ],
    "4-2-3-1": [
      { id:"gk",  x:50, y:90, pos:"GK" },
      { id:"rb",  x:80, y:72, pos:"RB" }, { id:"rcb", x:62, y:72, pos:"CB" },
      { id:"lcb", x:38, y:72, pos:"CB" }, { id:"lb",  x:20, y:72, pos:"LB" },
      { id:"rdm", x:62, y:58, pos:"DM" }, { id:"ldm", x:38, y:58, pos:"DM" },
      { id:"ram", x:72, y:38, pos:"AM" }, { id:"cam", x:50, y:38, pos:"CAM"},
      { id:"lam", x:28, y:38, pos:"AM" },
      { id:"st",  x:50, y:18, pos:"ST" },
    ],
    "3-5-2": [
      { id:"gk",  x:50, y:90, pos:"GK" },
      { id:"rcb", x:68, y:72, pos:"CB" }, { id:"cb",  x:50, y:72, pos:"CB" },
      { id:"lcb", x:32, y:72, pos:"CB" },
      { id:"rwb", x:84, y:52, pos:"RWB"}, { id:"rcm", x:64, y:52, pos:"CM" },
      { id:"cm",  x:50, y:48, pos:"CM" }, { id:"lcm", x:36, y:52, pos:"CM" },
      { id:"lwb", x:16, y:52, pos:"LWB"},
      { id:"rs",  x:62, y:22, pos:"ST" }, { id:"ls",  x:38, y:22, pos:"ST" },
    ],
    "3-4-3": [
      { id:"gk",  x:50, y:90, pos:"GK" },
      { id:"rcb", x:68, y:72, pos:"CB" }, { id:"cb",  x:50, y:72, pos:"CB" },
      { id:"lcb", x:32, y:72, pos:"CB" },
      { id:"rm",  x:78, y:52, pos:"RM" }, { id:"rcm", x:60, y:52, pos:"CM" },
      { id:"lcm", x:40, y:52, pos:"CM" }, { id:"lm",  x:22, y:52, pos:"LM" },
      { id:"rw",  x:72, y:22, pos:"RW" }, { id:"st",  x:50, y:16, pos:"ST" },
      { id:"lw",  x:28, y:22, pos:"LW" },
    ],
    "5-3-2": [
      { id:"gk",  x:50, y:90, pos:"GK" },
      { id:"rwb", x:84, y:72, pos:"RWB"}, { id:"rcb", x:67, y:74, pos:"CB" },
      { id:"cb",  x:50, y:76, pos:"CB" }, { id:"lcb", x:33, y:74, pos:"CB" },
      { id:"lwb", x:16, y:72, pos:"LWB"},
      { id:"rcm", x:65, y:50, pos:"CM" }, { id:"cm",  x:50, y:50, pos:"CM" },
      { id:"lcm", x:35, y:50, pos:"CM" },
      { id:"rs",  x:62, y:22, pos:"ST" }, { id:"ls",  x:38, y:22, pos:"ST" },
    ],
    "5-4-1": [
      { id:"gk",  x:50, y:90, pos:"GK" },
      { id:"rwb", x:84, y:72, pos:"RWB"}, { id:"rcb", x:67, y:74, pos:"CB" },
      { id:"cb",  x:50, y:76, pos:"CB" }, { id:"lcb", x:33, y:74, pos:"CB" },
      { id:"lwb", x:16, y:72, pos:"LWB"},
      { id:"rm",  x:78, y:50, pos:"RM" }, { id:"rcm", x:60, y:50, pos:"CM" },
      { id:"lcm", x:40, y:50, pos:"CM" }, { id:"lm",  x:22, y:50, pos:"LM" },
      { id:"st",  x:50, y:20, pos:"ST" },
    ],
    "4-1-4-1": [
      { id:"gk",  x:50, y:90, pos:"GK" },
      { id:"rb",  x:80, y:74, pos:"RB" }, { id:"rcb", x:62, y:74, pos:"CB" },
      { id:"lcb", x:38, y:74, pos:"CB" }, { id:"lb",  x:20, y:74, pos:"LB" },
      { id:"dm",  x:50, y:60, pos:"DM" },
      { id:"rm",  x:80, y:44, pos:"RM" }, { id:"rcm", x:62, y:44, pos:"CM" },
      { id:"lcm", x:38, y:44, pos:"CM" }, { id:"lm",  x:20, y:44, pos:"LM" },
      { id:"st",  x:50, y:20, pos:"ST" },
    ],
  },
  7: {
    "3-2-1": [
      { id:"gk", x:50, y:88, pos:"GK" },
      { id:"rb", x:72, y:70, pos:"RB" }, { id:"cb", x:50, y:70, pos:"CB" },
      { id:"lb", x:28, y:70, pos:"LB" },
      { id:"rm", x:68, y:48, pos:"CM" }, { id:"lm", x:32, y:48, pos:"CM" },
      { id:"st", x:50, y:22, pos:"ST" },
    ],
    "2-3-1": [
      { id:"gk",  x:50, y:88, pos:"GK" },
      { id:"rcb", x:65, y:72, pos:"CB" }, { id:"lcb", x:35, y:72, pos:"CB" },
      { id:"rm",  x:75, y:50, pos:"RM" }, { id:"cm",  x:50, y:50, pos:"CM" },
      { id:"lm",  x:25, y:50, pos:"LM" },
      { id:"st",  x:50, y:22, pos:"ST" },
    ],
    "2-2-2": [
      { id:"gk",  x:50, y:88, pos:"GK" },
      { id:"rcb", x:65, y:72, pos:"CB" }, { id:"lcb", x:35, y:72, pos:"CB" },
      { id:"rcm", x:65, y:52, pos:"CM" }, { id:"lcm", x:35, y:52, pos:"CM" },
      { id:"rs",  x:65, y:22, pos:"ST" }, { id:"ls",  x:35, y:22, pos:"ST" },
    ],
    "3-1-2": [
      { id:"gk", x:50, y:88, pos:"GK" },
      { id:"rb", x:72, y:70, pos:"RB" }, { id:"cb", x:50, y:70, pos:"CB" },
      { id:"lb", x:28, y:70, pos:"LB" },
      { id:"cm", x:50, y:50, pos:"CM" },
      { id:"rs", x:65, y:22, pos:"ST" }, { id:"ls", x:35, y:22, pos:"ST" },
    ],
    "1-3-2": [
      { id:"gk",  x:50, y:88, pos:"GK" },
      { id:"cb",  x:50, y:72, pos:"CB" },
      { id:"rm",  x:75, y:52, pos:"RM" }, { id:"cm",  x:50, y:52, pos:"CM" },
      { id:"lm",  x:25, y:52, pos:"LM" },
      { id:"rs",  x:65, y:22, pos:"ST" }, { id:"ls",  x:35, y:22, pos:"ST" },
    ],
  },
  5: {
    "1-2-1": [
      { id:"gk",  x:50, y:88, pos:"GK" },
      { id:"rcb", x:65, y:68, pos:"CB" }, { id:"lcb", x:35, y:68, pos:"CB" },
      { id:"cm",  x:50, y:46, pos:"CM" },
      { id:"st",  x:50, y:22, pos:"ST" },
    ],
    "2-1-1": [
      { id:"gk", x:50, y:88, pos:"GK" },
      { id:"rd", x:67, y:70, pos:"CB" }, { id:"ld", x:33, y:70, pos:"CB" },
      { id:"cm", x:50, y:50, pos:"CM" },
      { id:"st", x:50, y:22, pos:"ST" },
    ],
    "1-1-2": [
      { id:"gk", x:50, y:88, pos:"GK" },
      { id:"cb", x:50, y:70, pos:"CB" },
      { id:"cm", x:50, y:50, pos:"CM" },
      { id:"rs", x:67, y:22, pos:"ST" }, { id:"ls", x:33, y:22, pos:"ST" },
    ],
    "2-2": [
      { id:"gk",  x:50, y:88, pos:"GK" },
      { id:"rd",  x:67, y:68, pos:"CB" }, { id:"ld",  x:33, y:68, pos:"CB" },
      { id:"ram", x:67, y:32, pos:"AM" }, { id:"lam", x:33, y:32, pos:"AM" },
    ],
  },
};

const FORMAT_DEFAULTS = { 11:"4-4-2", 7:"3-2-1", 5:"1-2-1" };

// Mirror formation for opposition (flip y: 100 - y, remap to top half)
function mirrorFormation(players) {
  return players.map((p, i) => ({
    ...p,
    id: `opp-${p.id}`,
    x: p.x,
    y: 100 - p.y,
  }));
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function hexToRgb(hex) {
  return { r:parseInt(hex.slice(1,3),16), g:parseInt(hex.slice(3,5),16), b:parseInt(hex.slice(5,7),16) };
}
function contrastColor(hex) {
  const {r,g,b} = hexToRgb(hex);
  return (0.299*r+0.587*g+0.114*b) > 150 ? "#111" : "#fff";
}

// ─── Inline name editor ───────────────────────────────────────────────────────
function InlineEdit({ value, onChange, placeholder, textStyle={}, className="" }) {
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState(value);
  const ref = useRef(null);
  function open(e) { e.stopPropagation(); setDraft(value); setEditing(true); setTimeout(()=>ref.current?.select(),0); }
  function commit() { setEditing(false); onChange(draft); }
  if (editing) return (
    <input ref={ref} autoFocus
      className="text-center text-[10px] font-bold bg-white text-gray-900 rounded px-1 outline-none border-2 border-yellow-400 shadow-xl"
      style={{width:72,zIndex:60,position:"relative"}}
      value={draft} onChange={e=>setDraft(e.target.value)}
      onBlur={commit} onKeyDown={e=>{if(e.key==="Enter")commit();if(e.key==="Escape")setEditing(false);}}
      onClick={e=>e.stopPropagation()} />
  );
  return (
    <span onClick={open}
      className={`cursor-pointer select-none text-center block truncate leading-tight ${className}`}
      style={{maxWidth:76,...textStyle}} title="Tap to edit">
      {value||<span style={{opacity:0.38}}>{placeholder}</span>}
    </span>
  );
}

// ─── Home player spot ─────────────────────────────────────────────────────────
function PlayerSpot({ player, subName, jerseyColor, onStarterChange, onSubChange, onDragStart, locked }) {
  const fg = contrastColor(jerseyColor);
  return (
    <div className="absolute flex flex-col items-center select-none"
      style={{left:`${player.x}%`,top:`${player.y}%`,transform:"translate(-50%,-50%)",zIndex:20,cursor:locked?"crosshair":"grab",gap:1}}
      draggable={!locked} onDragStart={e=>!locked&&onDragStart(e,player.id)}>
      <div className="rounded-full flex items-center justify-center font-black shadow-xl border-2 border-white/60"
        style={{width:40,height:40,flexShrink:0,background:jerseyColor,color:fg,fontSize:11}}>
        {player.pos}
      </div>
      <InlineEdit value={player.name} onChange={onStarterChange} placeholder="Starter"
        className="text-[13px] font-bold text-white"
        textStyle={{textShadow:"0 1px 6px rgba(0,0,0,1)",fontWeight:700}} />
      <InlineEdit value={subName} onChange={onSubChange} placeholder="+ sub"
        className="text-[12px] font-medium"
        textStyle={{textShadow:"0 1px 5px rgba(0,0,0,0.95)",color:"#fde047",opacity:0.85,fontStyle:"italic"}} />
    </div>
  );
}

// ─── Opposition player spot ───────────────────────────────────────────────────
function OppSpot({ player, color, onDragStart, locked }) {
  return (
    <div className="absolute flex flex-col items-center select-none"
      style={{left:`${player.x}%`,top:`${player.y}%`,transform:"translate(-50%,-50%)",zIndex:19,cursor:locked?"crosshair":"grab",gap:2}}
      draggable={!locked} onDragStart={e=>!locked&&onDragStart(e,player.id)}>
      <div className="rounded-full flex items-center justify-center font-black border-2 shadow-lg"
        style={{width:40,height:40,flexShrink:0,background:"rgba(0,0,0,0.35)",borderColor:color,color:color,fontSize:16,opacity:0.85}}>
        ✕
      </div>
    </div>
  );
}

// ─── Pitch lines ──────────────────────────────────────────────────────────────
function PitchLines() {
  const s = "rgba(255,255,255,0.42)";
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 160" preserveAspectRatio="none">
      <rect x="3" y="3" width="94" height="154" rx="2" fill="none" stroke={s} strokeWidth="0.8"/>
      <line x1="3" y1="80" x2="97" y2="80" stroke={s} strokeWidth="0.6"/>
      <circle cx="50" cy="80" r="14" fill="none" stroke={s} strokeWidth="0.6"/>
      <circle cx="50" cy="80" r="0.8" fill={s}/>
      <rect x="23" y="3"    width="54" height="22" fill="none" stroke={s} strokeWidth="0.6"/>
      <rect x="35" y="3"    width="30" height="9"  fill="none" stroke={s} strokeWidth="0.6"/>
      <rect x="40" y="0.5"  width="20" height="4"  fill="none" stroke={s} strokeWidth="0.8"/>
      <rect x="23" y="135"  width="54" height="22" fill="none" stroke={s} strokeWidth="0.6"/>
      <rect x="35" y="148"  width="30" height="9"  fill="none" stroke={s} strokeWidth="0.6"/>
      <rect x="40" y="155.5" width="20" height="4" fill="none" stroke={s} strokeWidth="0.8"/>
      {[[3,3],[97,3],[3,157],[97,157]].map(([cx,cy],i)=>(
        <path key={i} d={`M${cx+(cx<50?3:-3)} ${cy} Q${cx} ${cy} ${cx} ${cy+(cy<80?3:-3)}`} fill="none" stroke={s} strokeWidth="0.6"/>
      ))}
      {[0,1,2,3,4,5,6].map(i=>(
        <rect key={i} x="3" y={3+i*22} width="94" height="11" fill={i%2===0?"rgba(0,0,0,0.05)":"rgba(0,0,0,0)"}/>
      ))}
    </svg>
  );
}

// ─── Soccer ball — uses native emoji for perfect rendering ───────────────────
function SoccerBall({ size = 24 }) {
  return (
    <span
      style={{
        fontSize: size,
        lineHeight: 1,
        display: "inline-block",
        userSelect: "none",
      }}
      role="img"
      aria-label="soccer ball"
    >
      ⚽
    </span>
  );
}

// ─── Drawing canvas ───────────────────────────────────────────────────────────
function DrawingCanvas({ strokes, currentStroke, active, onStrokeStart, onStrokeMove, onStrokeEnd }) {
  const canvasRef = useRef(null);

  function drawArrow(ctx, points, color, dashed) {
    if (points.length < 2) return;
    ctx.strokeStyle = color; ctx.fillStyle = color;
    ctx.lineWidth = 2.5; ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.setLineDash(dashed ? [7,5] : []);
    ctx.moveTo(points[0].x, points[0].y);
    points.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
    ctx.stroke(); ctx.setLineDash([]);
    const last = points[points.length-1];
    const prev = points[Math.max(0,points.length-5)];
    const angle = Math.atan2(last.y-prev.y, last.x-prev.x);
    const sz = 11;
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(last.x - sz*Math.cos(angle-Math.PI/6), last.y - sz*Math.sin(angle-Math.PI/6));
    ctx.lineTo(last.x - sz*Math.cos(angle+Math.PI/6), last.y - sz*Math.sin(angle+Math.PI/6));
    ctx.closePath(); ctx.fill();
  }

  useEffect(()=>{
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0,0,canvas.width,canvas.height);
    strokes.forEach(s=>drawArrow(ctx,s.points,s.color,s.dashed));
    if (currentStroke?.points?.length>1) drawArrow(ctx,currentStroke.points,currentStroke.color,currentStroke.dashed);
  },[strokes,currentStroke]);

  function getPos(e, canvas) {
    const rect = canvas.getBoundingClientRect();
    const sx = canvas.width/rect.width, sy = canvas.height/rect.height;
    const src = e.touches ? e.touches[0] : e;
    return { x:(src.clientX-rect.left)*sx, y:(src.clientY-rect.top)*sy };
  }
  const start = e=>{if(!active)return;e.preventDefault();onStrokeStart(getPos(e,canvasRef.current));};
  const move  = e=>{if(!active)return;e.preventDefault();onStrokeMove(getPos(e,canvasRef.current));};
  const end   = e=>{if(!active)return;onStrokeEnd();};

  return (
    <canvas ref={canvasRef} width={420} height={630}
      className="absolute inset-0 w-full h-full rounded-2xl"
      style={{zIndex:active?30:0,cursor:active?"crosshair":"default",touchAction:"none",pointerEvents:active?"all":"none"}}
      onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end}
      onTouchStart={start} onTouchMove={move} onTouchEnd={end}/>
  );
}

// ─── Color swatch ─────────────────────────────────────────────────────────────
const JERSEY_PRESETS = ["#e63946","#e07b1a","#f7c948","#4caf50","#2196f3","#9c27b0","#ffffff","#cccccc","#888888","#333333","#111111","#1a237e","#b71c1c","#004d00","#ff6f91"];
const PITCH_PRESETS  = ["#2d7a3a","#1a5c2e","#3d8b40","#7ec8a0","#4fc3f7","#1a4a6e","#3a3a3a","#555555","#8d6e63","#bf360c","#1b5e20","#0d47a1","#4a148c","#212121","#37474f"];
const PEN_PRESETS    = ["#ffffff","#ff3b3b","#fde047","#38bdf8","#4ade80","#fb923c","#f472b6","#a78bfa","#000000","#00ffff","#ff6600","#ccff00","#ff00ff","#0000ff","#ff99aa"];

function ColorSwatch({ label, value, onChange, presets, size=7 }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(()=>{
    if (!open) return;
    const h = e=>{ if(ref.current&&!ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown",h);
    return ()=>document.removeEventListener("mousedown",h);
  },[open]);
  return (
    <div className="flex flex-col items-start gap-0.5 relative" ref={ref}>
      {label && <span className="text-[9px] font-bold tracking-widest uppercase text-gray-400" style={{letterSpacing:1.5,fontFamily:"system-ui"}}>{label}</span>}
      <button className={`w-${size} h-${size} rounded-full border-2 shadow-md transition-all hover:scale-110`}
        style={{background:value,borderColor:open?"#facc15":"rgba(255,255,255,0.25)",width:`${size*4}px`,height:`${size*4}px`}}
        onClick={e=>{e.stopPropagation();setOpen(o=>!o);}} title={label?`Change ${label} color`:"Change color"}/>
      {open&&(
        <div className="absolute top-full left-0 mt-2 z-50 p-2 rounded-xl shadow-2xl border border-white/10"
          style={{background:"#1f2937",minWidth:132}} onClick={e=>e.stopPropagation()}>
          <div className="grid gap-1.5" style={{gridTemplateColumns:"repeat(5,1fr)"}}>
            {presets.map(c=>(
              <button key={c} onClick={()=>{onChange(c);setOpen(false);}}
                className="rounded-full border-2 transition-all hover:scale-110"
                style={{width:20,height:20,background:c,borderColor:value===c?"#facc15":"rgba(255,255,255,0.15)"}}/>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Playmaker toolbar ────────────────────────────────────────────────────────
function PlaymakerToolbar({ activePen, setActivePen, runColor, setRunColor, passColor, setPassColor,
  onUndo, onEraseAll, ballMode, setBallMode, ballPos }) {
  const base    = "flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-xl border text-[11px] font-bold transition-all select-none";
  const active  = "border-yellow-400 bg-yellow-400/10 text-yellow-300";
  const inactive= "border-white/10 bg-white/5 text-gray-400 hover:border-white/30 hover:text-white";
  const ballAct = "border-white bg-white/10 text-white";
  return (
    <div className="flex items-end justify-center gap-2 flex-wrap" style={{fontFamily:"system-ui"}}>
      {/* Run */}
      <button className={`${base} ${activePen==="run"?active:inactive}`}
        onClick={()=>{setActivePen(p=>p==="run"?null:"run");setBallMode(false);}}>
        <span className="text-sm leading-none">🏃</span><span>Run</span>
      </button>
      <ColorSwatch label="Run" value={runColor} onChange={setRunColor} presets={PEN_PRESETS} size={6}/>

      <div className="w-px h-8 bg-white/10 self-center"/>

      {/* Pass */}
      <button className={`${base} ${activePen==="pass"?active:inactive}`}
        onClick={()=>{setActivePen(p=>p==="pass"?null:"pass");setBallMode(false);}}>
        <span className="text-sm leading-none">🦶</span><span>Pass</span>
      </button>
      <ColorSwatch label="Pass" value={passColor} onChange={setPassColor} presets={PEN_PRESETS} size={6}/>

      <div className="w-px h-8 bg-white/10 self-center"/>

      {/* Ball */}
      <button className={`${base} ${ballMode?ballAct:inactive}`}
        onClick={()=>{setBallMode(b=>!b);setActivePen(null);}}>
        <SoccerBall size={20}/>
        <span>Ball</span>
      </button>

      <div className="w-px h-8 bg-white/10 self-center"/>

      {/* Undo / Clear */}
      <button className={`${base} ${inactive}`} onClick={onUndo}><span className="text-sm">↩️</span><span>Undo</span></button>
      <button className={`${base} ${inactive}`} onClick={onEraseAll}><span className="text-sm">🗑️</span><span>Clear</span></button>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [format,        setFormat]        = useState(11);
  const [formation,     setFormation]     = useState("4-4-2");
  const [pitchColor,    setPitchColor]    = useState("#2d7a3a");
  const [jerseyColor,   setJerseyColor]   = useState("#e63946");
  const [teamName,      setTeamName]      = useState("My Team FC");
  const [players,       setPlayers]       = useState(()=>initPlayers(11,"4-4-2"));
  const [subs,          setSubs]          = useState(()=>initSubs(FORMATIONS[11]["4-4-2"].length));
  const [dragging,      setDragging]      = useState(null);
  const [exporting,     setExporting]     = useState(false);

  // Playmaker
  const [playmakeOn,    setPlaymakeOn]    = useState(false);
  const [activePen,     setActivePen]     = useState(null);
  const [runColor,      setRunColor]      = useState("#39ff14");
  const [passColor,     setPassColor]     = useState("#ffff00");
  const [strokes,       setStrokes]       = useState([]);
  const [currentStroke, setCurrentStroke] = useState(null);
  const [ballPos,       setBallPos]       = useState(null);
  const [ballMode,      setBallMode]      = useState(false);
  const isDrawing = useRef(false);

  // Opposition
  const [showOpp,       setShowOpp]       = useState(false);
  const [oppFormation,  setOppFormation]  = useState("4-4-2");
  const [oppColor,      setOppColor]      = useState("#3b82f6");
  const [oppPlayers,    setOppPlayers]    = useState([]);
  const [draggingOpp,   setDraggingOpp]   = useState(null);

  const pitchRef  = useRef(null);
  const exportRef = useRef(null);

  function initPlayers(fmt, form) { return FORMATIONS[fmt][form].map(p=>({...p,name:""})); }
  function initSubs(count)        { return Array.from({length:count},()=>""); }
  function initOpp(fmt, form)     { return mirrorFormation(FORMATIONS[fmt][form]); }

  function handleFormat(f) {
    const def = FORMAT_DEFAULTS[f];
    setFormat(f); setFormation(def);
    setPlayers(initPlayers(f,def));
    setSubs(initSubs(FORMATIONS[f][def].length));
    if (showOpp) { setOppFormation(def); setOppPlayers(initOpp(f,def)); }
  }
  function handleFormation(f) {
    setFormation(f);
    const tpl = FORMATIONS[format][f];
    setPlayers(tpl.map((t,i)=>({...t,name:players[i]?.name||""})));
    setSubs(prev=>tpl.map((_,i)=>prev[i]??""));
  }
  function handleOppFormation(f) {
    setOppFormation(f);
    setOppPlayers(initOpp(format, f));
  }
  function handleToggleOpp() {
    if (!showOpp) { setOppPlayers(initOpp(format, oppFormation)); }
    setShowOpp(o=>!o);
  }

  // Home drag
  function handleDragStart(e,id)  { setDragging(id); e.dataTransfer.effectAllowed="move"; }
  function handleDrop(e) {
    e.preventDefault();
    const target = dragging || draggingOpp;
    if (!target || !pitchRef.current) return;
    const rect = pitchRef.current.getBoundingClientRect();
    const x = Math.max(4,Math.min(96,((e.clientX-rect.left)/rect.width)*100));
    const y = Math.max(4,Math.min(96,((e.clientY-rect.top)/rect.height)*100));
    if (dragging)    { setPlayers(prev=>prev.map(p=>p.id===dragging?{...p,x,y}:p));       setDragging(null); }
    if (draggingOpp) { setOppPlayers(prev=>prev.map(p=>p.id===draggingOpp?{...p,x,y}:p)); setDraggingOpp(null); }
  }
  function handleOppDragStart(e,id) { setDraggingOpp(id); e.dataTransfer.effectAllowed="move"; }

  // Drawing
  function onStrokeStart(pos) {
    isDrawing.current=true;
    const color = activePen==="run" ? runColor : passColor;
    setCurrentStroke({points:[pos],color,dashed:activePen==="pass"});
  }
  function onStrokeMove(pos) {
    if (!isDrawing.current) return;
    setCurrentStroke(prev=>prev?{...prev,points:[...prev.points,pos]}:null);
  }
  function onStrokeEnd() {
    if (!isDrawing.current) return;
    isDrawing.current=false;
    setCurrentStroke(prev=>{
      if(prev&&prev.points.length>1) setStrokes(s=>[...s,prev]);
      return null;
    });
  }
  function handleUndo()     { setStrokes(prev=>prev.slice(0,-1)); }
  function handleEraseAll() { setStrokes([]); setCurrentStroke(null); setBallPos(null); }

  async function handleExport() {
    if (!exportRef.current) return;
    setExporting(true);
    try {
      const html2canvas = (await import("https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.esm.js")).default;
      const canvas = await html2canvas(exportRef.current,{backgroundColor:"#030712",scale:2,useCORS:true,logging:false});
      const link = document.createElement("a");
      link.download = `${(teamName||"StrategyFC").replace(/\s+/g,"_")}_${formation}.png`;
      link.href = canvas.toDataURL("image/png"); link.click();
    } catch { alert("Export failed — try a screenshot instead."); }
    finally { setExporting(false); }
  }

  const pitchBg     = `radial-gradient(ellipse at 50% 35%, ${pitchColor}f2, ${pitchColor}bb 65%, #122018)`;
  const accentFg    = contrastColor(jerseyColor);
  const anyActive   = activePen !== null || ballMode;
  const availForms  = Object.keys(FORMATIONS[format]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-950 text-white" style={{fontFamily:"'Bebas Neue','Impact',sans-serif"}}>

      {/* ── Header ── */}
      <header className="shrink-0 bg-gray-900 border-b border-white/5 shadow-lg" style={{fontFamily:"system-ui"}}>
        <div className="flex flex-col items-center gap-2 px-3 pt-3 pb-3">

          {/* Logo */}
          <div className="flex items-center gap-1.5">
            <span className="text-lg">⚽</span>
            <span className="text-sm font-black tracking-[3px] text-white" style={{fontFamily:"'Bebas Neue','Impact',sans-serif"}}>STRATEGY FC</span>
          </div>

          {/* Line 1: Team Name */}
          <div className="flex flex-col items-center gap-0.5 w-full max-w-[200px]">
            <span className="text-[9px] font-bold tracking-widest uppercase text-gray-400" style={{letterSpacing:1.5}}>Team Name</span>
            <input
              className="bg-gray-800 border border-gray-700 rounded-md px-2 py-1 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-yellow-400 text-center w-full"
              placeholder="Team name…" value={teamName} onChange={e=>setTeamName(e.target.value)}/>
          </div>

          {/* Line 2: Jersey + Pitch */}
          <div className="flex items-center justify-center gap-5">
            <ColorSwatch label="Jersey" value={jerseyColor} onChange={setJerseyColor} presets={JERSEY_PRESETS}/>
            <ColorSwatch label="Pitch"  value={pitchColor}  onChange={setPitchColor}  presets={PITCH_PRESETS}/>
          </div>

          {/* Line 3: Format */}
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[9px] font-bold tracking-widest uppercase text-gray-400" style={{letterSpacing:1.5}}>Players</span>
            <div className="flex gap-1.5 justify-center">
              {[5,7,11].map(f=>(
                <button key={f} onClick={()=>handleFormat(f)}
                  className="px-3 py-1 rounded text-xs font-bold transition-all"
                  style={format===f?{background:jerseyColor,color:accentFg}:{background:"#374151",color:"#9ca3af"}}
                >{f}v{f}</button>
              ))}
            </div>
          </div>

          {/* Line 4: Formation */}
          <div className="flex flex-col items-center gap-0.5 w-full">
            <span className="text-[9px] font-bold tracking-widest uppercase text-gray-400" style={{letterSpacing:1.5}}>Formation</span>
            <div className="flex gap-1.5 flex-wrap justify-center">
              {availForms.map(f=>(
                <button key={f} onClick={()=>handleFormation(f)}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold transition-all"
                  style={formation===f?{background:jerseyColor,color:accentFg}:{background:"#1f2937",color:"#d1d5db",border:"1px solid #374151"}}
                >{f}</button>
              ))}
            </div>
          </div>

        </div>
      </header>

      {/* ── Main ── */}
      <main className="flex-1 flex flex-col items-center py-4 px-3 gap-4 overflow-y-auto">

        {/* Export zone */}
        <div ref={exportRef} className="flex flex-col items-center gap-3 px-4 pt-4 pb-5 rounded-2xl" style={{background:"#030712"}}>
          <div className="text-center leading-none">
            <div className="text-3xl sm:text-4xl tracking-widest" style={{textShadow:`0 2px 20px ${jerseyColor}99`}}>
              {teamName||"MY TEAM FC"}
            </div>
            <div className="text-[10px] tracking-[4px] text-gray-500 mt-0.5" style={{fontFamily:"system-ui"}}>
              {format}v{format} · {formation}
            </div>
          </div>

          {/* Pitch */}
          <div ref={pitchRef} className="relative rounded-2xl shadow-2xl"
            style={{width:"min(420px,88vw)",aspectRatio:"2/3",background:pitchBg,
              boxShadow:`0 0 60px ${pitchColor}50, 0 20px 60px rgba(0,0,0,0.7)`,overflow:"hidden"}}
            onDragOver={e=>e.preventDefault()}
            onDrop={handleDrop}
            onClick={e=>{
              if (!ballMode||!pitchRef.current) return;
              const rect = pitchRef.current.getBoundingClientRect();
              setBallPos({
                x:Math.max(2,Math.min(98,((e.clientX-rect.left)/rect.width)*100)),
                y:Math.max(2,Math.min(98,((e.clientY-rect.top)/rect.height)*100)),
              });
              setBallMode(false);
            }}
          >
            <div className="absolute inset-0 rounded-2xl overflow-hidden"><PitchLines/></div>

            <DrawingCanvas strokes={strokes} currentStroke={currentStroke}
              active={activePen!==null} onStrokeStart={onStrokeStart}
              onStrokeMove={onStrokeMove} onStrokeEnd={onStrokeEnd}/>

            {/* Opposition players */}
            {showOpp && (
              <div className="absolute inset-0" style={{pointerEvents:anyActive?"none":"auto"}}>
                {oppPlayers.map(p=>(
                  <OppSpot key={p.id} player={p} color={oppColor} locked={anyActive}
                    onDragStart={handleOppDragStart}/>
                ))}
              </div>
            )}

            {/* Home players */}
            <div className="absolute inset-0" style={{pointerEvents:anyActive?"none":"auto"}}>
              {players.map((p,i)=>(
                <PlayerSpot key={p.id} player={p} subName={subs[i]??""} jerseyColor={jerseyColor} locked={anyActive}
                  onStarterChange={name=>setPlayers(prev=>prev.map(q=>q.id===p.id?{...q,name}:q))}
                  onSubChange={name=>setSubs(prev=>prev.map((s,si)=>si===i?name:s))}
                  onDragStart={handleDragStart}/>
              ))}
            </div>

            {/* Ball */}
            {ballPos&&(
              <div className="absolute select-none"
                style={{left:`${ballPos.x}%`,top:`${ballPos.y}%`,transform:"translate(-50%,-50%)",zIndex:25,cursor:"pointer"}}
                onClick={e=>{e.stopPropagation();setBallPos(null);}} title="Click to remove">
                <div style={{filter:"drop-shadow(0 2px 6px rgba(0,0,0,0.9))"}}>
                  <SoccerBall size={26}/>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Playmaker section ── */}
        <div className="w-full max-w-[420px] rounded-2xl border border-white/8 overflow-hidden" style={{background:"#0f172a"}}>
          <button className="w-full flex items-center justify-between px-4 py-2.5 border-b border-white/5 transition-all hover:bg-white/5"
            onClick={()=>{ setPlaymakeOn(o=>!o); if(playmakeOn){setActivePen(null);setBallMode(false);} }}
            style={{fontFamily:"system-ui"}}>
            <span className="text-[9px] font-bold tracking-[3px] uppercase text-gray-400">🖊 Playmaker</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-all ${playmakeOn?"bg-yellow-400 text-gray-900":"bg-gray-700 text-gray-400"}`}>
              {playmakeOn?"ON":"OFF"}
            </span>
          </button>
          {playmakeOn&&(
            <>
              {(activePen||ballMode)&&(
                <div className="px-4 py-1.5 border-b border-white/5 text-[10px] font-bold tracking-widest uppercase text-yellow-400" style={{fontFamily:"system-ui"}}>
                  {ballMode?"⚽ Ball mode — tap pitch to place":activePen==="run"?"🏃 Run mode — draw on pitch":"🦶 Pass mode — draw on pitch"}
                </div>
              )}
              <div className="px-4 py-3">
                <PlaymakerToolbar activePen={activePen} setActivePen={setActivePen}
                  runColor={runColor} setRunColor={setRunColor}
                  passColor={passColor} setPassColor={setPassColor}
                  onUndo={handleUndo} onEraseAll={handleEraseAll}
                  ballMode={ballMode} setBallMode={setBallMode} ballPos={ballPos}/>
              </div>
            </>
          )}
        </div>

        {/* ── Opposition section ── */}
        <div className="w-full max-w-[420px] rounded-2xl border border-white/8 overflow-hidden" style={{background:"#0f172a"}}>
          <button className="w-full flex items-center justify-between px-4 py-2.5 border-b border-white/5 transition-all hover:bg-white/5"
            onClick={handleToggleOpp} style={{fontFamily:"system-ui"}}>
            <span className="text-[9px] font-bold tracking-[3px] uppercase text-gray-400">✕ Opposition</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-all ${showOpp?"bg-blue-400 text-gray-900":"bg-gray-700 text-gray-400"}`}>
              {showOpp?"ON":"OFF"}
            </span>
          </button>
          {showOpp&&(
            <div className="px-4 py-3 flex flex-col gap-3" style={{fontFamily:"system-ui"}}>
              <div className="flex items-center gap-4 flex-wrap">
                <ColorSwatch label="Opp Color" value={oppColor} onChange={setOppColor} presets={JERSEY_PRESETS}/>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] font-bold tracking-widest uppercase text-gray-400" style={{letterSpacing:1.5}}>Opp Formation</span>
                  <div className="flex gap-1.5 flex-wrap">
                    {availForms.map(f=>(
                      <button key={f} onClick={()=>handleOppFormation(f)}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold transition-all"
                        style={oppFormation===f?{background:oppColor,color:contrastColor(oppColor)}:{background:"#1f2937",color:"#d1d5db",border:"1px solid #374151"}}
                      >{f}</button>
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-gray-600">Opposition shown as ✕ markers · drag to reposition</p>
            </div>
          )}
        </div>

        {/* Download */}
        <button onClick={handleExport} disabled={exporting}
          className="flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold tracking-wide shadow-lg transition-all hover:opacity-90 active:scale-95"
          style={{background:exporting?"#374151":jerseyColor,color:exporting?"#9ca3af":accentFg,
            fontFamily:"system-ui",boxShadow:exporting?"none":`0 4px 20px ${jerseyColor}55`}}>
          {exporting?"⏳ Saving…":"📥 Download"}
        </button>

        <p className="text-[10px] text-gray-700 pb-2" style={{fontFamily:"system-ui"}}>
          Tap name to edit · Tap <span style={{color:"#fde047"}}>+ sub</span> to assign substitute · Drag to reposition
        </p>
      </main>
    </div>
  );
}
