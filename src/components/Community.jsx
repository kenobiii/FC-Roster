// ─── Community components ────────────────────────────────────────────────────
import React, { useState, useEffect, useRef, useMemo, useCallback, memo } from "react";
import { GLASS, BRAND, CLS_HDR, CLS_BADGE, CLS_CARD, CLS_ROW } from "../tokens.js";
import { sb }                                                     from "../supabase.js";
import { track }                                                   from "../helpers.js";
import { COMMUNITY_TAGS, COMMUNITY_TAG_COLORS,
         REACTIONS, RED_CARD_MOD_THRESHOLD,
         PLAYER_CLASSES, COUNTRIES }                              from "../playerData.js";
import { FORMATION_POSTS }                                        from "../data.js";
import { AdBanner }                                               from "./Shared.jsx";

// ─── TagPill ──────────────────────────────────────────────────────────────────
function TagPill({ tag, small }) {
  const color = COMMUNITY_TAG_COLORS[tag] || "#64748b";
  return (
    <span style={{ background:`${color}22`, color, border:`1px solid ${color}44`,
      borderRadius:20, padding: small ? "1px 8px" : "3px 10px",
      fontSize: small ? 9 : 10, fontWeight:700, letterSpacing:1, whiteSpace:"nowrap" }}>
      {tag}
    </span>
  );
}

// ─── Reaction constants ───────────────────────────────────────────────────────
const REACTIONS = [
  { type:"handshake", emoji:"🤝", label:"Fair Play",  color:"#22c55e" },
  { type:"yellow_card", emoji:"🟨", label:"Caution",  color:"#f5c518" },
  { type:"red_card",    emoji:"🟥", label:"Red Card", color:"#dc2626" },
];
const RED_CARD_MOD_THRESHOLD = 5; // auto-flag threshold

