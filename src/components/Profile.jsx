// ─── Profile components ──────────────────────────────────────────────────────
import React, { useState, useEffect, useRef, useMemo, memo } from "react";
import { GLASS, BRAND, CLS_HDR, CLS_BADGE, CLS_CARD, CLS_ROW,
         LOGO_SRC, ROLE_CAPTAIN, ROLE_ASSISTANT, ROLE_PLAYER,
         ROLE_BADGE, ROLE_LABEL }                             from "../tokens.js";
import { sb }                                                  from "../supabase.js";
import { track, calcOverall, calcClass, getTopStats,
         pointsUsed, isNonPlayer, contrastColor }             from "../helpers.js";
import { PLAYER_CLASSES, VIBE_CARDS, ATTR_META, ATTRS,
         ATTR_MIN, ATTR_MAX, POINT_POOL, ROLES_IN_SPORT,
         COUNTRIES, ALL_POSITIONS, ROLE_DESIGNATIONS }        from "../playerData.js";

// ─── FC-Style Player Card & Badge ────────────────────────────────────────────

// Card background styles per class
const CLASS_CARD_STYLES = {
  "Grass Roots": { bg:"linear-gradient(160deg,#7c5c32 0%,#3d2b12 100%)", accent:"#cd9f5a", dark:"rgba(0,0,0,0.4)" },
  "Rec Player":  { bg:"linear-gradient(160deg,#4b5563 0%,#1f2937 100%)", accent:"#9ca3af", dark:"rgba(0,0,0,0.4)" },
  "Club/League": { bg:"linear-gradient(160deg,#1e3a8a 0%,#0f1e4a 100%)", accent:"#60a5fa", dark:"rgba(0,0,0,0.4)" },
  "Comp Player": { bg:"linear-gradient(160deg,#4c1d95 0%,#1e0a3c 100%)", accent:"#a78bfa", dark:"rgba(0,0,0,0.4)" },
  "Semi-Pro":    { bg:"linear-gradient(160deg,#92400e 0%,#3d1a05 100%)", accent:"#fbbf24", dark:"rgba(0,0,0,0.4)" },
  "Pro":         { bg:"linear-gradient(160deg,#111827 0%,#000000 100%)", accent:"#fbbf24", dark:"rgba(0,0,0,0.3)" },
};

