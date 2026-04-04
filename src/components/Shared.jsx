// ─── Shared components ───────────────────────────────────────────────────────
import React, { useState, useRef, useEffect } from "react";
import { GLASS, BRAND, CLS_HDR, CLS_BADGE, CLS_CARD, CLS_ROW } from "./tokens.js";
import { sb, SUPABASE_URL } from "./supabase.js";
import { track } from "./helpers.js";

// ─── AdBanner component ──────────────────────────────────────────────────────
// slot: your AdSense ad-slot ID (create slots at adsense.google.com → Ads → By ad unit)
// format: "auto" | "rectangle" | "horizontal"
function AdBanner({ slot = "auto", format = "auto", style = {} }) {
  const ref = useRef(null);
  useEffect(() => {
    // Guard: only push once per mount, and only when the script is loaded
    try {
      if (ref.current && ref.current.offsetWidth > 0) {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (e) {
      // adsbygoogle not ready yet — silently ignore
    }
  }, []);

  return (
    <div style={{ overflow:"hidden", textAlign:"center", ...style }}>
      <ins
        ref={ref}
        className="adsbygoogle"
        style={{ display:"block" }}
        data-ad-client="ca-pub-8766361022177380"
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}

// ─── Auth Modal ───────────────────────────────────────────────────────────────
function AuthModal({ onClose, onAuth }) {
  const [mode,     setMode]     = useState("signin"); // "signin" | "signup"
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit() {
    if (!email.trim() || !password.trim()) return;
    setLoading(true); setError("");
    try {
      const res = mode === "signup" ? await sb.signUp(email, password) : await sb.signIn(email, password);
      if (res.error || res.error_description) {
        setError(res.error_description || res.error?.message || "Something went wrong.");
      } else {
        const token = res.access_token;
        const user  = res.user;
        if (!token || !user?.id) {
          setError("Sign in failed — please check your email is confirmed and try again.");
          return;
        }
        track(mode === "signup" ? "sign_up" : "login", { method: "email" });
        onAuth({ token, user, email: user.email });
        onClose();
      }
    } catch(e) { setError("Network error — please try again."); }
    finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background:"rgba(0,0,0,0.75)", backdropFilter:"blur(4px)" }} onClick={onClose}>
      <div className="rounded-t-3xl sm:rounded-2xl w-full max-w-sm"
        style={{ background:"#0f1b2d", border:`1px solid rgba(255,255,255,0.1)`, boxShadow:"0 -8px 40px rgba(0,0,0,0.6)" }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4" style={{ borderBottom:`1px solid rgba(255,255,255,0.07)` }}>
          <div>
            <div className={CLS_HDR} style={{ fontFamily:BRAND.fonts.display, fontSize:20, color:"#fff", letterSpacing:1 }}>
              {mode === "signup" ? "CREATE ACCOUNT" : "WELCOME BACK"}
            </div>
            <div className="text-xs mt-0.5" style={{ color:"#475569" }}>FCRoster.com</div>
          </div>
          <button onClick={onClose} aria-label="Close"
            style={{ background:"none", border:"none", cursor:"pointer", color:"#475569", fontSize:20, width:44, height:44, display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
        </div>

        <div className="p-5 flex flex-col gap-3">

          {/* Google Sign In — primary CTA */}
          <button onClick={() => sb.signInWithGoogle()}
            className="w-full flex items-center justify-center gap-3 py-3 rounded-xl font-bold text-sm transition-all hover:brightness-105 active:scale-95"
            style={{ background:"#fff", color:"#1f2937", border:"none", cursor:"pointer", fontFamily:BRAND.fonts.body }}>
            {/* Google SVG icon */}
            <svg width="20" height="20" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              <path fill="none" d="M0 0h48v48H0z"/>
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px" style={{ background:GLASS.lg }}/>
            <span className={CLS_BADGE} style={{ color:"#334155" }}>OR</span>
            <div className="flex-1 h-px" style={{ background:GLASS.lg }}/>
          </div>

          {/* Email + password */}
          <input type="email" id="auth-email" name="email" autoComplete="email" maxLength={254} placeholder="Email address"
            className="w-full rounded-xl px-3 py-2.5 focus:outline-none"
            style={{ background:GLASS.sm, border:`1px solid rgba(255,255,255,0.1)`, color:"#f1f5f9", fontFamily:BRAND.fonts.body, fontSize:16 }}
            value={email} onChange={e => setEmail(e.target.value)}/>
          <input type="password" id="auth-password" name="password" autoComplete="current-password"
            maxLength={128} placeholder="Password (min 8 characters)" minLength={8}
            className="w-full rounded-xl px-3 py-2.5 focus:outline-none"
            style={{ background:GLASS.sm, border:`1px solid rgba(255,255,255,0.1)`, color:"#f1f5f9", fontFamily:BRAND.fonts.body, fontSize:16 }}
            value={password} onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSubmit()}/>

          {error && <p className="text-xs" style={{ color:"#f87171" }}>{error}</p>}

          <button onClick={handleSubmit} disabled={loading || !email.trim() || !password.trim()}
            className="w-full py-2.5 rounded-xl font-black text-sm tracking-wide transition-all hover:brightness-110 active:scale-95"
            style={{ background: email.trim() && password.trim() ? BRAND.colors.yellow : GLASS.sm,
              color: email.trim() && password.trim() ? "#111" : "#475569",
              fontFamily:BRAND.fonts.body, border:"none",
              cursor: email.trim() && password.trim() ? "pointer" : "default" }}>
            {loading ? "Please wait…" : mode === "signup" ? "Create Account" : "Sign In"}
          </button>

          <button onClick={() => { setMode(m => m==="signin"?"signup":"signin"); setError(""); }}
            className="text-xs text-center transition-opacity hover:opacity-70"
            style={{ background:"none", border:"none", cursor:"pointer", color:"#64748b", fontFamily:BRAND.fonts.body }}>
            {mode === "signin" ? "No account? Sign up →" : "Already have an account? Sign in →"}
          </button>

        </div>
      </div>
    </div>
  );
}

// ─── About Tab ────────────────────────────────────────────────────────────────
function AboutTab({ session = null, onShowAuth = () => {}, onGoProfile = () => {} }) {
  const features = [
    { icon:"⚽", title:"Players"  },
    { icon:"🎽", title:"Coaches"  },
    { icon:"🏆", title:"Leagues"  },
  ];

  const [feedback, setFeedback] = useState({ name:"", type:"suggestion", message:"" });
  const [submitted, setSubmitted] = useState(false);
  const [sending,   setSending]   = useState(false);
  const [sendError, setSendError] = useState("");
  const [showLegal, setShowLegal] = useState(false);

  async function handleSubmit() {
    if (!feedback.message.trim()) return;
    setSending(true);
    setSendError("");
    try {
      const res = await fetch("https://formspree.io/f/xlgoezry", {
        method:  "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          name:    feedback.name || "Anonymous",
          type:    feedback.type,
          message: feedback.message,
        }),
      });
      if (res.ok) {
        setSubmitted(true);
      } else {
        setSendError("Something went wrong. Please try again.");
      }
    } catch {
      setSendError("No connection. Please try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <>
    <div className="w-full max-w-2xl mx-auto px-3 sm:px-6 py-6 sm:py-8 space-y-8 sm:space-y-10" style={{ fontFamily: BRAND.fonts.body }}>

      {/* Hero */}
      <div className="rounded-2xl relative overflow-hidden" style={{ background:"#fdfef8", border:`1px solid rgba(0,0,0,0.08)` }}>
        {/* Pitch lines in background */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 220" preserveAspectRatio="xMidYMid slice">
          <rect x="16" y="10" width="368" height="200" rx="4" fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="1.5"/>
          <line x1="16" y1="110" x2="384" y2="110" stroke="rgba(0,0,0,0.08)" strokeWidth="1"/>
          <circle cx="200" cy="110" r="40" fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="1"/>
          <circle cx="200" cy="110" r="2" fill="rgba(0,0,0,0.1)"/>
          <rect x="130" y="10" width="140" height="42" fill="none" stroke="rgba(0,0,0,0.07)" strokeWidth="1"/>
          <rect x="130" y="168" width="140" height="42" fill="none" stroke="rgba(0,0,0,0.07)" strokeWidth="1"/>
          <rect x="160" y="10" width="80" height="18" fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="1"/>
          <rect x="160" y="192" width="80" height="18" fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="1"/>
        </svg>
        {/* Content */}
        <div className="relative flex flex-col items-center justify-center py-10 px-6 text-center gap-4">
          {/* Logo fills its container */}
          <img src={LOGO_SRC} alt="FCRoster.com" loading="lazy" style={{ width:"min(180px, 45vw)", height:"min(180px, 45vw)", objectFit:"contain" }}/>
          <div>
            <div className="font-black leading-none" style={{ fontFamily: BRAND.fonts.display, fontSize:"clamp(28px, 8vw, 44px)", color:"#111827", letterSpacing:2 }}>
              FCROSTER.COM
            </div>
            <div className="mt-2 font-bold tracking-widest" style={{ fontFamily: BRAND.fonts.body, fontSize:"clamp(11px, 3vw, 14px)", color:"#4a5568", letterSpacing:3 }}>
              CONNECT. ORGANIZE. COMPETE.
            </div>
          </div>
        </div>
      </div>

      {/* What we do */}
      <section>
        <p className="text-sm leading-relaxed" style={{ color:"rgba(255,255,255,0.75)" }}>
          FCRoster.com was built by footballers, for footballers. We know the chaos of managing a recreational team — the group chats, the spreadsheets, the last-minute dropouts. So we built one simple, powerful platform that brings everything together, from your local Sunday league to international amateur competitions.
        </p>
      </section>

      {/* Who it's for */}
      <section>
        <div className="text-[10px] font-black tracking-widest uppercase mb-4 flex items-center gap-3"
          style={{ fontFamily: BRAND.fonts.display, color: BRAND.colors.yellow, letterSpacing:3 }}>
          Who It's For
          <div className="flex-1 h-px" style={{ background: BRAND.colors.border }}/>
        </div>
        <div className="flex gap-3">
          {features.map(({ icon, title }) => (
            <div key={title} className="flex-1 rounded-xl p-4 flex flex-col items-center gap-2 text-center"
              style={{ background: BRAND.colors.card, border:`1px solid ${BRAND.colors.border}` }}>
              <div className="text-2xl">{icon}</div>
              <div className="text-sm font-bold text-white">{title}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Feedback */}
      <section>
        <div className="text-[10px] font-black tracking-widest uppercase mb-4 flex items-center gap-3"
          style={{ fontFamily: BRAND.fonts.display, color: BRAND.colors.yellow, letterSpacing:3 }}>
          Share Your Thoughts
          <div className="flex-1 h-px" style={{ background: BRAND.colors.border }}/>
        </div>

        <div className="rounded-2xl p-5" style={{ background: BRAND.colors.card, border:`1px solid ${BRAND.colors.border}` }}>
          {submitted ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <div style={{ fontSize:40 }}>🙏</div>
              <div className="text-sm font-bold text-white">Thanks for your feedback!</div>
              <p className="text-xs leading-relaxed" style={{ color:"rgba(255,255,255,0.5)" }}>
                Every suggestion helps us build a better tool for the global football community.
              </p>
              <button onClick={() => { setSubmitted(false); setFeedback({ name:"", type:"suggestion", message:"" }); }}
                className="mt-2 px-4 py-1.5 rounded-lg text-xs font-bold"
                style={{ background:GLASS.md, color:"#9ca3af", border:`1px solid rgba(255,255,255,0.1)` }}>
                Send another
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <p className="text-xs leading-relaxed" style={{ color:"rgba(255,255,255,0.55)" }}>
                Got an idea? Found something that could be better? We're all ears — this tool is shaped by the community that uses it. Drop us a note below.
              </p>

              {/* Type selector */}
              <div className="flex gap-2">
                {[
                  { value:"suggestion", label:"💡 Suggestion" },
                  { value:"bug",        label:"🐛 Bug report"  },
                  { value:"other",      label:"💬 Other"       },
                ].map(({ value, label }) => (
                  <button key={value} onClick={() => setFeedback(f => ({ ...f, type: value }))}
                    className="flex-1 py-1.5 rounded-lg text-xs font-bold transition-all"
                    style={{
                      background: feedback.type === value ? `${BRAND.colors.yellow}18` : GLASS.xs,
                      border: `1px solid ${feedback.type === value ? BRAND.colors.yellow : GLASS.lg}`,
                      color: feedback.type === value ? BRAND.colors.yellow : "#6b7280",
                    }}>
                    {label}
                  </button>
                ))}
              </div>

              {/* Name */}
              <input
                maxLength={80} placeholder="Your name (optional)"
                value={feedback.name}
                onChange={e => setFeedback(f => ({ ...f, name: e.target.value }))}
                className="w-full rounded-xl px-3 py-2.5 text-xs focus:outline-none"
                style={{ background:GLASS.xs, border:`1px solid rgba(255,255,255,0.08)`, color:"#fff" }}
                onFocus={e => e.target.style.borderColor = BRAND.colors.yellow}
                onBlur={e => e.target.style.borderColor = GLASS.lg}/>

              {/* Message */}
              <textarea
                rows={4} maxLength={2000}
                placeholder="Tell us what's on your mind — feature ideas, formations you'd love to see, or anything else..."
                value={feedback.message}
                onChange={e => setFeedback(f => ({ ...f, message: e.target.value }))}
                className="w-full rounded-xl px-3 py-2.5 text-xs focus:outline-none resize-none"
                style={{ background:GLASS.xs, border:`1px solid rgba(255,255,255,0.08)`, color:"#fff" }}
                onFocus={e => e.target.style.borderColor = BRAND.colors.yellow}
                onBlur={e => e.target.style.borderColor = GLASS.lg}/>

              <button onClick={handleSubmit} disabled={!feedback.message.trim() || sending}
                className="w-full py-2.5 rounded-xl text-sm font-bold transition-all"
                style={{
                  background: feedback.message.trim() && !sending ? BRAND.colors.yellow : GLASS.sm,
                  color: feedback.message.trim() && !sending ? "#111" : "#4b5563",
                  fontFamily: BRAND.fonts.body,
                  cursor: feedback.message.trim() && !sending ? "pointer" : "not-allowed",
                }}>
                {sending ? "Sending…" : "Send Feedback ✦"}
              </button>
              {sendError && (
                <p className="text-xs text-center mt-1" style={{ color:"#f87171" }}>{sendError}</p>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Ad — above legal link */}
      {/* Session-aware CTA */}
      {session ? (
        <button onClick={onGoProfile}
          className="mx-auto flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black tracking-wide transition-all hover:brightness-110 mb-4"
          style={{ background:"rgba(45,122,58,0.15)", color:"#4ade80", border:"1px solid rgba(45,122,58,0.3)", display:"flex" }}>
          {session.email?.split("@")[0] ? `👋 View your profile →` : "👤 Go to Profile →"}
        </button>
      ) : (
        <button onClick={onShowAuth}
          className="mx-auto flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black tracking-wide transition-all hover:brightness-110 active:scale-95 mb-4"
          style={{ background:BRAND.colors.green, color:"#fff", border:"none", display:"flex" }}>
          ⚽ Sign In / Create Account
        </button>
      )}
      <AdBanner
        slot="3024866198"
        format="auto"
        style={{ margin:"8px 0", borderRadius:12, overflow:"hidden" }}
      />

      {/* Legal link */}
      <div className="text-center pt-2 pb-4">
        <button onClick={() => setShowLegal(true)}
          className="text-xs font-bold tracking-widest uppercase transition-all hover:opacity-80"
          style={{ color: BRAND.colors.muted, letterSpacing:2, fontFamily: BRAND.fonts.body }}>
          Legal
        </button>
      </div>

    </div>

      {/* Legal Modal — outside scroll container so fixed positioning works */}
      {showLegal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background:"rgba(0,0,0,0.75)", backdropFilter:"blur(4px)" }}
          onClick={() => setShowLegal(false)}>
          <div className="w-full max-w-lg rounded-2xl overflow-hidden flex flex-col"
            style={{ background:"#0f172a", border:`1px solid rgba(255,255,255,0.1)`, maxHeight:"85vh" }}
            onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 shrink-0"
              style={{ borderBottom:`1px solid rgba(255,255,255,0.08)` }}>
              <div>
                <div className="font-black tracking-widest" style={{ fontFamily: BRAND.fonts.display, fontSize:18, color:"#fff", letterSpacing:2 }}>
                  LEGAL DISCLAIMER
                </div>
                <div className="text-[9px] mt-0.5 tracking-widest uppercase" style={{ color: BRAND.colors.muted }}>FCRoster.com · Last updated 2025</div>
              </div>
              <button onClick={() => setShowLegal(false)}
                className="rounded-full flex items-center justify-center text-sm font-bold transition-all hover:opacity-70"
                style={{ width:44, height:44, background:"transparent", border:"none", color:"rgba(255,255,255,0.5)", cursor:"pointer", fontSize:18 }}>✕</button>
            </div>
            {/* Scrollable body */}
            <div className="overflow-y-auto px-5 py-5 space-y-5 text-xs leading-relaxed" style={{ color:"rgba(255,255,255,0.65)" }}>

              <p style={{ color:"rgba(255,255,255,0.85)" }}>
                Please read this Legal Disclaimer carefully before using FCRoster.com (the "Service"). By accessing or using the Service, you acknowledge that you have read, understood, and agree to be bound by the terms set out below.
              </p>

              {[
                {
                  title:"1. No Warranty — Use at Your Own Risk",
                  body:"FCRoster.com is provided strictly on an \"as is\" and \"as available\" basis, without warranty of any kind, whether express, implied, statutory, or otherwise. We expressly disclaim all warranties, including but not limited to implied warranties of merchantability, fitness for a particular purpose, accuracy, completeness, availability, and non-infringement. We do not warrant that the Service will be uninterrupted, error-free, secure, or free from viruses or other harmful components.",
                },
                {
                  title:"2. Limitation of Liability",
                  body:"To the fullest extent permitted by applicable law, FCRoster.com, its operators, directors, employees, agents, partners, and affiliates shall not be liable for any direct, indirect, incidental, special, consequential, punitive, or exemplary damages arising out of or in connection with your use of or inability to use the Service, including but not limited to loss of data, loss of revenue, loss of goodwill, personal injury, or any other intangible losses, even if we have been advised of the possibility of such damages.",
                },
                {
                  title:"3. User Responsibility",
                  body:"You are solely and entirely responsible for your use of the Service and for all content, data, and information you submit, upload, or share through the Service. You agree to use the Service in compliance with all applicable local, national, and international laws and regulations. Any tactical, coaching, or organisational decisions made using information derived from the Service are made at your sole discretion and risk. FCRoster.com accepts no responsibility for decisions made in reliance on content provided through the Service.",
                },
                {
                  title:"4. Accuracy of Information",
                  body:"While we endeavour to ensure that the information provided on FCRoster.com is accurate and up to date, we make no representations, warranties, or guarantees of any kind as to the accuracy, reliability, completeness, or timeliness of any content, formation data, tactical advice, or other information available through the Service. Tactical and coaching content is provided for informational and entertainment purposes only and should not be relied upon as professional advice.",
                },
                {
                  title:"5. Third-Party Content & Links",
                  body:"The Service may contain links to or references to third-party websites, services, or content. FCRoster.com does not endorse, control, or assume responsibility for any third-party content, products, or services. Your use of any third-party resources is entirely at your own risk and subject to the applicable third-party terms.",
                },
                {
                  title:"6. Data & Privacy",
                  body:"Any data, player information, team names, or personal information you input into the Service is your responsibility. You warrant that you have the right to use any such data and that doing so does not violate any applicable law or the rights of any third party. FCRoster.com shall not be liable for the loss, corruption, or unauthorised access of any user-inputted data.",
                },
                {
                  title:"7. Intellectual Property",
                  body:"All content, branding, design, software, and materials on FCRoster.com are the intellectual property of FCRoster.com and its licensors. You may not reproduce, distribute, modify, or create derivative works without prior written permission. The FCRoster.com name, logo, and tagline \"Connect. Organize. Compete.\" are proprietary marks.",
                },
                {
                  title:"8. Indemnification",
                  body:"You agree to indemnify, defend, and hold harmless FCRoster.com, its operators, directors, employees, and agents from and against any and all claims, damages, obligations, losses, liabilities, costs, and expenses (including legal fees) arising from: (a) your use of the Service; (b) your violation of these terms; (c) your violation of any applicable law or the rights of any third party; or (d) any content you submit to or through the Service.",
                },
                {
                  title:"9. Modifications to the Service",
                  body:"FCRoster.com reserves the right to modify, suspend, or discontinue the Service (or any part thereof) at any time, with or without notice. We shall not be liable to you or any third party for any such modification, suspension, or discontinuation.",
                },
                {
                  title:"10. Governing Law",
                  body:"This disclaimer shall be governed by and construed in accordance with applicable law. Any dispute arising in connection with your use of the Service shall be subject to the exclusive jurisdiction of the relevant courts. If any provision of this disclaimer is found to be unenforceable, the remaining provisions shall continue in full force and effect.",
                },
                {
                  title:"11. Changes to This Disclaimer",
                  body:"FCRoster.com reserves the right to update or modify this Legal Disclaimer at any time. Continued use of the Service after any such changes constitutes your acceptance of the revised terms. It is your responsibility to review this disclaimer periodically.",
                },
              ].map(({ title, body }) => (
                <div key={title}>
                  <div className="font-bold mb-1" style={{ color:"rgba(255,255,255,0.9)", fontSize:11 }}>{title}</div>
                  <p>{body}</p>
                </div>
              ))}

              <p className="pt-2" style={{ color:"rgba(255,255,255,0.4)", fontSize:10 }}>
                © 2025 FCRoster.com. All rights reserved. By using this Service you confirm your acceptance of this disclaimer in full.
              </p>
            </div>
          </div>
        </div>
      )}

    </>
  );
}

export { AdBanner, AuthModal, AboutTab };