// ─── ReactionBar ──────────────────────────────────────────────────────────────
function ReactionBar({ postId, session, onShowAuth, compact = false }) {
  const [counts,    setCounts]    = useState({});
  const [userTypes, setUserTypes] = useState([]); // types this user has already reacted with
  const debounceRef = useRef(null);

  useEffect(() => {
    sb.getReactions(postId).then(c => setCounts(c)).catch(() => {});
    if (session?.user?.id) {
      sb.getUserReactions(postId, session.user.id, session.token)
        .then(t => setUserTypes(t)).catch(() => {});
    }
  }, [postId, session]);

  function handleReact(type) {
    if (!session) { onShowAuth(); return; }
    const alreadyOn = userTypes.includes(type);

    // Optimistic update
    setCounts(prev => ({
      ...prev,
      [type]: Math.max(0, (prev[type] || 0) + (alreadyOn ? -1 : 1)),
    }));
    setUserTypes(prev =>
      alreadyOn ? prev.filter(t => t !== type) : [...prev, type]
    );

    // Debounce server call 300ms
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        await sb.toggleReaction(postId, type, session.user.id, session.token);
      } catch {
        // Revert optimistic update on failure
        setCounts(prev => ({
          ...prev,
          [type]: Math.max(0, (prev[type] || 0) + (alreadyOn ? 1 : -1)),
        }));
        setUserTypes(prev =>
          alreadyOn ? [...prev, type] : prev.filter(t => t !== type)
        );
      }
    }, 300);
  }

  const redCards  = counts.red_card || 0;
  const isFlagged = redCards >= RED_CARD_MOD_THRESHOLD;

  // Fair Play score
  const handshakes = counts.handshake || 0;
  const totalCards = (counts.red_card || 0) + (counts.yellow_card || 0);
  const total = handshakes + totalCards;
  const fairPlayPct = total > 0 ? Math.round((handshakes / total) * 100) : null;

  if (compact) {
    // Minimal version shown on PostCard
    const hasAny = Object.values(counts).some(v => v > 0);
    if (!hasAny) return null;
    return (
      <div className="flex items-center gap-2 mt-2">
        {REACTIONS.map(({ type, emoji }) => counts[type] > 0 && (
          <span key={type} className="flex items-center gap-0.5 text-[10px] font-bold" style={{ color:"#475569" }}>
            {emoji} {counts[type]}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="px-5 py-4" style={{ borderTop:"1px solid rgba(255,255,255,0.06)" }}>
      {isFlagged && (
        <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-xl"
          style={{ background:"rgba(220,38,38,0.1)", border:"1px solid rgba(220,38,38,0.25)" }}>
          <span style={{ fontSize:14 }}>🚩</span>
          <span className={CLS_BADGE} style={{ color:"#f87171" }}>
            This post has been flagged for moderator review
          </span>
        </div>
      )}
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-2">
          {REACTIONS.map(({ type, emoji, label, color }) => {
            const count   = counts[type] || 0;
            const isOn    = userTypes.includes(type);
            return (
              <button key={type}
                onClick={() => handleReact(type)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all hover:brightness-110 active:scale-95"
                style={{
                  background: isOn ? `${color}22` : GLASS.xs,
                  border: `1px solid ${isOn ? color : GLASS.lg}`,
                  color: isOn ? color : "#64748b",
                  cursor:"pointer",
                }}
                title={label}>
                <span style={{ fontSize:16, lineHeight:1 }}>{emoji}</span>
                {count > 0 && <span>{count}</span>}
              </button>
            );
          })}
        </div>
        {fairPlayPct !== null && (
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[9px] font-bold tracking-widest uppercase" style={{ color:"#475569" }}>Fair Play</span>
            <span className="text-xs font-black px-2 py-0.5 rounded-full"
              style={{
                background: fairPlayPct >= 70 ? "rgba(34,197,94,0.15)" : fairPlayPct >= 40 ? "rgba(245,197,24,0.15)" : "rgba(220,38,38,0.15)",
                color:      fairPlayPct >= 70 ? "#4ade80"                : fairPlayPct >= 40 ? BRAND.colors.yellow         : "#f87171",
              }}>
              {fairPlayPct}%
            </span>
          </div>
        )}
      </div>
      {!session && (
        <p className="text-[10px] mt-2" style={{ color:"#334155" }}>
          Sign in to react
        </p>
      )}
    </div>
  );
}

// ─── PostCard ─────────────────────────────────────────────────────────────────
function PostCard({ post, onOpen }) {
  return (
    <button onClick={() => onOpen(post)} className="w-full text-left rounded-2xl transition-all hover:brightness-110 active:scale-[0.99]"
      style={{ background:"#0f1b2d", border:`1px solid rgba(255,255,255,0.08)`, padding:"14px 16px" }}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <TagPill tag={post.tag || "General"}/>
            {post.source === "formation" && <span style={{ fontSize:9, color:"#475569", fontWeight:600, letterSpacing:1 }}>FORMATION GUIDE</span>}
          </div>
          <div className="font-bold text-sm leading-snug" style={{ color:"#f1f5f9", fontFamily: BRAND.fonts.body }}>{post.title}</div>
          <div className="text-xs leading-relaxed" style={{ color:"rgba(255,255,255,0.4)", overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>
            {post.why || post.body || ""}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <div className="flex items-center gap-1" style={{ color: post.commentCount > 0 ? BRAND.colors.yellow : "#475569" }}>
            <span style={{ fontSize:11 }}>💬</span>
            <span style={{ fontSize:11, fontWeight:700 }}>{post.commentCount || 0}</span>
          </div>
          <span style={{ fontSize:9, color:"#475569", whiteSpace:"nowrap" }}>{post.lastActivity || ""}</span>
        </div>
      </div>
      {post.source === "user" && (
        <ReactionBar postId={post.id} session={null} onShowAuth={() => {}} compact={true}/>
      )}
    </button>
  );
}

// ─── CommentComposer ─────────────────────────────────────────────────────────────
// memo() prevents re-renders from parent prop changes.
// onSubmitRef holds the latest onSubmit in a ref so that even if the parent
// passes a new function reference (e.g. after loadComments updates state),
// this component never re-renders — and the textarea never loses focus.
const CommentComposer = memo(function CommentComposer({ signedIn, username, postId, onSubmit, onShowAuth }) {
  const ref          = useRef(null);
  const busy         = useRef(false);
  const onSubmitRef  = useRef(onSubmit);   // ← always holds the latest onSubmit
  const [err,     setErr]     = useState("");
  const [loading, setLoading] = useState(false);

  // Keep the ref current on every render without triggering a re-render
  onSubmitRef.current = onSubmit;

  async function go() {
    const text = ref.current?.value?.trim();
    if (!text || busy.current) return;
    busy.current = true;
    setLoading(true); setErr("");
    try {
      await onSubmitRef.current(postId, text);   // ← call via ref, not prop
      if (ref.current) { ref.current.value = ""; ref.current.focus(); }
    } catch(e) {
      setErr("Failed to post — please try again.");
    } finally {
      busy.current = false;
      setLoading(false);
    }
  }

  if (!signedIn) {
    return (
      <div className="px-5 py-4 text-center" style={{ borderTop:`1px solid rgba(255,255,255,0.08)`, background:"rgba(255,255,255,0.02)" }}>
        <p className="text-xs mb-3" style={{ color:"#64748b", fontFamily:BRAND.fonts.body }}>Sign in to join the discussion</p>
        <button onClick={onShowAuth}
          className="px-5 py-2 rounded-xl text-xs font-black tracking-wide transition-all hover:brightness-110"
          style={{ background:BRAND.colors.yellow, color:"#111", fontFamily:BRAND.fonts.body, border:"none", cursor:"pointer" }}>
          Sign In / Create Account
        </button>
      </div>
    );
  }

  return (
    <div className="px-5 py-4" style={{ borderTop:`1px solid rgba(255,255,255,0.08)`, background:"rgba(255,255,255,0.02)" }}>
      <div className="text-xs font-bold mb-2" style={{ color:"#64748b" }}>
        Replying as <span style={{ color:"#94a3b8" }}>{username}</span>
      </div>
      <textarea
        ref={ref}
        id="comment-input"
        name="comment"
        rows={3}
        maxLength={1000} placeholder="Share your thoughts…"
        autoComplete="off"
        className="w-full rounded-xl px-3 py-2 mb-2 focus:outline-none resize-none"
        style={{ background:GLASS.sm, border:`1px solid rgba(255,255,255,0.1)`, color:"#f1f5f9", fontFamily:BRAND.fonts.body, fontSize:16 }}
        onKeyDown={e => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) go(); }}
        spellCheck={false}
        autoCorrect="off"
        autoCapitalize="off"
      />
      {err && <p className="text-xs mb-2" style={{ color:"#f87171" }}>{err}</p>}
      <button onClick={go} disabled={loading}
        className="px-5 py-2 rounded-xl text-xs font-black tracking-wide transition-all hover:brightness-110 active:scale-95"
        style={{ background:BRAND.colors.green, color:"#fff", fontFamily:BRAND.fonts.body, border:"none", cursor:"pointer" }}>
        {loading ? "Posting…" : "Post Reply"}
      </button>
    </div>
  );
}); // ← closes memo()

// ─── PostView ─────────────────────────────────────────────────────────────────
// memo() prevents re-renders when CommunityTab's other state (filter, draft,
// showNewPost, etc.) changes — PostView only re-renders when its own props change.
const PostView = memo(function PostView({ post, postComments, signedIn, username, onSubmit, onShowAuth, onBack, session }) {
  const [editingPost, setEditingPost] = React.useState(false);
  const [editTitle,   setEditTitle]   = React.useState(post.title || "");
  const [editBody,    setEditBody]    = React.useState(post.body || "");
  const [editSaving,  setEditSaving]  = React.useState(false);

  const isAuthor = session?.user?.id && session.user.id === post.user_id;
  const isDeleted = post.is_deleted;

  async function saveEdit() {
    if (!editTitle.trim() || !editBody.trim() || !session) return;
    setEditSaving(true);
    const now = new Date().toISOString();
    const ok = await sb.updatePost(post.id, {
      title: editTitle.trim(),
      body:  editBody.trim(),
      edited_at: now,
    }, session.token).catch(() => false);
    if (ok && onPostUpdated) {
      onPostUpdated({ ...post, title: editTitle.trim(), body: editBody.trim(), edited_at: now });
    }
    setEditingPost(false);
    setEditSaving(false);
  }

  async function confirmDelete() {
    if (!window.confirm("Delete this post? It will show as deleted but still count in the feed.")) return;
    const ok = await sb.deletePost(post.id, session.token).catch(() => false);
    if (ok && onPostDeleted) {
      onPostDeleted({ ...post, is_deleted: true, title: "[Deleted]", body: "[This post has been deleted]" });
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <button onClick={onBack} className="flex items-center gap-2 text-xs font-bold transition-opacity hover:opacity-70"
        style={{ color:"#64748b", background:"none", border:"none", cursor:"pointer", padding:0, fontFamily: BRAND.fonts.body }}>
        ← Back to Community
      </button>
      {/* Post body */}
      <div className="rounded-2xl p-5" style={{ background:"#0f1b2d", border:`1px solid rgba(255,255,255,0.1)` }}>
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <TagPill tag={post.tag || "General"}/>
          {post.source === "formation" && <span style={{ fontSize:9, color:"#475569", fontWeight:600, letterSpacing:1 }}>FORMATION GUIDE</span>}
        </div>
        <div className="font-black mb-1" style={{ fontFamily: BRAND.fonts.display, fontSize:"clamp(18px,5vw,26px)", color:"#fff", letterSpacing:0.5 }}>
          {post.title}
        </div>
        <div className="text-xs mb-4" style={{ color:"#475569" }}>
          {post.author_name && !post.is_deleted && (
            <span className="inline-flex items-center gap-1 flex-wrap">
              {post.author_avatar && <span style={{ fontSize:12 }}>{post.author_avatar}</span>}
              <span style={{ color:"#94a3b8" }}>{post.author_name}</span>
              {post.author_country && (() => {
                const flag = COUNTRIES.find(([n]) => n === post.author_country)?.[1];
                return flag ? <span style={{ fontSize:13 }}>{flag}</span> : null;
              })()}
              {post.player_class && (() => {
                const cls = PLAYER_CLASSES.find(c => c.name === post.player_class) ||
                            (post.player_class.startsWith("🦓") ? { emoji:"🦓", color:"#94a3b8" } :
                             post.player_class.startsWith("👀") ? { emoji:"👀", color:"#64748b" } : null);
                return cls ? (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                    style={{ background:`${cls.color}18`, color:cls.color, border:`1px solid ${cls.color}33` }}>
                    {cls.emoji}
                  </span>
                ) : null;
              })()}
              {post.edited_at && (
                <span className="text-[9px]" style={{ color:"#475569" }}>
                  · edited {new Date(post.edited_at).toLocaleDateString("en-GB",{day:"numeric",month:"short"})}
                </span>
              )}
              <span> · </span>
            </span>
          )}
          {post.created_at ? new Date(post.created_at).toLocaleDateString() : ""}
        </div>
        {post.source === "formation" && post.formation && (
          <div style={{ width:90, marginBottom:16 }}>
            <FormationDiagram formation={post.formation} format={post.tag==="11v11"?11:post.tag==="9v9"?9:post.tag==="7v7"?7:5}/>
          </div>
        )}
        {post.intro && <p className="text-sm leading-relaxed mb-3" style={{ color:"rgba(255,255,255,0.6)", fontStyle:"italic" }}>{post.intro}</p>}
        {post.why && <><div className="text-xs font-black tracking-widest uppercase mb-1" style={{ color: BRAND.colors.yellow }}>Why It Works</div>
          <p className="text-sm leading-relaxed mb-3" style={{ color:"rgba(255,255,255,0.75)" }}>{post.why}</p></>}
        {post.fundamentals && <><div className="text-xs font-black tracking-widest uppercase mb-1" style={{ color: BRAND.colors.green }}>Coaching Fundamentals</div>
          <p className="text-sm leading-relaxed" style={{ color:"rgba(255,255,255,0.75)" }}>{post.fundamentals}</p></>}
        {/* Body — edit form or display */}
        {post.body && !post.why && (
          editingPost ? (
            <div className="flex flex-col gap-2 mt-2">
              <input className="w-full rounded-xl px-3 py-2 font-bold focus:outline-none text-sm"
                style={{ background:GLASS.sm, border:`1px solid rgba(255,255,255,0.12)`, color:"#f1f5f9" }}
                value={editTitle} maxLength={120} onChange={e => setEditTitle(e.target.value)}/>
              <textarea rows={5} className="w-full rounded-xl px-3 py-2 focus:outline-none resize-none text-sm"
                style={{ background:GLASS.sm, border:`1px solid rgba(255,255,255,0.12)`, color:"#f1f5f9" }}
                value={editBody} maxLength={5000} onChange={e => setEditBody(e.target.value)}/>
              <div className="flex gap-2">
                <button onClick={saveEdit} disabled={editSaving}
                  className="px-4 py-1.5 rounded-lg text-xs font-black transition-all hover:brightness-110"
                  style={{ background:BRAND.colors.green, color:"#fff", border:"none", cursor:"pointer" }}>
                  {editSaving ? "Saving…" : "✓ Save"}
                </button>
                <button onClick={() => setEditingPost(false)}
                  className="px-4 py-1.5 rounded-lg text-xs font-bold"
                  style={{ background:GLASS.sm, color:"#64748b", border:"none", cursor:"pointer" }}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm leading-relaxed mt-1"
              style={{ color: isDeleted ? "#475569" : "rgba(255,255,255,0.75)", fontStyle: isDeleted ? "italic" : "normal" }}>
              {post.body}
            </p>
          )
        )}

        {/* Author controls — edit / delete */}
        {isAuthor && !isDeleted && !editingPost && (
          <div className="flex gap-2 mt-3">
            <button onClick={() => setEditingPost(true)}
              className="text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all hover:brightness-125"
              style={{ background:GLASS.xs, color:"#64748b", border:`1px solid rgba(255,255,255,0.08)` }}>
              ✏️ Edit
            </button>
            <button onClick={confirmDelete}
              className="text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all hover:brightness-125"
              style={{ background:"rgba(220,38,38,0.07)", color:"#f87171", border:"1px solid rgba(220,38,38,0.2)" }}>
              🗑 Delete
            </button>
          </div>
        )}
      </div>
      {/* Reactions */}
      {post.source === "user" && (
        <div className={CLS_CARD} style={{ background:"#0f1b2d", border:`1px solid rgba(255,255,255,0.08)` }}>
          <div className="px-5 py-3" style={{ background:GLASS.xs, borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
            <span className={CLS_HDR} style={{ fontFamily:BRAND.fonts.display, fontSize:13, color:"#e2e8f0", letterSpacing:1.5 }}>REACTIONS</span>
          </div>
          <ReactionBar postId={post.id} session={session} onShowAuth={onShowAuth}/>
        </div>
      )}

      {/* Comments */}
      <div className={CLS_CARD} style={{ background:"#0f1b2d", border:`1px solid rgba(255,255,255,0.08)` }}>
        <div className="px-5 py-3 flex items-center gap-2" style={{ background:GLASS.xs, borderBottom:`1px solid rgba(255,255,255,0.06)` }}>
          <span style={{ fontSize:14 }}>💬</span>
          <span className={CLS_HDR} style={{ fontFamily: BRAND.fonts.display, fontSize:13, color:"#e2e8f0", letterSpacing:1.5 }}>
            DISCUSSION {post.source==="user" && postComments.length > 0 ? `(${postComments.length})` : ""}
          </span>
        </div>
        {post.source === "formation" ? (
          <div className="px-5 py-6 text-center">
            <p className="text-xs italic" style={{ color:"#475569", fontFamily: BRAND.fonts.body }}>
              Formation guides are reference material. Start a Discussion post to chat about this formation!
            </p>
          </div>
        ) : (
          <>
            <div className="flex flex-col" style={{ minHeight: 80 }}>
              {postComments.length === 0 && (
                <p className="text-xs text-center py-6 italic px-5" style={{ color:"#475569", fontFamily: BRAND.fonts.body }}>
                  No replies yet — be the first!
                </p>
              )}
              {postComments.map((c, i) => (
                <div key={c.id} className="px-5 py-4" style={{ borderTop: i > 0 ? `1px solid rgba(255,255,255,0.05)` : "none" }}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="rounded-full flex items-center justify-center font-black"
                      style={{ width:26, height:26, background: BRAND.colors.green, color:"#fff", fontSize:10 }}>
                      {c.author_avatar || (c.author_name || "A")[0].toUpperCase()}
                    </div>
                    <span className={CLS_BADGE} style={{ color:"#94a3b8" }}>{c.author_name || "Anonymous"}</span>
                    <span style={{ fontSize:10, color:"#475569" }}>· {new Date(c.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color:"rgba(255,255,255,0.78)", fontFamily: BRAND.fonts.body }}>{c.body}</p>
                </div>
              ))}
            </div>
            <CommentComposer
              signedIn={signedIn}
              username={username}
              postId={post.id}
              onSubmit={onSubmit}
              onShowAuth={onShowAuth}
            />
          </>
        )}
      </div>
    </div>
  );
}); // ← closes memo()

// ─── Community Tab ─────────────────────────────────────────────────────────────
function SectionHeader({ icon, title, count }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span style={{ fontSize:16 }}>{icon}</span>
      <span className={CLS_HDR} style={{ fontFamily: BRAND.fonts.display, fontSize:14, color:"#e2e8f0", letterSpacing:1.5 }}>{title}</span>
      {count !== undefined && <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background:GLASS.lg, color:"#64748b" }}>{count}</span>}
    </div>
  );
}

function CommunityTab({ session, profile, setSession, showAuth, setShowAuth }) {

  // ── View state ────────────────────────────────────────────────────────────
  const [view,        setView]        = useState("home"); // "home" | "post"
  const [activePost,  setActivePost]  = useState(null);
  const [filter,      setFilter]      = useState("all");

  // ── Data state ────────────────────────────────────────────────────────────
  const [userPosts,   setUserPosts]   = useState([]);
  const [comments,    setComments]    = useState({}); // keyed by post_id
  const [loadingPosts, setLoadingPosts] = useState(false);

  // ── Composer state ────────────────────────────────────────────────────────
  const [showNewPost, setShowNewPost] = useState(false);
  const [draft,       setDraft]       = useState({ title:"", tag:"General", body:"" });
  const [submitting,  setSubmitting]  = useState(false);
  const [error,       setError]       = useState("");

  // ── Load user posts from Supabase ─────────────────────────────────────────
  async function loadPosts() {
    setLoadingPosts(true);
    try {
      const data = await sb.select("posts", "?select=*&order=created_at.desc");
      setUserPosts(Array.isArray(data) ? data : []);
    } catch(e) { /* silently fail — UI shows empty state */ }
    finally { setLoadingPosts(false); }
  }

  // ── Load comments for a post ───────────────────────────────────────────────
  // useCallback gives this a stable reference so submitComment's deps are correct
  // and a new submitComment is only created when session actually changes.
  const loadComments = useCallback(async (postId) => {
    try {
      const data = await sb.select("comments", `?post_id=eq.${postId}&order=created_at.asc`);
      setComments(prev => ({ ...prev, [postId]: Array.isArray(data) ? data : [] }));
    } catch(e) { /* silently fail — UI shows empty state */ }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadPosts(); }, []);

  // ── Merged + filtered ─────────────────────────────────────────────────────
  const allUserPostsMapped = useMemo(() => userPosts.map(p => ({
    ...p, source:"user", commentCount: p.comment_count || 0,
    title: p.title, body: p.body, tag: p.tag || "General",
    lastActivity: p.created_at ? new Date(p.created_at).toLocaleDateString() : "",
  })), [userPosts]);

  const filteredFormations = useMemo(() =>
    filter === "all" ? FORMATION_POSTS
    : filter === "General" ? []
    : FORMATION_POSTS.filter(p => p.tag === filter),
  [filter]);

  const filteredUserPosts = useMemo(() =>
    filter === "all" ? allUserPostsMapped
    : allUserPostsMapped.filter(p => p.tag === filter),
  [filter, allUserPostsMapped]);

  // ── Submit new user post ──────────────────────────────────────────────────
  async function submitPost() {
    if (!draft.title.trim() || !draft.body.trim() || !session) return;
    setSubmitting(true); setError("");
    try {
      await sb.authedInsert("posts", {
        title:          draft.title.trim(),
        body:           draft.body.trim(),
        tag:            COMMUNITY_TAGS.slice(1).includes(draft.tag) ? draft.tag : "General",
        author_name:    profile?.display_name || session.email.split("@")[0],
        author_avatar:  profile?.avatar_emoji  || null,
        author_country: profile?.country        || null,
        player_class:   profile?.player_class   || null,
        user_id:        session.user.id,
      }, session.token);
      track("post_created", { tag: draft.tag });
      setDraft({ title:"", tag:"General", body:"" });
      setShowNewPost(false);
      await loadPosts();
    } catch(e) {
      setError(`Failed to post: ${e.message || e}`);
    }
    finally { setSubmitting(false); }
  }

  // ── Submit comment ────────────────────────────────────────────────────────
  const submitComment = useCallback(async (postId, body) => {
    if (!body || !session) return;
    try {
      await sb.authedInsert("comments", {
        post_id:      postId,
        body:         body,
        author_name:  profile?.display_name || session.email.split("@")[0],
        author_avatar: profile?.avatar_emoji || null,
        user_id:      session.user.id,
      }, session.token);
      await loadComments(postId);
    } catch(e) { /* errors handled in CommentComposer */ }
  }, [session, loadComments]); // loadComments is stable (useCallback), recreates only on sign-in/out

  // ── Open post ─────────────────────────────────────────────────────────────
  function openPost(post) {
    setActivePost(post);
    setView("post");
    setError("");
    if (post.source === "user") loadComments(post.id);
    if (typeof window !== "undefined") window.scrollTo(0, 0);
  }

  // ── Stable callbacks passed to PostView / CommentComposer ─────────────────
  const handleShowAuth = useCallback(() => setShowAuth(true), []);
  const handleBack     = useCallback(() => setView("home"), []);

  // ── Memoised PostView props — without these, new object/array refs on every
  //    render defeat React.memo and the re-render cascade continues ────────────
  const postComments = useMemo(
    () => activePost?.source === "user" ? (comments[activePost.id] || []) : [],
    [activePost, comments]
  );
  const signedIn = !!session;
  const username = profile?.display_name || session?.email?.split("@")[0] || "";
  const [expandedTags, setExpandedTags] = React.useState({});
  function toggleTag(tag) { setExpandedTags(p => ({ ...p, [tag]: !p[tag] })); }

  function handlePostUpdated(updatedPost) {
    setUserPosts(prev => prev.map(p => p.id === updatedPost.id ? { ...p, ...updatedPost } : p));
    if (activePost?.id === updatedPost.id) setActivePost(prev => ({ ...prev, ...updatedPost }));
  }
  function handlePostDeleted(deletedPost) {
    setUserPosts(prev => prev.map(p => p.id === deletedPost.id ? { ...p, ...deletedPost } : p));
    if (activePost?.id === deletedPost.id) setActivePost(prev => ({ ...prev, ...deletedPost }));
  }

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-2xl mx-auto px-3 sm:px-5 py-5" style={{ fontFamily: BRAND.fonts.body }}>

      {/* Privacy notice */}
      <div className="rounded-xl px-4 py-3 mb-5 flex gap-3 items-start"
        style={{ background:"rgba(99,102,241,0.08)", border:`1px solid rgba(99,102,241,0.2)` }}>
        <span style={{ fontSize:14, flexShrink:0 }}>🔒</span>
        <p className="text-xs leading-relaxed" style={{ color:"rgba(255,255,255,0.55)" }}>
          <strong style={{ color:"rgba(255,255,255,0.8)" }}>Data & Privacy.</strong> Posts and comments are stored securely in our database. Your email is never shown publicly — only your username (email prefix) appears. Accounts are protected by Supabase Auth. By posting you agree to keep discussions respectful and on-topic.
        </p>
      </div>

      {view === "post" && activePost ? (
        <PostView
          key={activePost.id}
          post={activePost}
          postComments={postComments}
          signedIn={signedIn}
          username={username}
          session={session}
          onSubmit={submitComment}
          onShowAuth={handleShowAuth}
          onBack={handleBack}
          onPostUpdated={handlePostUpdated}
          onPostDeleted={handlePostDeleted}
        />
      ) : (
        <>
          {/* Header + auth + new post */}
          <div className="flex items-start justify-between mb-5 gap-3">
            <div>
              <div className="font-black" style={{ fontFamily: BRAND.fonts.display, fontSize:"clamp(22px,6vw,30px)", color:"#fff", letterSpacing:1 }}>COMMUNITY</div>
              <div className="text-xs" style={{ color:"#475569" }}>Tactics · Formations · Coaching</div>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              {session ? (
                <>
                  <div className={CLS_ROW}>
                    <div className="rounded-full flex items-center justify-center font-black text-xs"
                      style={{ width:32, height:32, background: BRAND.colors.green, color:"#fff", fontSize:14 }}>
                      {profile?.avatar_emoji || session?.email?.[0]?.toUpperCase() || "?"}
                    </div>
                    <span className={CLS_BADGE} style={{ color:"#94a3b8" }}>{profile?.display_name || session?.email?.split("@")[0] || "Me"}</span>
                    <button onClick={async () => { if (session) await sb.signOut(session.token).catch(()=>{}); setSession(null); }}
                      className="text-xs transition-opacity hover:opacity-70"
                      style={{ background:"none", border:"none", cursor:"pointer", color:"#64748b" }}>Sign out</button>
                  </div>
                  <button onClick={() => setShowNewPost(v => !v)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl font-black text-xs tracking-wide transition-all hover:brightness-110 active:scale-95"
                    style={{ background: showNewPost ? "rgba(245,197,24,0.15)" : BRAND.colors.yellow,
                      color: showNewPost ? BRAND.colors.yellow : "#111",
                      border:`2px solid ${BRAND.colors.yellow}`, fontFamily: BRAND.fonts.body }}>
                    {showNewPost ? "✕ Cancel" : "+ New Post"}
                  </button>
                </>
              ) : (
                <button onClick={() => setShowAuth(true)}
                  className="px-4 py-2 rounded-xl font-black text-xs tracking-wide transition-all hover:brightness-110"
                  style={{ background: BRAND.colors.yellow, color:"#111", border:`2px solid ${BRAND.colors.yellow}`, fontFamily: BRAND.fonts.body }}>
                  Sign In
                </button>
              )}
            </div>
          </div>

          {/* New post composer */}
          {showNewPost && session && (
            <div className="rounded-2xl overflow-hidden mb-4" style={{ background:"#0f1b2d", border:`2px solid ${BRAND.colors.yellow}`, boxShadow:`0 0 18px ${BRAND.colors.yellow}20` }}>
              <div className="flex items-center gap-2 px-5 py-3" style={{ background:"rgba(245,197,24,0.08)", borderBottom:`1px solid rgba(255,255,255,0.06)` }}>
                <span style={{ fontSize:15 }}>✏️</span>
                <span className={CLS_HDR} style={{ fontFamily: BRAND.fonts.display, fontSize:13, color: BRAND.colors.yellow, letterSpacing:2 }}>NEW DISCUSSION</span>
              </div>
              <div className="p-5 flex flex-col gap-3">
                <div className="flex gap-2 flex-wrap">
                  {["General","11v11","9v9","7v7","5v5"].map(t => (
                    <button key={t} onClick={() => setDraft(d => ({ ...d, tag:t }))}
                      className="px-3 py-1 rounded-full text-xs font-bold transition-all"
                      style={{ background: draft.tag===t ? COMMUNITY_TAG_COLORS[t] : GLASS.sm,
                        color: draft.tag===t ? "#fff" : "#64748b",
                        border:`1px solid ${draft.tag===t ? COMMUNITY_TAG_COLORS[t] : "rgba(255,255,255,0.1)"}`,
                        fontFamily: BRAND.fonts.body }}>
                      {t}
                    </button>
                  ))}
                </div>
                <input id="post-title" name="post-title" autoComplete="off"
                  className="w-full rounded-xl px-3 py-2 font-bold focus:outline-none"
                  style={{ background:GLASS.sm, border:`1px solid rgba(255,255,255,0.1)`, color:"#f1f5f9", fontFamily: BRAND.fonts.body, fontSize:16 }}
                  maxLength={120} placeholder="Discussion title…" value={draft.title} onChange={e => setDraft(d => ({ ...d, title:e.target.value }))}/>
                <textarea rows={4} maxLength={5000} id="post-body" name="post-body" autoComplete="off"
                  className="w-full rounded-xl px-3 py-2 focus:outline-none resize-none"
                  style={{ background:GLASS.sm, border:`1px solid rgba(255,255,255,0.1)`, color:"#f1f5f9", fontFamily: BRAND.fonts.body, fontSize:16 }}
                  placeholder="Share your question, tactic, or insight…" value={draft.body} onChange={e => setDraft(d => ({ ...d, body:e.target.value }))}/>
                {error && <p className="text-xs" style={{ color:"#f87171" }}>{error}</p>}
                <button onClick={submitPost} disabled={submitting || !draft.title.trim() || !draft.body.trim()}
                  className="px-5 py-2.5 rounded-xl text-sm font-black tracking-wide transition-all hover:brightness-110 active:scale-95 self-start"
                  style={{ background: draft.title.trim() && draft.body.trim() ? BRAND.colors.yellow : GLASS.sm,
                    color: draft.title.trim() && draft.body.trim() ? "#111" : "#475569",
                    fontFamily: BRAND.fonts.body, border:"none",
                    cursor: draft.title.trim() && draft.body.trim() ? "pointer" : "default" }}>
                  {submitting ? "Posting…" : "Post Discussion"}
                </button>
              </div>
            </div>
          )}

          {/* Filter pills */}
          <div className="flex gap-2 mb-5 overflow-x-auto pb-1" style={{ WebkitOverflowScrolling:"touch" }}>
            {COMMUNITY_TAGS.map(t => (
              <button key={t} onClick={() => setFilter(t)}
                className="px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all"
                style={{ background: filter===t ? (COMMUNITY_TAG_COLORS[t]||BRAND.colors.green) : GLASS.sm,
                  color: filter===t ? "#fff" : "#64748b",
                  border:`1px solid ${filter===t ? (COMMUNITY_TAG_COLORS[t]||BRAND.colors.green) : "rgba(255,255,255,0.1)"}`,
                  fontFamily: BRAND.fonts.body }}>
                {t === "all" ? "All Topics" : t}
              </button>
            ))}
          </div>

          {/* Formation guides — always pinned at top */}
          {filteredFormations.length > 0 && (
            <div className="mb-5">
              <SectionHeader icon="📖" title="FORMATION GUIDES" count={filteredFormations.length}/>
              <div className="flex flex-col gap-2">
                {filteredFormations.map(p => <PostCard key={p.id} post={p} onOpen={openPost}/>)}
              </div>
            </div>
          )}

          {/* Discussions — grouped when "All Topics", flat when specific tag */}
          {loadingPosts ? (
            <p className="text-xs text-center py-6" style={{ color:"#475569" }}>Loading discussions…</p>
          ) : filter === "all" ? (
            // ── Grouped view ──────────────────────────────────────────────────
            <div className="space-y-3">
              {COMMUNITY_TAGS.slice(1).map(tag => {
                const tagPosts = allUserPostsMapped.filter(p => p.tag === tag);
                if (tagPosts.length === 0) return null;
                const isExpanded = !!expandedTags[tag];
                const tagColor   = COMMUNITY_TAG_COLORS[tag] || BRAND.colors.green;
                const previewPosts  = [...tagPosts]
                  .sort((a,b) => new Date(b.created_at) - new Date(a.created_at))
                  .slice(0, 3);
                const expandedPosts = [...tagPosts]
                  .sort((a,b) => (b.commentCount||0) - (a.commentCount||0));
                const displayPosts  = isExpanded ? expandedPosts : previewPosts;
                const hiddenCount   = tagPosts.length - 3;
                return (
                  <div key={tag} className="rounded-2xl overflow-hidden"
                    style={{ border:`1px solid ${tagColor}33`, background:GLASS.xs }}>
                    {/* Section header */}
                    <button onClick={() => toggleTag(tag)}
                      className="w-full flex items-center justify-between px-4 py-3 transition-all hover:brightness-110"
                      style={{ background:GLASS.sm, borderBottom:`1px solid ${tagColor}22` }}>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black px-2 py-0.5 rounded-full"
                          style={{ background:`${tagColor}22`, color:tagColor, border:`1px solid ${tagColor}44` }}>
                          {tag}
                        </span>
                        <span className="text-[10px] font-bold" style={{ color:"#475569" }}>
                          {tagPosts.length} post{tagPosts.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <span className="text-xs font-black" style={{ color:tagColor }}>
                        {isExpanded ? "▲ Collapse" : `▼ ${hiddenCount > 0 ? `+${hiddenCount} more` : "expand"}`}
                      </span>
                    </button>
                    {/* Posts */}
                    <div className="flex flex-col gap-0">
                      {displayPosts.map((p, i) => (
                        <div key={p.id}
                          style={{ borderBottom: i < displayPosts.length-1 ? `1px solid rgba(255,255,255,0.04)` : "none" }}>
                          <PostCard post={p} onOpen={openPost}/>
                        </div>
                      ))}
                    </div>
                    {/* Expand prompt */}
                    {!isExpanded && hiddenCount > 0 && (
                      <button onClick={() => toggleTag(tag)}
                        className="w-full py-2.5 text-[10px] font-bold transition-all hover:brightness-110"
                        style={{ color:tagColor, background:`${tagColor}0a`,
                                 borderTop:`1px solid ${tagColor}22` }}>
                        Show all {tagPosts.length} posts — sorted by most discussed ▼
                      </button>
                    )}
                    {/* Collapse from bottom */}
                    {isExpanded && (
                      <button onClick={() => toggleTag(tag)}
                        className="w-full py-2 text-[10px] font-bold transition-all hover:brightness-110"
                        style={{ color:"#475569", background:GLASS.xs,
                                 borderTop:`1px solid rgba(255,255,255,0.05)` }}>
                        ▲ Show less
                      </button>
                    )}
                  </div>
                );
              })}
              {allUserPostsMapped.length === 0 && (
                <p className="text-xs text-center py-8 italic" style={{ color:"#475569" }}>
                  No posts yet — be the first!
                </p>
              )}
            </div>
          ) : (
            // ── Flat filtered view for specific tag ───────────────────────────
            filteredUserPosts.length > 0 ? (
              <div className="mb-6">
                <SectionHeader icon="💬" title="DISCUSSIONS" count={filteredUserPosts.length}/>
                <div className="flex flex-col gap-2">
                  {filteredUserPosts
                    .sort((a,b) => new Date(b.created_at) - new Date(a.created_at))
                    .map(p => <PostCard key={p.id} post={p} onOpen={openPost}/>)}
                </div>
              </div>
            ) : (
              <p className="text-xs text-center py-8 italic" style={{ color:"#475569" }}>
                No posts in this category yet — be the first!
              </p>
            )
          )}

          {/* Ad between discussions and formations */}
          {filteredFormations.length > 0 && allUserPostsMapped.length > 0 && (
            <AdBanner slot="3024866198" format="auto"
              style={{ margin:"8px 0", borderRadius:8, overflow:"hidden" }}/>
          )}
        </>
      )}
    </div>
  );

}

export default CommunityTab;
export { PostCard, PostView, CommentComposer, ReactionBar, TagPill, SectionHeader };