function FCPlayerCard({ profile, compact = false }) {
  if (!profile) return null;
  const pOverall  = profile.overall_score || calcOverall(profile);
  const pClass    = calcClass(pOverall);
  const pTop      = getTopStats(profile);
  const cardStyle = CLASS_CARD_STYLES[pClass.name] || CLASS_CARD_STYLES["Grass Roots"];
  const countryEntry = COUNTRIES.find(([n]) => n === profile.country);
  const flag = countryEntry?.[1] || "";
  const role = ROLES_IN_SPORT.find(r => r.id === profile.role_in_sport);
  const positions = (profile.positions || "").split(",").filter(Boolean).slice(0,2).join(" · ") || role?.label || "Player";
  const isSpecial = profile.role_in_sport === "referee" || profile.role_in_sport === "fan";
  const specialEmoji = profile.role_in_sport === "referee" ? "🦓" : profile.role_in_sport === "fan" ? "👀" : null;

  if (compact) {
    // ── Compact badge version ────────────────────────────────────────────────
    return (
      <div className="rounded-2xl overflow-hidden"
        style={{ background:cardStyle.bg, border:`1.5px solid ${cardStyle.accent}44`,
                 boxShadow:`0 4px 20px rgba(0,0,0,0.4), inset 0 1px 0 ${cardStyle.accent}22`,
                 maxWidth:260, width:"100%" }}>
        {/* Top strip */}
        <div className="flex items-center justify-between px-3 py-2"
          style={{ background:cardStyle.dark, borderBottom:`1px solid ${cardStyle.accent}22` }}>
          <div className="flex items-center gap-1.5">
            <span style={{ fontSize:28, lineHeight:1 }}>{profile.avatar_emoji || "⚽"}</span>
            <div>
              <div className="font-black text-white text-sm leading-none">{profile.display_name || "—"}</div>
              {flag && <div className="text-[10px] mt-0.5" style={{ color:cardStyle.accent }}>{flag} {profile.country}</div>}
            </div>
          </div>
          <div className="text-right">
            {isSpecial ? (
              <div style={{ fontSize:24 }}>{specialEmoji}</div>
            ) : (
              <>
                <div className="font-black text-2xl leading-none" style={{ color:cardStyle.accent }}>{pOverall}</div>
                <div className="text-[8px] font-bold" style={{ color:"rgba(255,255,255,0.5)" }}>{pClass.name}</div>
              </>
            )}
          </div>
        </div>
        {/* Stats row */}
        {!isSpecial && (
          <div className="grid grid-cols-3 gap-0 px-3 py-2">
            {ATTRS.map(a => {
              const m = ATTR_META[a];
              const val = Number(profile[`attr_${a}`] || 10);
              return (
                <div key={a} className="flex items-center gap-1 py-0.5">
                  <span className="text-[8px] font-black" style={{ color:m.color, width:16 }}>{m.label}</span>
                  <span className="text-[10px] font-black text-white">{val}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ── Full FC-style card ───────────────────────────────────────────────────────
  return (
    <div className="rounded-2xl overflow-hidden w-full"
      style={{ background:cardStyle.bg,
               border:`2px solid ${cardStyle.accent}55`,
               boxShadow:`0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 ${cardStyle.accent}33` }}>

      {/* Header: overall + class + flag */}
      <div className="px-5 pt-4 pb-3 flex items-start justify-between"
        style={{ background:cardStyle.dark, borderBottom:`1px solid ${cardStyle.accent}22` }}>
        <div>
          {isSpecial ? (
            <div style={{ fontSize:48 }}>{specialEmoji}</div>
          ) : (
            <>
              <div className="font-black leading-none" style={{ fontSize:52, color:cardStyle.accent }}>{pOverall}</div>
              <div className="text-xs font-bold mt-0.5 tracking-widest uppercase" style={{ color:"rgba(255,255,255,0.55)", letterSpacing:2 }}>
                {positions}
              </div>
            </>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          <div style={{ fontSize:32 }}>{pClass.emoji}</div>
          {flag && <div style={{ fontSize:20 }}>{flag}</div>}
          {!isSpecial && (
            <div>
              {Array.from({length:Math.min(pClass.stars,5)}).map((_,i) => (
                <span key={i} style={{ color:cardStyle.accent, fontSize:11 }}>★</span>
              ))}
              {pClass.stars === 6 && <span>👑</span>}
            </div>
          )}
        </div>
      </div>

      {/* Avatar + name */}
      <div className="text-center py-3" style={{ borderBottom:`1px solid ${cardStyle.accent}22` }}>
        <div style={{ fontSize:56, lineHeight:1, marginBottom:4 }}>
          {profile.avatar_emoji || "⚽"}
        </div>
        <div className="font-black tracking-wide text-white" style={{ fontSize:18, fontFamily:"inherit", letterSpacing:1 }}>
          {profile.display_name || "—"}
        </div>
        {profile.country && (
          <div className="text-xs mt-0.5" style={{ color:cardStyle.accent }}>
            {flag} {profile.country}
            {profile.club_name && ` · ${profile.club_name}`}
          </div>
        )}
        {pTop.length > 0 && !isSpecial && (
          <div className="flex justify-center gap-3 mt-1.5">
            {pTop.map(s => (
              <span key={s.key} className="text-[10px] font-black px-2 py-0.5 rounded"
                style={{ background:`${s.color}22`, color:s.color }}>
                ↑ {s.key} {s.val}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Attribute grid */}
      {!isSpecial && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 px-5 py-3"
          style={{ borderBottom:`1px solid ${cardStyle.accent}22` }}>
          {ATTRS.map(a => {
            const m = ATTR_META[a];
            const val = Number(profile[`attr_${a}`] || 10);
            return (
              <div key={a} className="flex items-center gap-2">
                <span className="text-[9px] font-black w-6" style={{ color:m.color }}>{m.label}</span>
                <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background:"rgba(255,255,255,0.1)" }}>
                  <div style={{ width:`${val}%`, height:"100%", background:m.color, borderRadius:99 }}/>
                </div>
                <span className="text-[11px] font-black w-5 text-right text-white">{val}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Class name footer */}
      <div className="px-5 py-2 text-center">
        <span className="text-[9px] font-black tracking-widest uppercase"
          style={{ color:cardStyle.accent, letterSpacing:3 }}>
          {isSpecial ? (profile.role_in_sport === "referee" ? "Referee" : "Fan / Supporter") : pClass.name}
        </span>
      </div>
    </div>
  );
}

// ─── Player Setup Wizard (Onboarding + Edit) ─────────────────────────────────
function PlayerSetupModal({ session, profile, mode = "onboarding", onComplete, onClose }) {
  const isEdit = mode === "edit";
  const AVATARS = ["⚽","🏆","🧤","🦁","🦅","🐯","🔥","⚡","🌟","🎯","💪","🛡️"];

  const initForm = () => ({
    display_name:     profile?.display_name     || session?.email?.split("@")[0] || "",
    avatar_emoji:     profile?.avatar_emoji     || "⚽",
    role_in_sport:    profile?.role_in_sport    || "",
    attr_pac:         profile?.attr_pac         || 10,
    attr_sho:         profile?.attr_sho         || 10,
    attr_pas:         profile?.attr_pas         || 10,
    attr_dri:         profile?.attr_dri         || 10,
    attr_def:         profile?.attr_def         || 10,
    attr_phy:         profile?.attr_phy         || 10,
    country:          profile?.country          || "",
    positions:        profile?.positions        || "",
    preferred_foot:   profile?.preferred_foot   || "",
    age:              profile?.age              || "",
    gender:           profile?.gender           || "",
    show_gender:      profile?.show_gender      || false,
    show_experience:  profile?.show_experience  !== false,
    club_name:        profile?.club_name        || "",
    club_website:     profile?.club_website     || "",
    bio:              profile?.bio              || "",
    social_instagram: profile?.social_instagram || "",
    social_twitter:   profile?.social_twitter   || "",
    social_tiktok:    profile?.social_tiktok    || "",
    social_youtube:   profile?.social_youtube   || "",
  });

  const [step,          setStep]          = React.useState(1);
  const [form,          setForm]          = React.useState(initForm);
  const [saving,        setSaving]        = React.useState(false);
  const [countrySearch, setCountrySearch] = React.useState("");
  const [showCountryDD, setShowCountryDD] = React.useState(false);
  const [showPrivacy,   setShowPrivacy]   = React.useState(false);
  const [vibeChosen,    setVibeChosen]    = React.useState(null);

  const totalSteps = 4;
  const overall    = calcOverall(form);
  const cls        = calcClass(overall);
  const topStats   = getTopStats(form);
  const used       = pointsUsed(form);
  const remaining  = POINT_POOL - used;
  const skipAttrs  = isNonPlayer(form.role_in_sport);

  function set(key, val) { setForm(f => ({...f, [key]: val})); }

  function setAttr(key, newVal) {
    // Use functional setState to always read the latest form state
    // (stale closure caused freeze when jumping between sliders quickly)
    setForm(f => {
      const others = ATTRS.filter(a => a !== key)
        .reduce((s, a) => s + Number(f[`attr_${a}`] || 10), 0);
      const maxAllowed = Math.min(ATTR_MAX, POINT_POOL - others);
      const clamped    = Math.max(ATTR_MIN, Math.min(Number(newVal), maxAllowed));
      return { ...f, [`attr_${key}`]: clamped };
    });
  }

  function applyVibe(vibe) {
    setVibeChosen(vibe.id);
    setForm(f => ({ ...f,
      attr_pac: vibe.attrs.pac, attr_sho: vibe.attrs.sho, attr_pas: vibe.attrs.pas,
      attr_dri: vibe.attrs.dri, attr_def: vibe.attrs.def, attr_phy: vibe.attrs.phy,
    }));
  }

  function canProceed() {
    if (step === 1) return form.display_name.trim().length > 0 && form.role_in_sport;
    return true;
  }

  async function handleFinish() {
    setSaving(true);
    const payload = {
      id:               session.user.id,
      display_name:     form.display_name.trim(),
      avatar_emoji:     form.avatar_emoji,
      role_in_sport:    form.role_in_sport,
      attr_pac:         Number(form.attr_pac),
      attr_sho:         Number(form.attr_sho),
      attr_pas:         Number(form.attr_pas),
      attr_dri:         Number(form.attr_dri),
      attr_def:         Number(form.attr_def),
      attr_phy:         Number(form.attr_phy),
      overall_score:    overall,
      player_class:     skipAttrs ? (form.role_in_sport === "referee" ? "🦓 Referee" : "👀 Fan") : cls.name,
      country:          form.country          || null,
      positions:        form.positions        || null,
      preferred_foot:   form.preferred_foot   || null,
      age:              form.age ? Number(form.age) : null,
      gender:           form.gender           || null,
      show_gender:      form.show_gender,
      show_experience:  form.show_experience,
      club_name:        form.club_name        || null,
      club_website:     form.club_website     || null,
      bio:              form.bio              || null,
      social_instagram: form.social_instagram || null,
      social_twitter:   form.social_twitter   || null,
      social_tiktok:    form.social_tiktok    || null,
      social_youtube:   form.social_youtube   || null,
      attrs_last_updated: new Date().toISOString(),
      setup_complete:   true,
      updated_at:       new Date().toISOString(),
    };
    const saved = await sb.upsert("profiles", payload, session.token).catch(() => null);
    if (!saved) {
      // Retry once before giving up
      await sb.upsert("profiles", payload, session.token).catch(() => {});
    }
    onComplete(payload);
    setSaving(false);
  }

  // ── Step indicators ─────────────────────────────────────────────────────────
  const stepLabels = ["Identity","Vibe","Attributes","Your World"];

  // ── Filtered countries ───────────────────────────────────────────────────────
  const filteredCountries = COUNTRIES.filter(([name]) =>
    name.toLowerCase().includes(countrySearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-3"
      style={{ background:"rgba(0,0,0,0.85)", backdropFilter:"blur(6px)" }}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden flex flex-col"
        style={{ background:"#0f172a", border:"1px solid rgba(255,255,255,0.1)", maxHeight:"92vh" }}>

        {/* ── Header ── */}
        <div className="px-5 pt-5 pb-3 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="font-black tracking-widest text-white"
              style={{ fontFamily:BRAND.fonts.display, fontSize:15, letterSpacing:2 }}>
              {isEdit ? "EDIT PROFILE" : "PLAYER EVALUATION"}
            </div>
            {isEdit && (
              <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", color:"#64748b", fontSize:18 }}>✕</button>
            )}
          </div>
          {/* Step pills */}
          <div className="flex gap-1.5">
            {stepLabels.map((label, i) => (
              <button key={i} onClick={() => isEdit && setStep(i+1)}
                className="flex-1 py-1 rounded-lg text-[9px] font-black tracking-wide transition-all"
                style={{
                  background: step === i+1 ? BRAND.colors.green : step > i+1 ? "rgba(45,122,58,0.25)" : GLASS.xs,
                  color:      step === i+1 ? "#fff"             : step > i+1 ? "#4ade80"               : "#475569",
                  border:     step === i+1 ? "none" : "1px solid rgba(255,255,255,0.06)",
                  cursor:     isEdit ? "pointer" : "default",
                }}>
                {step > i+1 ? "✓" : label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Content ── */}
        <div className="flex-1 overflow-y-auto px-5 pb-2">

          {/* ═══════════════════════════════════════════════════
              STEP 1 — IDENTITY
          ═══════════════════════════════════════════════════ */}
          {step === 1 && (
            <div className="space-y-4 py-2">
              {/* Avatar */}
              <div>
                <div className="text-[9px] font-black tracking-widest mb-2" style={{ color:"#64748b" }}>PICK YOUR AVATAR</div>
                <div className="flex flex-wrap gap-2">
                  {AVATARS.map(e => (
                    <button key={e} onClick={() => set("avatar_emoji", e)}
                      className="w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all"
                      style={{ background: form.avatar_emoji===e ? BRAND.colors.green : GLASS.sm,
                               border:     form.avatar_emoji===e ? `2px solid ${BRAND.colors.green}` : "1px solid rgba(255,255,255,0.08)" }}>
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              {/* Display name */}
              <div>
                <div className="text-[9px] font-black tracking-widest mb-1.5" style={{ color:"#64748b" }}>
                  DISPLAY NAME <span style={{ color:BRAND.colors.red }}>*</span>
                </div>
                <input className="w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none"
                  style={{ background:GLASS.sm, border:`1px solid rgba(255,255,255,0.12)`, color:"#fff" }}
                  value={form.display_name} maxLength={30}
                  placeholder="How you appear in the community"
                  onChange={e => set("display_name", e.target.value)}/>
              </div>

              {/* Role in football */}
              <div>
                <div className="text-[9px] font-black tracking-widest mb-2" style={{ color:"#64748b" }}>
                  ROLE IN FOOTBALL <span style={{ color:BRAND.colors.red }}>*</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {ROLES_IN_SPORT.map(r => (
                    <button key={r.id} onClick={() => set("role_in_sport", r.id)}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left"
                      style={{
                        background: form.role_in_sport===r.id ? "rgba(45,122,58,0.2)"  : GLASS.xs,
                        border:     form.role_in_sport===r.id ? `1.5px solid ${BRAND.colors.green}` : "1px solid rgba(255,255,255,0.07)",
                        color:      form.role_in_sport===r.id ? "#fff" : "#94a3b8",
                      }}>
                      <span style={{ fontSize:16 }}>{r.emoji}</span>
                      <span>{r.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════
              STEP 2 — VIBE CHECK
          ═══════════════════════════════════════════════════ */}
          {step === 2 && (
            <div className="space-y-3 py-2">
              <p className="text-xs" style={{ color:"#64748b" }}>
                Pick the card that feels most like you right now. It'll pre-fill your attribute sliders — you can fine-tune them next.
              </p>
              <div className="space-y-2">
                {VIBE_CARDS.map(v => (
                  <button key={v.id} onClick={() => applyVibe(v)}
                    className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-left transition-all"
                    style={{
                      background: vibeChosen===v.id ? "rgba(45,122,58,0.18)" : GLASS.sm,
                      border:     vibeChosen===v.id ? `1.5px solid ${BRAND.colors.green}` : "1px solid rgba(255,255,255,0.07)",
                    }}>
                    <span style={{ fontSize:28, minWidth:36 }}>{v.emoji}</span>
                    <div className="flex-1">
                      <div className="font-black text-sm text-white">{v.label}</div>
                      <div className="text-xs mt-0.5" style={{ color:"#64748b" }}>{v.desc}</div>
                    </div>
                    {vibeChosen===v.id && <span style={{ color:BRAND.colors.green, fontSize:18 }}>✓</span>}
                  </button>
                ))}
              </div>
              {skipAttrs && (
                <div className="rounded-xl p-3 text-xs" style={{ background:"rgba(245,197,24,0.08)", border:"1px solid rgba(245,197,24,0.2)", color:BRAND.colors.yellow }}>
                  As a {ROLES_IN_SPORT.find(r => r.id===form.role_in_sport)?.label}, attribute sliders are optional. Skip ahead when you're ready.
                </div>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════
              STEP 3 — ATTRIBUTES
          ═══════════════════════════════════════════════════ */}
          {step === 3 && (
            <div className="py-2">
              {skipAttrs ? (
                <div className="text-center py-8">
                  <div style={{ fontSize:48, marginBottom:8 }}>
                    {form.role_in_sport === "referee" ? "🦓" : "👀"}
                  </div>
                  <div className="font-black text-white mb-2">
                    {form.role_in_sport === "referee" ? "Referee Mode" : "Fan Mode"}
                  </div>
                  <div className="text-xs" style={{ color:"#64748b", lineHeight:1.6 }}>
                    Attribute stats are for players. You'll show up as{" "}
                    <strong style={{ color:BRAND.colors.yellow }}>
                      {form.role_in_sport === "referee" ? "🦓 Referee" : "👀 Fan"}
                    </strong>{" "}
                    in the community.<br/>You can always add stats later from your profile.
                  </div>
                </div>
              ) : (
                <div className="space-y-3">

                  {/* Overall score — large, prominent, no side card */}
                  <div className="rounded-xl px-4 py-3 flex items-center justify-between"
                    style={{ background:`${cls.color}18`, border:`1.5px solid ${cls.color}44` }}>
                    <div className="flex items-center gap-3">
                      <span style={{ fontSize:28, lineHeight:1 }}>{cls.emoji}</span>
                      <div>
                        <div className="font-black leading-none" style={{ fontSize:36, color:cls.color }}>{overall}</div>
                        <div className="text-[10px] font-bold mt-0.5" style={{ color:"#64748b" }}>{cls.name}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div style={{ color:cls.color }}>
                        {Array.from({length:Math.min(cls.stars,5)}).map((_,i) => (
                          <span key={i} style={{ fontSize:14 }}>★</span>
                        ))}
                        {cls.stars === 6 && <span style={{ fontSize:16 }}>👑</span>}
                      </div>
                      <div className="text-[9px] font-bold mt-0.5" style={{ color:"#475569" }}>
                        Stat ceiling: <span style={{ color:cls.color }}>{cls.max}</span>
                      </div>
                    </div>
                  </div>

                  {/* Point pool bar */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9px] font-black tracking-widest" style={{ color:"#64748b" }}>POINTS REMAINING</span>
                      <span className="text-sm font-black" style={{ color: remaining < 30 ? BRAND.colors.red : BRAND.colors.green }}>
                        {remaining}
                      </span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background:GLASS.md }}>
                      <div className="h-full rounded-full transition-all"
                        style={{ width:`${(used/POINT_POOL)*100}%`, background: remaining < 30 ? BRAND.colors.red : BRAND.colors.green }}/>
                    </div>
                  </div>

                  {/* Hint when all points used */}
                  {remaining === 0 && (
                    <div className="text-center text-[10px] py-1 rounded-lg"
                      style={{ color: BRAND.colors.yellow, background:"rgba(245,197,24,0.08)",
                               border:"1px solid rgba(245,197,24,0.15)" }}>
                      💡 Lower one stat to free up points and raise another
                    </div>
                  )}

                  {/* Full-width sliders with class ceiling indicator */}
                  {ATTRS.map(a => {
                    const m   = ATTR_META[a];
                    const val = Number(form[`attr_${a}`] || 10);
                    // Class ceiling as % of full track (ATTR_MIN to ATTR_MAX)
                    const ceilPct = ((cls.max - ATTR_MIN) / (ATTR_MAX - ATTR_MIN)) * 100;
                    const valPct  = ((val       - ATTR_MIN) / (ATTR_MAX - ATTR_MIN)) * 100;
                    const overCeiling = val > cls.max;
                    return (
                      <div key={a}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black w-8" style={{ color:m.color }}>{m.label}</span>
                            <span className="text-[10px]" style={{ color:"#475569" }}>{m.desc}</span>
                          </div>
                          <span className="text-base font-black w-8 text-right"
                            style={{ color: overCeiling ? BRAND.colors.yellow : m.color }}>
                            {val}{overCeiling && <span style={{ fontSize:8, marginLeft:1 }}>↑</span>}
                          </span>
                        </div>
                        {/* Custom track so we can show the class ceiling */}
                        <div className="relative" style={{ height:20, display:"flex", alignItems:"center" }}>
                          {/* Track background */}
                          <div className="absolute inset-x-0 rounded-full overflow-hidden" style={{ height:6 }}>
                            {/* Active fill */}
                            <div style={{ position:"absolute", left:0, width:`${valPct}%`,
                              height:"100%", background:m.color, borderRadius:99 }}/>
                            {/* Beyond-class zone */}
                            <div style={{ position:"absolute", left:`${ceilPct}%`,
                              right:0, height:"100%",
                              background:`repeating-linear-gradient(90deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 3px, transparent 3px, transparent 6px)`,
                              borderLeft:`1.5px solid ${cls.color}88` }}/>
                            {/* Track base */}
                            <div style={{ position:"absolute", inset:0, zIndex:-1,
                              background:"rgba(255,255,255,0.07)", borderRadius:99 }}/>
                          </div>
                          {/* Class ceiling tick */}
                          <div style={{ position:"absolute", left:`${ceilPct}%`, top:0, bottom:0,
                            display:"flex", flexDirection:"column", alignItems:"center",
                            transform:"translateX(-50%)", pointerEvents:"none", zIndex:2 }}>
                            <div style={{ width:2, height:"100%", background:cls.color, opacity:0.6, borderRadius:1 }}/>
                          </div>
                          {/* Native range input overlay (invisible track, visible thumb) */}
                          <input type="range" min={ATTR_MIN} max={ATTR_MAX} value={val}
                            onChange={e => setAttr(a, e.target.value)}
                            className="absolute inset-x-0"
                            style={{ accentColor:m.color, height:20, opacity:1,
                              WebkitAppearance:"none", appearance:"none",
                              background:"transparent", cursor:"pointer" }}/>
                        </div>
                        {/* Class ceiling label — only show if near or over */}
                        {val >= cls.max - 5 && (
                          <div className="text-[8px] text-right mt-0.5"
                            style={{ color: overCeiling ? BRAND.colors.yellow : "#475569" }}>
                            {overCeiling
                              ? `↑ Above ${cls.name} ceiling (${cls.max})`
                              : `${cls.name} ceiling: ${cls.max}`}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Top 2 stats highlight */}
                  {topStats.length > 0 && (
                    <div className="flex gap-2 pt-1">
                      {topStats.map(s => (
                        <span key={s.key} className="flex-1 text-center py-1.5 rounded-lg text-xs font-black"
                          style={{ background:`${s.color}18`, color:s.color, border:`1px solid ${s.color}44` }}>
                          ↑ {s.key} {s.val}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
          )}

          {/* ═══════════════════════════════════════════════════
              STEP 4 — YOUR WORLD
          ═══════════════════════════════════════════════════ */}
          {step === 4 && (
            <div className="space-y-4 py-2">
              {/* Country */}
              <div className="relative">
                <div className="text-[9px] font-black tracking-widest mb-1.5" style={{ color:"#64748b" }}>COUNTRY</div>
                <div className="relative">
                  <input className="w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none"
                    style={{ background:GLASS.sm, border:`1px solid rgba(255,255,255,0.12)`, color:"#fff" }}
                    placeholder="Search country…"
                    value={form.country
                      ? `${COUNTRIES.find(([n]) => n===form.country)?.[1] || ""} ${form.country}`
                      : countrySearch}
                    onChange={e => { setCountrySearch(e.target.value); set("country",""); setShowCountryDD(true); }}
                    onFocus={() => { setShowCountryDD(true); setCountrySearch(""); }}/>
                  {showCountryDD && (
                    <div className="absolute z-20 w-full mt-1 rounded-xl overflow-hidden overflow-y-auto"
                      style={{ background:"#1e293b", border:"1px solid rgba(255,255,255,0.1)", maxHeight:180 }}>
                      {filteredCountries.slice(0,40).map(([name, flag]) => (
                        <button key={name}
                          className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:brightness-125"
                          style={{ color: form.country===name ? "#fff" : "#94a3b8",
                                   background: form.country===name ? GLASS.md : "transparent" }}
                          onClick={() => { set("country", name); setShowCountryDD(false); setCountrySearch(""); }}>
                          <span style={{ fontSize:18 }}>{flag}</span>{name}
                        </button>
                      ))}
                      {filteredCountries.length === 0 && (
                        <div className="px-3 py-2 text-xs" style={{ color:"#475569" }}>No results</div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Positions */}
              <div>
                <div className="text-[9px] font-black tracking-widest mb-1.5" style={{ color:"#64748b" }}>POSITION(S)</div>
                <div className="flex flex-wrap gap-1.5">
                  {ALL_POSITIONS.map(pos => {
                    const selected = (form.positions || "").split(",").filter(Boolean).includes(pos);
                    return (
                      <button key={pos} onClick={() => {
                        const arr = (form.positions || "").split(",").filter(Boolean);
                        const next = selected ? arr.filter(p => p!==pos) : [...arr, pos];
                        set("positions", next.join(","));
                      }}
                      className="px-2 py-1 rounded-lg text-[10px] font-bold transition-all"
                      style={{
                        background: selected ? "rgba(45,122,58,0.2)"  : GLASS.xs,
                        border:     selected ? `1px solid ${BRAND.colors.green}` : "1px solid rgba(255,255,255,0.07)",
                        color:      selected ? "#fff" : "#64748b",
                      }}>
                        {pos}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Preferred foot */}
              <div>
                <div className="text-[9px] font-black tracking-widest mb-1.5" style={{ color:"#64748b" }}>PREFERRED FOOT</div>
                <div className="flex gap-2">
                  {["Left","Right","Both"].map(f => (
                    <button key={f} onClick={() => set("preferred_foot", form.preferred_foot===f ? "" : f)}
                      className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
                      style={{
                        background: form.preferred_foot===f ? "rgba(45,122,58,0.2)"  : GLASS.xs,
                        border:     form.preferred_foot===f ? `1.5px solid ${BRAND.colors.green}` : "1px solid rgba(255,255,255,0.07)",
                        color:      form.preferred_foot===f ? "#fff" : "#64748b",
                      }}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Age + Gender */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-[9px] font-black tracking-widest mb-1.5" style={{ color:"#64748b" }}>
                    AGE <span style={{ color:"#334155" }}>(private)</span>
                  </div>
                  <input type="number" min={5} max={99}
                    className="w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none"
                    style={{ background:GLASS.sm, border:`1px solid rgba(255,255,255,0.1)`, color:"#fff" }}
                    value={form.age} placeholder="—"
                    onChange={e => set("age", e.target.value)}/>
                </div>
                <div>
                  <div className="text-[9px] font-black tracking-widest mb-1.5" style={{ color:"#64748b" }}>GENDER</div>
                  <select className="w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none"
                    style={{ background:GLASS.sm, border:`1px solid rgba(255,255,255,0.1)`, color: form.gender ? "#fff" : "#64748b" }}
                    value={form.gender} onChange={e => set("gender", e.target.value)}>
                    <option value="">Prefer not to say</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Non-binary">Non-binary</option>
                  </select>
                  {form.gender && (
                    <label className="flex items-center gap-1.5 mt-1.5 cursor-pointer">
                      <input type="checkbox" checked={form.show_gender}
                        onChange={e => set("show_gender", e.target.checked)}
                        style={{ accentColor:BRAND.colors.green }}/>
                      <span className="text-[9px]" style={{ color:"#64748b" }}>Show publicly</span>
                    </label>
                  )}
                </div>
              </div>

              {/* Club info */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-[9px] font-black tracking-widest mb-1.5" style={{ color:"#64748b" }}>LOCAL CLUB</div>
                  <input className="w-full rounded-xl px-3 py-2.5 text-xs focus:outline-none"
                    style={{ background:GLASS.sm, border:`1px solid rgba(255,255,255,0.1)`, color:"#fff" }}
                    value={form.club_name} placeholder="Club name" maxLength={60}
                    onChange={e => set("club_name", e.target.value)}/>
                </div>
                <div>
                  <div className="text-[9px] font-black tracking-widest mb-1.5" style={{ color:"#64748b" }}>CLUB WEBSITE</div>
                  <input className="w-full rounded-xl px-3 py-2.5 text-xs focus:outline-none"
                    style={{ background:GLASS.sm, border:`1px solid rgba(255,255,255,0.1)`, color:"#fff" }}
                    value={form.club_website} placeholder="https://…" maxLength={120}
                    onChange={e => set("club_website", e.target.value)}/>
                </div>
              </div>

              {/* Bio */}
              <div>
                <div className="text-[9px] font-black tracking-widest mb-1.5" style={{ color:"#64748b" }}>
                  BIO <span style={{ color:"#334155" }}>({120 - (form.bio?.length||0)} left)</span>
                </div>
                <textarea rows={2}
                  className="w-full rounded-xl px-3 py-2.5 text-xs focus:outline-none resize-none"
                  style={{ background:GLASS.sm, border:`1px solid rgba(255,255,255,0.1)`, color:"#fff" }}
                  value={form.bio} placeholder="A sentence about yourself…" maxLength={120}
                  onChange={e => set("bio", e.target.value)}/>
              </div>

              {/* Social links */}
              <div>
                <div className="text-[9px] font-black tracking-widest mb-2" style={{ color:"#64748b" }}>SOCIAL LINKS</div>
                <div className="space-y-2">
                  {[
                    { key:"social_instagram", icon:"📸", placeholder:"Instagram username" },
                    { key:"social_twitter",   icon:"🐦", placeholder:"X / Twitter handle" },
                    { key:"social_tiktok",    icon:"🎵", placeholder:"TikTok username" },
                    { key:"social_youtube",   icon:"▶️", placeholder:"YouTube channel" },
                  ].map(({ key, icon, placeholder }) => (
                    <div key={key} className="flex items-center gap-2">
                      <span style={{ fontSize:16, width:22 }}>{icon}</span>
                      <input className="flex-1 rounded-lg px-3 py-2 text-xs focus:outline-none"
                        style={{ background:GLASS.sm, border:`1px solid rgba(255,255,255,0.08)`, color:"#fff" }}
                        value={form[key]} placeholder={placeholder} maxLength={80}
                        onChange={e => set(key, e.target.value)}/>
                    </div>
                  ))}
                </div>
              </div>

              {/* Privacy toggles */}
              <div className="rounded-xl p-3 space-y-2"
                style={{ background:GLASS.xs, border:"1px solid rgba(255,255,255,0.06)" }}>
                <div className="text-[9px] font-black tracking-widest mb-2"
                  style={{ color:"#64748b", letterSpacing:2 }}>WHAT'S SHOWN PUBLICLY</div>
                {[
                  { key:"show_experience", label:"Show my player class & stats", sub:"Your overall score and attribute bars" },
                  { key:"show_gender",     label:"Show my gender",               sub:"Only if you've set it above" },
                ].map(({ key, label, sub }) => (
                  <label key={key} className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" checked={!!form[key]}
                      onChange={e => set(key, e.target.checked)}
                      className="mt-0.5 shrink-0" style={{ width:14, height:14, accentColor: BRAND.colors.green }}/>
                    <div>
                      <div className="text-xs font-bold" style={{ color:"#94a3b8" }}>{label}</div>
                      <div className="text-[9px]" style={{ color:"#475569" }}>{sub}</div>
                    </div>
                  </label>
                ))}
                <div className="text-[9px] pt-1" style={{ color:"#334155" }}>
                  🔒 Email and age are always private
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer navigation ── */}
        <div className="px-5 py-4 shrink-0 space-y-2" style={{ borderTop:`1px solid ${GLASS.sm}` }}>
          <div className="flex gap-2">
            {step > 1 && (
              <button onClick={() => setStep(s => s-1)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold transition-all"
                style={{ background:GLASS.sm, color:"#64748b", border:`1px solid ${GLASS.border}`, cursor:"pointer" }}>
                ← Back
              </button>
            )}
            {step < totalSteps ? (
              <>
                <button onClick={() => setStep(s => s+1)} disabled={!canProceed()}
                  className="flex-1 py-2.5 rounded-xl text-xs font-black tracking-wide transition-all hover:brightness-110"
                  style={{
                    background: canProceed() ? BRAND.colors.green : GLASS.sm,
                    color:      canProceed() ? "#fff" : "#475569",
                    border:"none", cursor: canProceed() ? "pointer" : "not-allowed",
                    fontFamily:BRAND.fonts.display, letterSpacing:1,
                  }}>
                  NEXT →
                </button>
                {step >= 2 && !isEdit && (
                  <button onClick={() => setStep(s => s+1)}
                    className="px-3 py-2.5 rounded-xl text-xs font-bold"
                    style={{ background:GLASS.xs, color:"#475569", border:`1px solid ${GLASS.border}`, cursor:"pointer" }}>
                    Skip
                  </button>
                )}
              </>
            ) : (
              <>
                <button onClick={handleFinish} disabled={saving}
                  className="flex-1 py-2.5 rounded-xl text-xs font-black tracking-wide transition-all hover:brightness-110"
                  style={{ background:BRAND.colors.green, color:"#fff", border:"none", cursor:"pointer",
                           fontFamily:BRAND.fonts.display, letterSpacing:1 }}>
                  {saving ? "SAVING…" : isEdit ? "SAVE CHANGES ✓" : "START PLAYING ⚽"}
                </button>
                {!isEdit && (
                  <button onClick={handleFinish} disabled={saving}
                    className="px-3 py-2.5 rounded-xl text-xs font-bold transition-all"
                    style={{ background:GLASS.xs, color:"#475569", border:`1px solid ${GLASS.border}`,
                             cursor:"pointer" }}>
                    Skip
                  </button>
                )}
              </>
            )}
          </div>
          {!isEdit && step === 1 && (
            <div className="text-center space-y-1.5">
              <div className="text-[9px]" style={{ color:"#334155" }}>
                You can update everything from your profile at any time
              </div>
              <button onClick={handleFinish}
                className="text-[10px] font-bold transition-opacity hover:opacity-80"
                style={{ background:"none", border:"none", cursor:"pointer", color:"#475569", textDecoration:"underline" }}>
                Just here for the forums? Skip setup →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── CreateTeamModal ──────────────────────────────────────────────────────────
function CreateTeamModal({ session, onClose, onCreated }) {
  const [name,    setName]    = useState("");
  const [format,  setFormat]  = useState(11);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState("");

  async function handleCreate() {
    if (!name.trim()) return;
    setSaving(true); setError("");
    try {
      const t = await sb.createTeam(name.trim(), format, session.user.id, session.token);
      if (!t) { setError("Couldn't create team — try again."); return; }
      track("team_created", { format });
      // Update profile with team_id + is_captain
      await sb.upsert("profiles", {
        id: session.user.id, team_id: t.id, is_captain: true, updated_at: new Date().toISOString(),
      }, session.token).catch(() => {});
      onCreated(t);
    } catch { setError("Something went wrong."); }
    finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background:"rgba(0,0,0,0.7)", backdropFilter:"blur(4px)" }}
      onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{ background:"#0f172a", border:`1px solid ${GLASS.border}` }}
        onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom:`1px solid ${GLASS.sm}` }}>
          <div className="font-black tracking-widest text-white" style={{ fontFamily:BRAND.fonts.display, fontSize:16, letterSpacing:2 }}>CREATE TEAM</div>
          <button aria-label="Close" onClick={onClose} style={{ background:"none", border:"none", color:"#64748b", fontSize:18, cursor:"pointer" }}>✕</button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <div className="text-[9px] font-bold tracking-widest mb-1.5" style={{ color:"#94a3b8" }}>TEAM NAME *</div>
            <input className="w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none"
              style={{ background:GLASS.sm, border:`1px solid ${GLASS.border}`, color:"#fff" }}
              maxLength={40} placeholder="e.g. Hackney FC" value={name}
              onChange={e => setName(e.target.value)}
              onFocus={e => e.target.style.borderColor = BRAND.colors.yellow}
              onBlur={e => e.target.style.borderColor = GLASS.border}/>
          </div>
          <div>
            <div className="text-[9px] font-bold tracking-widest mb-1.5" style={{ color:"#94a3b8" }}>FORMAT</div>
            <div className="flex gap-2">
              {[5,7,9,11].map(f => (
                <button key={f} onClick={() => setFormat(f)}
                  className="flex-1 py-2 rounded-lg text-xs font-black transition-all"
                  style={{ background: format===f ? BRAND.colors.green : GLASS.sm,
                    color: format===f ? "#fff" : "#64748b", border:"none", cursor:"pointer" }}>
                  {f}v{f}
                </button>
              ))}
            </div>
          </div>
          {error && <p className="text-xs" style={{ color:"#f87171" }}>{error}</p>}
          <button onClick={handleCreate} disabled={!name.trim() || saving}
            className="w-full py-3 rounded-xl font-black text-sm tracking-wide transition-all"
            style={{ background: name.trim() && !saving ? BRAND.colors.green : GLASS.sm,
              color: name.trim() && !saving ? "#fff" : "#475569",
              fontFamily:BRAND.fonts.display, letterSpacing:1, cursor: name.trim() ? "pointer" : "not-allowed" }}>
            {saving ? "CREATING…" : "CREATE TEAM ⚽"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── JoinTeamModal ────────────────────────────────────────────────────────────
function JoinTeamModal({ session, onClose, onJoined }) {
  const [code,    setCode]    = useState("");
  const [found,   setFound]   = useState(null); // team object after lookup
  const [loading, setLoading] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error,   setError]   = useState("");

  async function handleLookup() {
    if (code.trim().length < 4) return;
    setLoading(true); setError(""); setFound(null);
    const t = await sb.getTeamByInviteCode(code.trim()).catch(() => null);
    setLoading(false);
    if (!t) { setError("No team found with that code."); return; }
    setFound(t);
  }

  async function handleJoin() {
    if (!found) return;
    setJoining(true); setError("");
    const ok = await sb.joinTeam(found.id, session.user.id, session.token).catch(() => false);
    if (!ok) { setError("Couldn't join — you may already be on this team."); setJoining(false); return; }
    await sb.upsert("profiles", {
      id: session.user.id, team_id: found.id, is_captain: false, updated_at: new Date().toISOString(),
    }, session.token).catch(() => {});
    track("team_joined", { format: found.format });
    onJoined(found);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background:"rgba(0,0,0,0.7)", backdropFilter:"blur(4px)" }}
      onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{ background:"#0f172a", border:`1px solid ${GLASS.border}` }}
        onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom:`1px solid ${GLASS.sm}` }}>
          <div className="font-black tracking-widest text-white" style={{ fontFamily:BRAND.fonts.display, fontSize:16, letterSpacing:2 }}>JOIN TEAM</div>
          <button aria-label="Close" onClick={onClose} style={{ background:"none", border:"none", color:"#64748b", fontSize:18, cursor:"pointer" }}>✕</button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <div className="text-[9px] font-bold tracking-widest mb-1.5" style={{ color:"#94a3b8" }}>INVITE CODE</div>
            <div className="flex gap-2">
              <input className="flex-1 rounded-xl px-3 py-2.5 text-sm focus:outline-none uppercase tracking-widest"
                style={{ background:GLASS.sm, border:`1px solid ${GLASS.border}`, color:"#fff", letterSpacing:4 }}
                maxLength={8} placeholder="HACK23" value={code}
                onChange={e => { setCode(e.target.value.toUpperCase()); setFound(null); setError(""); }}
                onFocus={e => e.target.style.borderColor = BRAND.colors.yellow}
                onBlur={e => e.target.style.borderColor = GLASS.border}/>
              <button onClick={handleLookup} disabled={code.trim().length < 4 || loading}
                className="px-4 rounded-xl text-xs font-black transition-all"
                style={{ background: code.trim().length >= 4 ? BRAND.colors.yellow : GLASS.sm,
                  color: code.trim().length >= 4 ? "#111" : "#475569",
                  border:"none", cursor: code.trim().length >= 4 ? "pointer" : "not-allowed" }}>
                {loading ? "…" : "FIND"}
              </button>
            </div>
          </div>
          {found && (
            <div className="rounded-xl p-3" style={{ background:GLASS.sm, border:`1px solid ${BRAND.colors.green}` }}>
              <div className="font-black text-white text-sm">{found.name}</div>
              <div className="text-xs mt-0.5" style={{ color:"#64748b" }}>{found.format}v{found.format}</div>
            </div>
          )}
          {error && <p className="text-xs" style={{ color:"#f87171" }}>{error}</p>}
          {found && (
            <button onClick={handleJoin} disabled={joining}
              className="w-full py-3 rounded-xl font-black text-sm tracking-wide transition-all"
              style={{ background: BRAND.colors.green, color:"#fff",
                fontFamily:BRAND.fonts.display, letterSpacing:1, cursor:"pointer" }}>
              {joining ? "JOINING…" : `JOIN ${found.name.toUpperCase()} ✓`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── ManageSquadModal ─────────────────────────────────────────────────────────
function ManageSquadModal({ session, team, members, onClose, onUpdated }) {
  const [local,   setLocal]   = useState(members.map(m => ({ ...m })));
  const [saving,  setSaving]  = useState(false);
  const [inviteCode, setInviteCode] = useState(team.invite_code);
  const [copied,  setCopied]  = useState(false);
  const myRole    = local.find(m => m.user_id === session.user.id)?.role;
  const isCaptain = myRole === ROLE_CAPTAIN;

  function updateLocal(userId, updates) {
    setLocal(prev => prev.map(m => m.user_id === userId ? { ...m, ...updates } : m));
  }

  async function handleSave() {
    setSaving(true);
    for (const m of local) {
      await sb.updateMember(team.id, m.user_id, { role: m.role, jersey: m.jersey || null, position: m.position || null }, session.token).catch(() => {});
    }
    onUpdated(local);
    setSaving(false);
    onClose();
  }

  async function handleRemove(userId) {
    if (!window.confirm("Remove this player from the squad?")) return;
    await sb.removeMember(team.id, userId, session.token).catch(() => {});
    setLocal(prev => prev.filter(m => m.user_id !== userId));
  }

  async function handleRegenCode() {
    if (!window.confirm("Generate a new invite code? The old one will stop working.")) return;
    const newCode = await sb.regenerateInviteCode(team.id, session.token).catch(() => null);
    if (newCode) setInviteCode(newCode);
  }

  function copyCode() {
    navigator.clipboard?.writeText(inviteCode).catch(() => {});
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }

  const canManage = myRole === ROLE_CAPTAIN || myRole === ROLE_ASSISTANT;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background:"rgba(0,0,0,0.75)", backdropFilter:"blur(4px)" }}
      onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl flex flex-col"
        style={{ background:"#0f172a", border:`1px solid ${GLASS.border}`, maxHeight:"90vh" }}
        onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between shrink-0" style={{ borderBottom:`1px solid ${GLASS.sm}` }}>
          <div>
            <div className="font-black tracking-widest text-white" style={{ fontFamily:BRAND.fonts.display, fontSize:15, letterSpacing:2 }}>MANAGE SQUAD</div>
            <div className="text-[10px] mt-0.5" style={{ color:"#64748b" }}>{team.name} · {team.format}v{team.format}</div>
          </div>
          <button aria-label="Close" onClick={onClose} style={{ background:"none", border:"none", color:"#64748b", fontSize:18, cursor:"pointer" }}>✕</button>
        </div>

        {/* Invite code */}
        <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom:`1px solid ${GLASS.sm}`, background:GLASS.xs }}>
          <div>
            <div className="text-[9px] font-bold tracking-widest" style={{ color:"#475569" }}>INVITE CODE</div>
            <div className="font-black text-lg tracking-widest" style={{ color:BRAND.colors.yellow, letterSpacing:6, fontFamily:BRAND.fonts.display }}>{inviteCode}</div>
          </div>
          <div className="flex gap-2">
            <button onClick={copyCode}
              className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
              style={{ background: copied ? "rgba(34,197,94,0.15)" : GLASS.sm,
                color: copied ? "#4ade80" : "#94a3b8",
                border:`1px solid ${copied ? "rgba(34,197,94,0.4)" : GLASS.border}` }}>
              {copied ? "✓ Copied" : "Copy"}
            </button>
            {isCaptain && (
              <button onClick={handleRegenCode}
                className="px-3 py-1.5 rounded-lg text-xs font-bold"
                style={{ background:GLASS.sm, color:"#ef4444", border:`1px solid rgba(239,68,68,0.3)`, cursor:"pointer" }}>
                Regen
              </button>
            )}
          </div>
        </div>

        {/* Squad list */}
        <div className="overflow-y-auto flex-1 px-5 py-3 space-y-2">
          {local.map(m => {
            const name = m.profiles?.display_name || "Player";
            const avatar = m.profiles?.avatar_emoji || "⚽";
            const isMe = m.user_id === session.user.id;
            const isMemberCaptain = m.role === ROLE_CAPTAIN;
            return (
              <div key={m.user_id} className="rounded-xl p-3" style={{ background:GLASS.sm, border:`1px solid ${GLASS.border}` }}>
                <div className="flex items-center gap-2 mb-2">
                  <span style={{ fontSize:20 }}>{avatar}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-white truncate">
                      {name} {isMe && <span style={{ color:"#64748b", fontSize:10 }}>(you)</span>}
                    </div>
                    <div className="text-[10px]" style={{ color:"#475569" }}>{ROLE_BADGE[m.role]} {ROLE_LABEL[m.role]}</div>
                  </div>
                  {/* Role toggle — captain can promote/demote non-captains */}
                  {isCaptain && !isMe && (
                    <button onClick={() => updateLocal(m.user_id, {
                      role: m.role === ROLE_ASSISTANT ? ROLE_PLAYER : ROLE_ASSISTANT
                    })}
                      className="text-[10px] font-bold px-2 py-1 rounded-lg transition-all"
                      style={{ background: m.role === ROLE_ASSISTANT ? "rgba(245,197,24,0.15)" : GLASS.xs,
                        color: m.role === ROLE_ASSISTANT ? BRAND.colors.yellow : "#475569",
                        border:`1px solid ${m.role === ROLE_ASSISTANT ? "rgba(245,197,24,0.3)" : GLASS.border}` }}>
                      {m.role === ROLE_ASSISTANT ? "⭐ Asst" : "Make Asst"}
                    </button>
                  )}
                  {/* Remove — captain or assistant can remove non-captains */}
                  {canManage && !isMe && !isMemberCaptain && (
                    <button onClick={() => handleRemove(m.user_id)}
                      className="text-[10px] font-bold px-2 py-1 rounded-lg"
                      style={{ background:GLASS.xs, color:"#ef4444", border:"none", cursor:"pointer" }}>✕</button>
                  )}
                </div>
                {/* Jersey + Position inline editors */}
                {canManage && (
                  <div className="flex gap-2">
                    <input className="flex-1 rounded-lg px-2 py-1 text-xs focus:outline-none"
                      style={{ background:GLASS.xs, border:`1px solid ${GLASS.border}`, color:"#fff" }}
                      value={m.jersey || ""} maxLength={2} placeholder="#00"
                      onChange={e => updateLocal(m.user_id, { jersey: e.target.value.replace(/[^0-9]/g,"").slice(0,2) })}/>
                    <select className="flex-1 rounded-lg px-2 py-1 text-xs focus:outline-none"
                      style={{ background:GLASS.xs, border:`1px solid ${GLASS.border}`, color: m.position ? "#fff" : "#475569" }}
                      value={m.position || ""}
                      onChange={e => updateLocal(m.user_id, { position: e.target.value })}>
                      <option value="">Position…</option>
                      {ALL_POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        {canManage && (
          <div className="px-5 py-4 shrink-0" style={{ borderTop:`1px solid ${GLASS.sm}` }}>
            <button onClick={handleSave} disabled={saving}
              className="w-full py-2.5 rounded-xl font-black text-sm tracking-wide transition-all"
              style={{ background: BRAND.colors.green, color:"#fff", fontFamily:BRAND.fonts.display, letterSpacing:1, cursor:"pointer" }}>
              {saving ? "SAVING…" : "SAVE CHANGES ✓"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Profile Tab ──────────────────────────────────────────────────────────────
function ProfileTab({ session, profile, team, teamMembers, onShowAuth, onSignOut,
  onEditProfile, onCreateTeam, onJoinTeam, onManageSquad, onLeaveTeam, players }) {

  // ── Signed-out state ───────────────────────────────────────────────────────
  if (!session) {
    return (
      <div className="w-full max-w-md mx-auto px-4 py-16 flex flex-col items-center gap-6 text-center">
        <div style={{ fontSize:56 }}>👤</div>
        <div>
          <div className="font-black tracking-wide text-white mb-2"
            style={{ fontFamily:BRAND.fonts.display, fontSize:22, letterSpacing:1 }}>
            YOUR PROFILE
          </div>
          <p className="text-sm leading-relaxed" style={{ color:"#64748b" }}>
            Sign in to access your profile, manage your squad, track your stats, and connect with teammates.
          </p>
        </div>
        <button onClick={onShowAuth}
          className="px-8 py-3 rounded-xl font-black text-sm tracking-wide transition-all hover:brightness-110 active:scale-95"
          style={{ background:BRAND.colors.green, color:"#fff", fontFamily:BRAND.fonts.display, letterSpacing:1 }}>
          SIGN IN / CREATE ACCOUNT ⚽
        </button>
        <div className="w-full rounded-2xl p-5 text-left" style={{ background:GLASS.sm, border:`1px solid ${GLASS.border}` }}>
          <div className="text-[10px] font-black tracking-widest mb-3" style={{ color:BRAND.colors.yellow, fontFamily:BRAND.fonts.display, letterSpacing:3 }}>
            WHAT YOU GET
          </div>
          {[
            ["🎖️", "Captain & squad management"],
            ["⚽", "Load your team onto the pitch in one tap"],
            ["💾", "Lineup auto-saved across all devices"],
            ["🏟️", "Community posts & forum history"],
            ["📊", "Player stats tracking"],
          ].map(([icon, text]) => (
            <div key={text} className="flex items-center gap-3 mb-2.5 text-sm" style={{ color:"#94a3b8" }}>
              <span style={{ fontSize:16 }}>{icon}</span>
              <span>{text}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Signed-in state ────────────────────────────────────────────────────────
  const myMember  = teamMembers.find(m => m.user_id === session?.user?.id);
  const myRole    = myMember?.role;
  const lastUp    = profile?.attrs_last_updated;
  const daysLeft  = lastUp
    ? Math.max(0, 30 - Math.floor((Date.now() - new Date(lastUp).getTime()) / 86400000))
    : 0;

  // Aggregate player stats from the current roster
  const totalGoals    = players.reduce((s, p) => s + (p.goals       || 0), 0);
  const totalAssists  = players.reduce((s, p) => s + (p.assists     || 0), 0);
  const totalApps     = players.reduce((s, p) => s + (p.appearances || 0), 0);
  const totalYellows  = players.reduce((s, p) => s + (p.yellowCards || 0), 0);
  const totalReds     = players.reduce((s, p) => s + (p.redCards    || 0), 0);
  const hasStats      = totalGoals + totalAssists + totalApps > 0;

  return (
    <div className="w-full max-w-2xl mx-auto px-3 sm:px-6 py-6 space-y-5" style={{ fontFamily:BRAND.fonts.body }}>

      {/* ── Identity card ─────────────────────────────────────────────────── */}
      <div className="rounded-2xl overflow-hidden" style={{ background:GLASS.sm, border:`1px solid ${GLASS.border}` }}>
        <div className="flex items-center gap-4 p-5">
          <div className="flex items-center justify-center rounded-2xl text-4xl shrink-0"
            style={{ width:64, height:64, background:GLASS.md, border:`1px solid ${GLASS.border}` }}>
            {profile?.avatar_emoji || session.email?.[0]?.toUpperCase() || "⚽"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-black text-white text-lg truncate">
              {profile?.display_name || session.email?.split("@")[0]}
            </div>
            {profile?.team_name && (
              <div className="text-xs mt-0.5" style={{ color:"#64748b" }}>🏟️ {profile.team_name}</div>
            )}
            <div className="text-xs mt-0.5 truncate" style={{ color:"#475569" }}>{session.email}</div>
          </div>
          <button onClick={onEditProfile}
            className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-black tracking-wide transition-all hover:brightness-110"
            style={{ background:BRAND.colors.green, color:"#fff", border:"none" }}>
            ✏️ Edit Profile
          </button>
        </div>
      </div>

      {/* ── Profile Details ──────────────────────────────────────────────── */}
      <div>
        <div className="text-[10px] font-black tracking-widest mb-3 flex items-center gap-3"
          style={{ fontFamily:BRAND.fonts.display, color:BRAND.colors.yellow, letterSpacing:3 }}>
          PROFILE DETAILS
          <div className="flex-1 h-px" style={{ background:GLASS.sm }}/>
          <button onClick={onEditProfile}
            className="text-[9px] font-bold px-2.5 py-1 rounded-lg transition-all hover:brightness-125"
            style={{ background:GLASS.sm, color:"#64748b", border:`1px solid ${GLASS.border}` }}>
            ✏️ Edit
          </button>
        </div>

        <div className="rounded-2xl overflow-hidden divide-y"
          style={{ background:GLASS.sm, border:`1px solid ${GLASS.border}`,
                   borderColor: GLASS.border, divideColor: GLASS.border }}>
          {[
            {
              icon: "🎭", label: "Role",
              value: ROLES_IN_SPORT.find(r => r.id === profile?.role_in_sport)?.label,
              empty: "Not set",
            },
            {
              icon: "🌍", label: "Country",
              value: profile?.country
                ? `${COUNTRIES.find(([n]) => n === profile.country)?.[1] || ""} ${profile.country}`
                : null,
              empty: "Add your country",
            },
            {
              icon: "📍", label: "Position(s)",
              value: profile?.positions
                ? profile.positions.split(",").filter(Boolean).join(" · ")
                : null,
              empty: "Not set",
            },
            {
              icon: "👟", label: "Preferred foot",
              value: profile?.preferred_foot || null,
              empty: "Not set",
            },
            {
              icon: "🏟️", label: "Club",
              value: profile?.club_name || null,
              empty: "Add your club",
            },
            {
              icon: "📝", label: "Bio",
              value: profile?.bio || null,
              empty: "Add a bio",
              wide: true,
            },
            {
              icon: "📸", label: "Instagram",
              value: profile?.social_instagram ? `@${profile.social_instagram}` : null,
              empty: "Not linked",
            },
            {
              icon: "🐦", label: "X / Twitter",
              value: profile?.social_twitter ? `@${profile.social_twitter}` : null,
              empty: "Not linked",
            },
            {
              icon: "🎵", label: "TikTok",
              value: profile?.social_tiktok ? `@${profile.social_tiktok}` : null,
              empty: "Not linked",
            },
            {
              icon: "▶️", label: "YouTube",
              value: profile?.social_youtube || null,
              empty: "Not linked",
            },
            {
              icon: "🔒", label: "Age",
              value: "Private — never shown publicly",
              muted: true,
            },
          ].map(({ icon, label, value, empty, wide, muted }) => (
            <div key={label} className="flex items-start gap-3 px-4 py-2.5"
              style={{ borderBottom:`1px solid rgba(255,255,255,0.04)` }}>
              <span className="text-base shrink-0 mt-0.5">{icon}</span>
              <div className="w-24 shrink-0">
                <span className="text-[10px] font-bold" style={{ color:"#475569" }}>{label}</span>
              </div>
              <div className={wide ? "text-xs leading-relaxed" : "text-xs font-bold"}
                style={{ color: muted ? "#334155" : value ? "#f1f5f9" : "#334155",
                         fontStyle: muted ? "italic" : "normal", flex:1 }}>
                {muted
                  ? <span style={{ color:"#334155", fontStyle:"italic" }}>{value}</span>
                  : value || (
                    <span className="flex items-center gap-1.5" style={{ color:"#334155" }}>
                      <span>{empty}</span>
                      <span style={{ color: BRAND.colors.green, fontSize:10 }}>+</span>
                    </span>
                  )}
              </div>
            </div>
          ))}
        </div>

        {/* Live privacy toggles */}
        <div className="mt-2 rounded-xl p-3 space-y-2"
          style={{ background:GLASS.xs, border:`1px solid rgba(255,255,255,0.06)` }}>
          <div className="text-[9px] font-black tracking-widest"
            style={{ color:"#475569", letterSpacing:2 }}>WHAT'S SHOWN PUBLICLY</div>
          {[
            {
              key:   "show_experience",
              label: "Player class & stats",
              sub:   profile?.show_experience !== false ? "Visible to others" : "Hidden",
            },
            {
              key:   "show_gender",
              label: "Gender",
              sub:   profile?.gender
                ? (profile?.show_gender ? `Shown (${profile.gender})` : "Hidden")
                : "Set a gender first in Edit Profile",
              disabled: !profile?.gender,
            },
          ].map(({ key, label, sub, disabled }) => (
            <label key={key}
              className={`flex items-center gap-3 ${disabled ? "" : "cursor-pointer"}`}>
              <input type="checkbox"
                checked={!!profile?.[key]}
                disabled={!!disabled}
                onChange={async e => {
                  const val = e.target.checked;
                  await sb.upsert("profiles", {
                    id: session.user.id, [key]: val, updated_at: new Date().toISOString(),
                  }, session.token).catch(() => {});
                  // optimistic — parent will re-load on next visit
                }}
                style={{ width:14, height:14,
                  accentColor: disabled ? "#334155" : BRAND.colors.green,
                  cursor: disabled ? "not-allowed" : "pointer" }}/>
              <div>
                <div className="text-xs font-bold"
                  style={{ color: disabled ? "#334155" : "#94a3b8" }}>{label}</div>
                <div className="text-[9px]"
                  style={{ color: disabled ? "#1e293b" : "#475569" }}>{sub}</div>
              </div>
            </label>
          ))}
          <div className="text-[9px] pt-0.5" style={{ color:"#1e293b" }}>
            🔒 Email and age are always private
          </div>
        </div>
      </div>

      {/* ── Player Card ───────────────────────────────────────────────────── */}
      {          <div>
            <div className="text-[10px] font-black tracking-widest mb-3 flex items-center gap-3"
              style={{ fontFamily:BRAND.fonts.display, color:BRAND.colors.yellow, letterSpacing:3 }}>
              PLAYER CARD
              <div className="flex-1 h-px" style={{ background:GLASS.sm }}/>
            </div>
            <FCPlayerCard profile={profile} compact={false}/>
            <div className="mt-2">
              {daysLeft > 0 ? (
                <div className="text-center text-[10px]" style={{ color:"#475569" }}>
                  🔒 Next stat update in {daysLeft} day{daysLeft!==1?"s":""}
                </div>
              ) : (
                <button onClick={onEditProfile}
                  className="w-full py-2 rounded-xl text-xs font-bold transition-all hover:brightness-110"
                  style={{ background:GLASS.sm, color:"#94a3b8", border:`1px solid ${GLASS.border}` }}>
                  ⚡ Update My Stats
                </button>
              )}
            </div>
          </div>

      }

      {/* ── Team card ─────────────────────────────────────────────────────── */}
      <div>
        <div className="text-[10px] font-black tracking-widest mb-3 flex items-center gap-3"
          style={{ fontFamily:BRAND.fonts.display, color:BRAND.colors.yellow, letterSpacing:3 }}>
          TEAM
          <div className="flex-1 h-px" style={{ background:GLASS.sm }}/>
        </div>

        {team ? (
          <div className="rounded-2xl overflow-hidden" style={{ background:GLASS.sm, border:`1px solid ${GLASS.border}` }}>
            <div className="p-4">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <div className="font-black text-white text-base">{team.name}</div>
                  <div className="text-xs mt-0.5" style={{ color:"#64748b" }}>
                    {team.format}v{team.format} · {teamMembers.length} player{teamMembers.length !== 1 ? "s" : ""}
                  </div>
                </div>
                {myRole && myRole !== ROLE_PLAYER && (
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full shrink-0"
                    style={{
                      background: myRole === ROLE_CAPTAIN ? "rgba(245,197,24,0.15)" : "rgba(99,102,241,0.15)",
                      color:      myRole === ROLE_CAPTAIN ? BRAND.colors.yellow : "#a5b4fc",
                      border:    `1px solid ${myRole === ROLE_CAPTAIN ? "rgba(245,197,24,0.3)" : "rgba(99,102,241,0.3)"}`,
                    }}>
                    {ROLE_BADGE[myRole]} {ROLE_LABEL[myRole]}
                  </span>
                )}
              </div>

              {/* Squad avatars */}
              {teamMembers.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {teamMembers.map(m => (
                    <div key={m.user_id} className="flex flex-col items-center gap-1"
                      title={m.profiles?.display_name || "Player"}>
                      <div className="flex items-center justify-center rounded-xl text-xl"
                        style={{ width:40, height:40, background:GLASS.md, border:`1px solid ${m.user_id === session.user.id ? BRAND.colors.yellow : GLASS.border}` }}>
                        {m.profiles?.avatar_emoji || "⚽"}
                      </div>
                      <span className="text-[9px] font-bold truncate" style={{ color:"#64748b", maxWidth:40 }}>
                        {m.profiles?.display_name?.split(" ")[0] || "Player"}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Invite code — visible to captain/assistant */}
              {(myRole === ROLE_CAPTAIN || myRole === ROLE_ASSISTANT) && team.invite_code && (
                <div className="rounded-xl px-3 py-2 mb-3 flex items-center justify-between"
                  style={{ background:GLASS.xs, border:`1px solid ${GLASS.border}` }}>
                  <div>
                    <div className="text-[9px] font-bold tracking-widest" style={{ color:"#475569" }}>INVITE CODE</div>
                    <div className="font-black tracking-widest text-sm" style={{ color:BRAND.colors.yellow, letterSpacing:5 }}>
                      {team.invite_code}
                    </div>
                  </div>
                  <button onClick={() => navigator.clipboard?.writeText(team.invite_code).catch(()=>{})}
                    className="text-xs font-bold px-2.5 py-1.5 rounded-lg"
                    style={{ background:GLASS.sm, color:"#94a3b8", border:`1px solid ${GLASS.border}` }}>
                    Copy
                  </button>
                </div>
              )}

              <div className="flex gap-2">
                <button onClick={onManageSquad}
                  className="flex-1 py-2 rounded-lg text-xs font-bold transition-all"
                  style={{ background:BRAND.colors.green, color:"#fff", border:"none", cursor:"pointer" }}>
                  Manage Squad
                </button>
                <button onClick={onLeaveTeam}
                  className="py-2 px-3 rounded-lg text-xs font-bold"
                  style={{ background:"rgba(220,38,38,0.08)", color:"#ef4444", border:"1px solid rgba(220,38,38,0.2)", cursor:"pointer" }}>
                  Leave
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex gap-3">
            <button onClick={onCreateTeam}
              className="flex-1 py-3 rounded-xl text-sm font-black tracking-wide transition-all hover:brightness-110"
              style={{ background:BRAND.colors.green, color:"#fff", border:"none", cursor:"pointer", fontFamily:BRAND.fonts.display, letterSpacing:1 }}>
              CREATE TEAM
            </button>
            <button onClick={onJoinTeam}
              className="flex-1 py-3 rounded-xl text-sm font-black tracking-wide transition-all"
              style={{ background:GLASS.sm, color:"#94a3b8", border:`1px solid ${GLASS.border}`, cursor:"pointer", fontFamily:BRAND.fonts.display, letterSpacing:1 }}>
              JOIN WITH CODE
            </button>
          </div>
        )}
      </div>

      {/* ── Roster stats ──────────────────────────────────────────────────── */}
      {hasStats && (
        <div>
          <div className="text-[10px] font-black tracking-widest mb-3 flex items-center gap-3"
            style={{ fontFamily:BRAND.fonts.display, color:BRAND.colors.yellow, letterSpacing:3 }}>
            SQUAD STATS (CURRENT ROSTER)
            <div className="flex-1 h-px" style={{ background:GLASS.sm }}/>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {[
              { label:"Goals",    value:totalGoals,   color:BRAND.colors.green  },
              { label:"Assists",  value:totalAssists, color:"#6366f1"            },
              { label:"Apps",     value:totalApps,    color:"#94a3b8"            },
              { label:"Yellows",  value:totalYellows, color:BRAND.colors.yellow },
              { label:"Reds",     value:totalReds,    color:BRAND.colors.red    },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-xl p-3 text-center"
                style={{ background:GLASS.sm, border:`1px solid ${GLASS.border}` }}>
                <div className="font-black text-xl" style={{ color }}>{value}</div>
                <div className="text-[9px] mt-0.5 font-bold" style={{ color:"#475569" }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Account ───────────────────────────────────────────────────────── */}
      <div>
        <div className="text-[10px] font-black tracking-widest mb-3 flex items-center gap-3"
          style={{ fontFamily:BRAND.fonts.display, color:BRAND.colors.yellow, letterSpacing:3 }}>
          ACCOUNT
          <div className="flex-1 h-px" style={{ background:GLASS.sm }}/>
        </div>

        {/* Activity stats */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="rounded-xl p-3 text-center"
            style={{ background:GLASS.sm, border:`1px solid ${GLASS.border}` }}>
            <div className="font-black text-2xl" style={{ color:BRAND.colors.green }}>
              {profile?.post_count ?? "—"}
            </div>
            <div className="text-[9px] font-bold mt-0.5" style={{ color:"#475569" }}>
              POSTS
            </div>
          </div>
          <div className="rounded-xl p-3 text-center"
            style={{ background:GLASS.sm, border:`1px solid ${GLASS.border}` }}>
            <div className="font-black text-2xl" style={{ color:BRAND.colors.yellow }}>
              {profile?.overall_score || 10}
            </div>
            <div className="text-[9px] font-bold mt-0.5" style={{ color:"#475569" }}>
              OVERALL
            </div>
          </div>
        </div>

        <div className="rounded-2xl p-4 mb-3" style={{ background:"rgba(45,122,58,0.08)", border:`1px solid rgba(45,122,58,0.2)` }}>
          <div className="text-xs font-bold mb-1" style={{ color:BRAND.colors.green }}>⚽ ROSTER AUTO-SAVE</div>
          <div className="text-xs leading-relaxed" style={{ color:"#64748b" }}>
            Your lineup, formation, and team colours are automatically saved and restored on every visit.
          </div>
        </div>
        <button onClick={onSignOut}
          className="w-full py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all hover:brightness-110"
          style={{ background:"rgba(220,38,38,0.1)", color:"#ef4444", border:"1px solid rgba(220,38,38,0.2)", cursor:"pointer" }}>
          SIGN OUT
        </button>
      </div>

    </div>
  );
}

// ─── Profile Panel (slim slide-in — full features in Profile tab) ────────────
function ProfilePanel({ session, profile, team, teamMembers, onClose,
  onSignOut, onGoProfile }) {
  if (!session) return null;

  const myRole    = teamMembers?.find(m => m.user_id === session?.user?.id)?.role;
  const cardStyle = (team && CLASS_CARD_STYLES[profile?.player_class]) || null;
  const countryEntry = COUNTRIES.find(([n]) => n === profile?.country);
  const flag = countryEntry?.[1] || "";

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose}
        style={{ background:"rgba(0,0,0,0.4)" }}/>
      <div className="fixed top-0 right-0 h-full z-50 flex flex-col"
        style={{ width:"min(300px,100vw)", background:"#0f172a",
                 borderLeft:"1px solid rgba(255,255,255,0.08)",
                 boxShadow:"-8px 0 32px rgba(0,0,0,0.5)" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4"
          style={{ borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
          <div className="font-black tracking-wide text-white"
            style={{ fontFamily:BRAND.fonts.display, fontSize:16, letterSpacing:1 }}>MY PROFILE</div>
          <button onClick={onClose} aria-label="Close"
            style={{ color:"#64748b", background:"none", border:"none", cursor:"pointer", fontSize:18 }}>✕</button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

          {/* Identity */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center rounded-2xl text-3xl shrink-0"
              style={{ width:52, height:52, background:GLASS.md, border:`1px solid ${GLASS.border}` }}>
              {profile?.avatar_emoji || session.email?.[0]?.toUpperCase() || "⚽"}
            </div>
            <div className="min-w-0">
              <div className="font-bold text-sm truncate text-white">
                {profile?.display_name || session.email?.split("@")[0]}
                {flag && <span className="ml-1.5" style={{ fontSize:14 }}>{flag}</span>}
              </div>
              {profile?.player_class && (
                <div className="text-[10px] mt-0.5" style={{ color:"#64748b" }}>
                  {PLAYER_CLASSES.find(c => c.name === profile.player_class)?.emoji || ""} {profile.player_class}
                </div>
              )}
              <div className="text-xs mt-0.5 truncate" style={{ color:"#475569" }}>{session.email}</div>
            </div>
          </div>

          {/* Go to full profile */}
          <button onClick={() => { onGoProfile(); onClose(); }}
            className="w-full py-2.5 rounded-xl text-xs font-black tracking-wide transition-all hover:brightness-110"
            style={{ background:BRAND.colors.green, color:"#fff", border:"none",
                     cursor:"pointer", fontFamily:BRAND.fonts.display, letterSpacing:1 }}>
            VIEW FULL PROFILE →
          </button>

          {/* Team quick view */}
          {team && (
            <div className="rounded-xl p-3"
              style={{ background:GLASS.sm, border:`1px solid ${GLASS.border}` }}>
              <div className="text-[9px] font-black tracking-widest mb-1"
                style={{ color:BRAND.colors.yellow, letterSpacing:3 }}>TEAM</div>
              <div className="font-bold text-sm text-white truncate">{team.name}</div>
              <div className="text-[10px] mt-0.5" style={{ color:"#64748b" }}>
                {team.format}v{team.format} · {teamMembers?.length || 0} players
                {myRole && myRole !== ROLE_PLAYER && (
                  <span className="ml-2" style={{ color:BRAND.colors.yellow }}>
                    {ROLE_BADGE[myRole]} {ROLE_LABEL[myRole]}
                  </span>
                )}
              </div>
              {(myRole === ROLE_CAPTAIN || myRole === ROLE_ASSISTANT) && team.invite_code && (
                <div className="mt-2 text-[10px] font-black tracking-widest"
                  style={{ color:BRAND.colors.yellow, letterSpacing:4 }}>
                  {team.invite_code}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sign out */}
        <div className="px-5 pb-5 pt-3" style={{ borderTop:`1px solid ${GLASS.sm}` }}>
          <button onClick={onSignOut}
            className="w-full py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all hover:brightness-110"
            style={{ background:"rgba(220,38,38,0.12)", color:"#ef4444",
                     border:"1px solid rgba(220,38,38,0.2)", cursor:"pointer" }}>
            SIGN OUT
          </button>
        </div>
      </div>
    </>
  );
}

export default ProfileTab;
export { ProfileTab, ProfilePanel, FCPlayerCard, PlayerSetupModal,
         CreateTeamModal, JoinTeamModal, ManageSquadModal, CLASS_CARD_STYLES };
