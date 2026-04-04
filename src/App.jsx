import React, { useState, useRef, useEffect, useMemo, useCallback, memo } from "react";

// ─── Brand Tokens ─────────────────────────────────────────────────────────────
// Shared glass-effect rgba values — defined first so BRAND.colors.border can reference GLASS.lg
const GLASS = {
  xs:  "rgba(255,255,255,0.04)",
  sm:  "rgba(255,255,255,0.06)",
  md:  "rgba(255,255,255,0.07)",
  lg:  "rgba(255,255,255,0.08)",
  xl:  "rgba(255,255,255,0.10)",
  border: "rgba(255,255,255,0.12)",
};

// Reusable className fragments — pure strings, no deps, safe at module top
const CLS_HDR   = "font-black tracking-wider";       // section headers
const CLS_BADGE = "text-xs font-bold";                // small badges/labels
const CLS_CARD  = "rounded-2xl overflow-hidden";      // card containers
const CLS_ROW   = "flex items-center gap-2";          // inline rows

const BRAND = {
  colors: {
    green:  "#2d7a3a",
    yellow: "#f5c518",
    red:    "#dc2626",
    navy:   "#0f172a",
    card:   "#1e293b",
    border: GLASS.lg,
    muted:  "#64748b",
    white:  "#ffffff",
  },
  fonts: {
    display: "'Bebas Neue', 'Impact', sans-serif",
    body:    "'DM Sans', 'Segoe UI', system-ui, sans-serif",
  },
};

// ─── Real Logo Assets ─────────────────────────────────────────────────────────
const LOGO_SRC = "/logo.png";
const FAVICON_SRC = "/favicon.png";

// Inject favicon, fonts and rendering hints into document head
if (typeof document !== "undefined") {
  // Google Fonts — Bebas Neue (display) + DM Sans (body)
  // ── Preconnect for fonts (render-unblocking) ────────────────────────────
  function addLink(attrs) {
    const el = document.createElement("link");
    Object.entries(attrs).forEach(([k,v]) => el.setAttribute(k, v));
    document.head.appendChild(el);
  }
  if (!document.querySelector("link[rel='preconnect'][href*='googleapis']")) {
    addLink({ rel:"preconnect", href:"https://fonts.googleapis.com" });
    addLink({ rel:"preconnect", href:"https://fonts.gstatic.com", crossorigin:"" });
    // DNS prefetch for AdSense — resolves hostnames before async scripts run
    addLink({ rel:"dns-prefetch", href:"https://pagead2.googlesyndication.com" });
    addLink({ rel:"dns-prefetch", href:"https://googleads.g.doubleclick.net" });
  }

  // ── Google Fonts ─────────────────────────────────────────────────────────
  if (!document.querySelector("link[data-fcroster-fonts]")) {
    const gf = document.createElement("link");
    gf.rel = "stylesheet";
    gf.href = "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;600;700;800;900&display=swap";
    gf.setAttribute("data-fcroster-fonts", "1");
    document.head.appendChild(gf);
  }

  // ── Favicon + Apple touch icon ────────────────────────────────────────────
  const existing = document.querySelector("link[rel~='icon']");
  if (existing) existing.href = FAVICON_SRC;
  else addLink({ rel:"icon", type:"image/png", href:FAVICON_SRC });

  const existingApple = document.querySelector("link[rel='apple-touch-icon']");
  if (existingApple) existingApple.href = LOGO_SRC;
  else addLink({ rel:"apple-touch-icon", href:LOGO_SRC });

  // ── PWA web manifest ──────────────────────────────────────────────────────
  if (!document.querySelector("link[rel='manifest']")) {
    const manifest = {
      name: "FCRoster.com",
      short_name: "FCRoster",
      description: "Build lineups, set formations, and connect with your football community.",
      start_url: "/",
      display: "standalone",
      background_color: "#0f172a",
      theme_color: "#2d7a3a",
      icons: [{ src: FAVICON_SRC, sizes: "64x64", type: "image/png" }, { src: LOGO_SRC, sizes: "any", type: "image/png" }],
    };
    const blob = new Blob([JSON.stringify(manifest)], { type:"application/json" });
    addLink({ rel:"manifest", href: URL.createObjectURL(blob) });
  }

  // ── Theme colour (browser chrome tinting on mobile) ───────────────────────
  if (!document.querySelector("meta[name='theme-color']")) {
    const tc = document.createElement("meta");
    tc.name = "theme-color"; tc.content = "#2d7a3a";
    document.head.appendChild(tc);
  }

  // ── SEO meta tags ─────────────────────────────────────────────────────────
  function setMeta(attrs) {
    const sel = Object.entries(attrs).filter(([k]) => k !== "content").map(([k,v]) => `[${k}="${v}"]`).join("");
    let el = document.querySelector(`meta${sel}`);
    if (!el) { el = document.createElement("meta"); Object.entries(attrs).filter(([k]) => k !== "content").forEach(([k,v]) => el.setAttribute(k,v)); document.head.appendChild(el); }
    el.setAttribute("content", attrs.content);
  }
  const DESC = "FCRoster.com — the free football lineup builder. Set formations, manage your squad, and discuss tactics with coaches worldwide.";
  const SITE_URL = "https://fcroster.com";
  setMeta({ name:"description", content:DESC });
  setMeta({ name:"robots",         content:"index, follow" });
  setMeta({ name:"referrer",        content:"strict-origin-when-cross-origin" });
  // Open Graph
  setMeta({ property:"og:type",        content:"website" });
  setMeta({ property:"og:url",         content:SITE_URL });
  setMeta({ property:"og:title",       content:"FCRoster.com — Connect. Organize. Compete." });
  setMeta({ property:"og:description", content:DESC });
  setMeta({ property:"og:image",       content:`${SITE_URL}/og-image.png` });
  setMeta({ property:"og:site_name",   content:"FCRoster.com" });
  // Twitter Card
  setMeta({ name:"twitter:card",        content:"summary_large_image" });
  setMeta({ name:"twitter:title",       content:"FCRoster.com — Connect. Organize. Compete." });
  setMeta({ name:"twitter:description", content:DESC });
  setMeta({ name:"twitter:image",       content:`${SITE_URL}/og-image.png` });
  // Canonical
  if (!document.querySelector("link[rel='canonical']")) addLink({ rel:"canonical", href:SITE_URL });

  // ── JSON-LD structured data ───────────────────────────────────────────────
  if (!document.querySelector("script[data-fcroster-ld]")) {
    const ld = document.createElement("script");
    ld.type = "application/ld+json";
    ld.setAttribute("data-fcroster-ld", "1");
    ld.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "FCRoster.com",
      "url": SITE_URL,
      "description": DESC,
      "applicationCategory": "SportsApplication",
      "operatingSystem": "Web",
      "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
      "featureList": ["Football lineup builder", "Formation planner", "Community forum", "Tactical playmaker"],
    });
    document.head.appendChild(ld);
  }

  // ── CSS keyframes for animations ─────────────────────────────────────────
  if (!document.querySelector("style[data-fcroster-css]")) {
    const style = document.createElement("style");
    style.setAttribute("data-fcroster-css", "1");
    style.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
    document.head.appendChild(style);
  }
  document.title = "FCRoster.com — Connect. Organize. Compete.";

  // ── Google AdSense ───────────────────────────────────────────────────────
  if (!document.querySelector("script[data-adsense]")) {
    const ads = document.createElement("script");
    ads.setAttribute("data-adsense", "1");
    ads.async = true;
    ads.crossOrigin = "anonymous";
    ads.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8766361022177380";
    document.head.appendChild(ads);
  }

  // ── Google Analytics 4 ───────────────────────────────────────────────────
  // ⚠️  REPLACE THIS with your GA4 Measurement ID from:
  //     analytics.google.com → Admin → Data Streams → Web stream → Measurement ID
  const GA_ID = "G-XXXXXXXXXX";
  if (GA_ID !== "G-XXXXXXXXXX" && !document.querySelector("script[data-ga4]")) {
    // Load gtag.js
    const s = document.createElement("script");
    s.setAttribute("data-ga4", "1");
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    document.head.appendChild(s);

    // Init — send_page_view:false because we fire page_view manually on tab change
    window.dataLayer = window.dataLayer || [];
    window.gtag = function() { window.dataLayer.push(arguments); }; // eslint-disable-line prefer-rest-params
    window.gtag("js", new Date());
    window.gtag("config", GA_ID, { send_page_view: false, transport_type: "beacon" });
  }
}

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

// ─── Analytics helper — call anywhere in the app ──────────────────────────────
function track(eventName, params = {}) {
  if (typeof window.gtag === "function") {
    window.gtag("event", eventName, params);
  }
}

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
    "4-5-1": [
      { id:"gk",  x:50, y:90, pos:"GK" },
      { id:"rb",  x:80, y:74, pos:"RB" }, { id:"rcb", x:62, y:74, pos:"CB" },
      { id:"lcb", x:38, y:74, pos:"CB" }, { id:"lb",  x:20, y:74, pos:"LB" },
      { id:"rm",  x:82, y:50, pos:"RM" }, { id:"rcm", x:64, y:50, pos:"CM" },
      { id:"cm",  x:50, y:50, pos:"CM" }, { id:"lcm", x:36, y:50, pos:"CM" },
      { id:"lm",  x:18, y:50, pos:"LM" },
      { id:"st",  x:50, y:20, pos:"ST" },
    ],
    "3-4-2-1": [
      { id:"gk",  x:50, y:90, pos:"GK" },
      { id:"rcb", x:68, y:74, pos:"CB" }, { id:"cb",  x:50, y:74, pos:"CB" },
      { id:"lcb", x:32, y:74, pos:"CB" },
      { id:"rm",  x:78, y:54, pos:"RM" }, { id:"rcm", x:60, y:54, pos:"CM" },
      { id:"lcm", x:40, y:54, pos:"CM" }, { id:"lm",  x:22, y:54, pos:"LM" },
      { id:"rss", x:62, y:32, pos:"SS" }, { id:"lss", x:38, y:32, pos:"SS" },
      { id:"st",  x:50, y:16, pos:"ST" },
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
    "2-3-2": [
      { id:"gk",  x:50, y:88, pos:"GK" },
      { id:"rcb", x:65, y:72, pos:"CB" }, { id:"lcb", x:35, y:72, pos:"CB" },
      { id:"rm",  x:75, y:50, pos:"RM" }, { id:"cm",  x:50, y:50, pos:"CM" },
      { id:"lm",  x:25, y:50, pos:"LM" },
      { id:"rs",  x:67, y:22, pos:"ST" }, { id:"ls",  x:33, y:22, pos:"ST" },
    ],
  },
  5: {
    "1-2-1": [
      { id:"gk", x:50, y:88, pos:"GK" },
      { id:"cb", x:50, y:68, pos:"CB" },
      { id:"rm", x:72, y:46, pos:"CM" }, { id:"lm", x:28, y:46, pos:"CM" },
      { id:"st", x:50, y:22, pos:"ST" },
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
  9: {
    "3-3-2": [
      { id:"gk",  x:50, y:90, pos:"GK" },
      { id:"rb",  x:75, y:72, pos:"RB" }, { id:"cb",  x:50, y:72, pos:"CB" },
      { id:"lb",  x:25, y:72, pos:"LB" },
      { id:"rm",  x:72, y:50, pos:"RM" }, { id:"cm",  x:50, y:50, pos:"CM" },
      { id:"lm",  x:28, y:50, pos:"LM" },
      { id:"rs",  x:65, y:24, pos:"ST" }, { id:"ls",  x:35, y:24, pos:"ST" },
    ],
    "3-2-3": [
      { id:"gk",  x:50, y:90, pos:"GK" },
      { id:"rb",  x:75, y:72, pos:"RB" }, { id:"cb",  x:50, y:72, pos:"CB" },
      { id:"lb",  x:25, y:72, pos:"LB" },
      { id:"rcm", x:65, y:52, pos:"CM" }, { id:"lcm", x:35, y:52, pos:"CM" },
      { id:"rw",  x:75, y:24, pos:"RW" }, { id:"st",  x:50, y:18, pos:"ST" },
      { id:"lw",  x:25, y:24, pos:"LW" },
    ],
    "2-3-3": [
      { id:"gk",  x:50, y:90, pos:"GK" },
      { id:"rcb", x:65, y:74, pos:"CB" }, { id:"lcb", x:35, y:74, pos:"CB" },
      { id:"rm",  x:75, y:52, pos:"RM" }, { id:"cm",  x:50, y:52, pos:"CM" },
      { id:"lm",  x:25, y:52, pos:"LM" },
      { id:"rw",  x:72, y:24, pos:"RW" }, { id:"st",  x:50, y:18, pos:"ST" },
      { id:"lw",  x:28, y:24, pos:"LW" },
    ],
    "4-2-2": [
      { id:"gk",  x:50, y:90, pos:"GK" },
      { id:"rb",  x:78, y:72, pos:"RB" }, { id:"rcb", x:60, y:72, pos:"CB" },
      { id:"lcb", x:40, y:72, pos:"CB" }, { id:"lb",  x:22, y:72, pos:"LB" },
      { id:"rcm", x:65, y:50, pos:"CM" }, { id:"lcm", x:35, y:50, pos:"CM" },
      { id:"rs",  x:65, y:24, pos:"ST" }, { id:"ls",  x:35, y:24, pos:"ST" },
    ],
    "2-4-2": [
      { id:"gk",  x:50, y:90, pos:"GK" },
      { id:"rcb", x:65, y:74, pos:"CB" }, { id:"lcb", x:35, y:74, pos:"CB" },
      { id:"rm",  x:78, y:52, pos:"RM" }, { id:"rcm", x:58, y:52, pos:"CM" },
      { id:"lcm", x:42, y:52, pos:"CM" }, { id:"lm",  x:22, y:52, pos:"LM" },
      { id:"rs",  x:65, y:24, pos:"ST" }, { id:"ls",  x:35, y:24, pos:"ST" },
    ],
    "3-4-1": [
      { id:"gk",  x:50, y:90, pos:"GK" },
      { id:"rb",  x:75, y:72, pos:"RB" }, { id:"cb",  x:50, y:72, pos:"CB" },
      { id:"lb",  x:25, y:72, pos:"LB" },
      { id:"rm",  x:78, y:52, pos:"RM" }, { id:"rcm", x:58, y:52, pos:"CM" },
      { id:"lcm", x:42, y:52, pos:"CM" }, { id:"lm",  x:22, y:52, pos:"LM" },
      { id:"st",  x:50, y:20, pos:"ST" },
    ],
  },
};

const FORMAT_DEFAULTS = { 11:"4-4-2", 9:"3-3-2", 7:"3-2-1", 5:"1-2-1" };

// ─── Helpers ──────────────────────────────────────────────────────────────────
function contrastColor(hex) {
  const r=parseInt(hex.slice(1,3),16), g=parseInt(hex.slice(3,5),16), b=parseInt(hex.slice(5,7),16);
  return (0.299*r+0.587*g+0.114*b) > 150 ? "#111" : "#fff";
}

// ─── Logo Component ───────────────────────────────────────────────────────────
function NetworkSphere({ size = 48 }) {
  return (
    <img
      src={LOGO_SRC}
      alt="FCRoster.com logo"
      width={size}
      height={size}
      loading="eager"
      fetchPriority="high"
      style={{ objectFit:"contain", display:"block", flexShrink:0 }}
    />
  );
}

// ─── Inline name editor ───────────────────────────────────────────────────────
function InlineEdit({ value, onChange, placeholder, textStyle = {}, className = "" }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef(null);

  function open(e) { e.stopPropagation(); setDraft(value); setEditing(true); setTimeout(() => ref.current?.select(), 0); }
  function commit() { setEditing(false); onChange(draft); }

  if (editing) {
    return (
      <input ref={ref} autoFocus maxLength={30}
        className="text-center font-bold bg-white text-gray-900 rounded px-1 outline-none shadow-xl"
        style={{ width:90, fontSize:11, zIndex:60, position:"relative", border:`2px solid ${BRAND.colors.yellow}`, textTransform:"uppercase", letterSpacing:0.5 }}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key==="Enter") commit(); if (e.key==="Escape") setEditing(false); }}
        onClick={e => e.stopPropagation()}
      />
    );
  }
  return (
    <span onClick={open} className={`cursor-pointer select-none text-center block truncate leading-tight ${className}`}
      style={{ maxWidth:120, ...textStyle }} title="Tap to edit">
      {value || <span style={{ opacity:0.38 }}>{placeholder}</span>}
    </span>
  );
}

// ─── Player spot ──────────────────────────────────────────────────────────────
const PlayerSpot = memo(function PlayerSpot({ player, subName, jerseyColor, onStarterChange, onSubChange, onCirclePointerDown, moveMode }) {
  const fg = contrastColor(jerseyColor);
  return (
    <div className="absolute flex flex-col items-center select-none"
      style={{ left:`${player.x}%`, top:`${player.y}%`, transform:"translate(-50%,-50%)", zIndex:10, gap:1 }}>
      {/* Circle — the ONLY drag handle. Only responds in moveMode */}
      <div
        className="rounded-full flex items-center justify-center font-black shadow-xl border-2 border-white/60"
        style={{ width:44, height:44, flexShrink:0, background:jerseyColor, color:fg, letterSpacing:0,
          fontSize: player.pos.length >= 3 ? 11 : player.pos.length === 2 ? 15 : 18,
          lineHeight:1, textAlign:"center",
          cursor: moveMode ? "grab" : "default",
          touchAction:"none",
        }}
        onPointerDown={moveMode ? (e => onCirclePointerDown(e, player.id)) : undefined}>
        {player.pos}
      </div>
      {/* Text labels — always respond to tap for editing, never move */}
      <InlineEdit value={player.name} onChange={onStarterChange} placeholder="STARTER"
        className="font-bold text-white"
        textStyle={{ fontSize:13, textShadow:"0 1px 6px rgba(0,0,0,1)", fontWeight:700, textTransform:"uppercase", letterSpacing:0.5 }}/>
      <InlineEdit value={subName} onChange={onSubChange} placeholder="+ SUB"
        className="font-medium"
        textStyle={{ fontSize:12, textShadow:"0 1px 5px rgba(0,0,0,0.95)", color:BRAND.colors.yellow, opacity:0.9, fontStyle:"italic", textTransform:"uppercase", letterSpacing:0.5 }}/>
    </div>
  );
}); // ← closes memo(PlayerSpot)

// ─── Pitch markings ───────────────────────────────────────────────────────────
function PitchLines() {
  const s = "rgba(255,255,255,0.42)";
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 160" preserveAspectRatio="xMidYMid meet">
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

// ─── Color swatch ─────────────────────────────────────────────────────────────
const JERSEY_PRESETS = ["#e63946","#e07b1a","#f7c948","#4caf50","#2196f3","#9c27b0","#ffffff","#cccccc","#888888","#333333","#111111","#1a237e","#b71c1c","#004d00","#ff6f91"];
const PITCH_PRESETS  = ["#3d8b40","#1a5c2e","#7ec8a0","#8d6e63","#e0d5c0","#9e9e9e","#212121","#6a1b9a","#c62828"];

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
      <span className="text-[9px] font-bold tracking-widest uppercase" style={{ color: "#6b7280", letterSpacing:1.5, fontFamily:BRAND.fonts.body }}>{label}</span>
      <button className="flex items-center justify-center transition-all hover:scale-110"
        style={{ width:44, height:44, background:"transparent", border:"none", cursor:"pointer", padding:0 }}
        onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
        aria-label={`Pick ${label} colour`}>
        <span className="w-7 h-7 rounded-full border-2 shadow-md block"
          style={{ background:value, borderColor: open ? BRAND.colors.yellow : "rgba(255,255,255,0.25)" }}/>
      </button>
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

// ─── Roster Panel ─────────────────────────────────────────────────────────────
function RosterPanel({ players, subs, setSubs, teamName, format, formation, onPlayerUpdate, defaultExpanded = false }) {
  const [copied,      setCopied]      = useState(false);
  const [expanded,    setExpanded]    = useState(defaultExpanded);
  const [expandedRow, setExpandedRow] = useState(null); // player.id or null

  // Rows sorted defenders → midfield → attack (higher y = deeper on pitch)
  const rows = useMemo(() =>
    players.map((p, i) => ({ ...p, subName: subs[i] || "", idx: i }))
           .sort((a, b) => b.y - a.y),
  [players, subs]);

  // Plain-text export
  function buildRosterText() {
    const header  = `${teamName || "My Team"} — ${format}v${format} ${formation}`;
    const divider = "-".repeat(header.length);
    const lines = rows.map(({ pos, name, subName, jersey, age, foot }) => {
      const meta    = [jersey && `#${jersey}`, age && `${age}y`, foot && foot].filter(Boolean).join(" · ");
      const starter = `  ${pos.padEnd(4)} ${name || "(unnamed)"}${meta ? `  [${meta}]` : ""}`;
      return subName ? `${starter}\n         > sub: ${subName}` : starter;
    });
    return [header, divider, ...lines, divider, "FCRoster.com"].join("\n");
  }

  function handleCopy() {
    const text = buildRosterText();
    const doFallback = () => {
      const el = document.createElement("textarea");
      el.value = text;
      el.style.cssText = "position:fixed;top:0;left:0;opacity:0;pointer-events:none";
      document.body.appendChild(el);
      el.focus(); el.select();
      try { document.execCommand("copy"); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
      document.body.removeChild(el);
    };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text)
        .then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); })
        .catch(doFallback);
    } else { doFallback(); }
  }

  const hasAnyName = rows.some(r => r.name || r.subName);

  return (
    <div className={CLS_CARD} style={{ background:"#0f1b2d", border:"2px solid rgba(255,255,255,0.18)", boxShadow:"0 0 18px rgba(255,255,255,0.06)" }}>

      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-4 py-3" style={{ background:GLASS.md }}>
        <div className={CLS_ROW}>
          <span style={{ fontSize:16 }}>📋</span>
          <span className={CLS_HDR} style={{ fontFamily: BRAND.fonts.display, fontSize:15, color:"#e2e8f0", letterSpacing:2 }}>ROSTER</span>
        </div>
        <div className={CLS_ROW}>
          <button onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95"
            style={{ background: copied ? "rgba(34,197,94,0.2)" : GLASS.md,
              border: `1px solid ${copied ? "rgba(34,197,94,0.5)" : GLASS.border}`,
              color: copied ? "#4ade80" : "#94a3b8", fontFamily: BRAND.fonts.body }}>
            {copied ? "✓ Copied!" : "⎘ Copy"}
          </button>
          <button onClick={() => setExpanded(v => !v)} style={{ background:"none", border:"none", cursor:"pointer", padding:"2px 0" }}>
            <span style={{ color: BRAND.colors.yellow, fontSize:12, display:"inline-block",
              transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition:"transform 0.2s" }}>▼</span>
          </button>
        </div>
      </div>

      {/* Roster rows */}
      {expanded && (
        <div className="px-3 py-2" style={{ borderTop:"1px solid rgba(255,255,255,0.08)" }}>
          {!hasAnyName && (
            <p className="text-[10px] text-center py-3 italic" style={{ color:"#374151", fontFamily: BRAND.fonts.body }}>
              Tap player names on the pitch to fill the roster
            </p>
          )}
          {rows.map((player, i) => {
            const isOpen = expandedRow === player.id;
            const hasStats = player.goals > 0 || player.assists > 0 || player.appearances > 0 || player.yellowCards > 0 || player.redCards > 0;
            return (
              <div key={player.id} style={{ borderBottom: i < rows.length-1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>

                {/* Summary row */}
                <div className="flex items-center gap-2 py-2.5 cursor-pointer"
                  onClick={() => setExpandedRow(isOpen ? null : player.id)}>

                  {/* Pos badge */}
                  <div className="rounded flex items-center justify-center font-black shrink-0"
                    style={{ width:28, height:20, background:GLASS.sm, fontSize:8, color:"#94a3b8", fontFamily:BRAND.fonts.display, letterSpacing:0.5 }}>
                    {player.pos}
                  </div>

                  {/* Jersey # */}
                  {player.jersey && (
                    <span className="font-black text-[10px] shrink-0" style={{ color:BRAND.colors.yellow, minWidth:14 }}>
                      #{player.jersey}
                    </span>
                  )}

                  {/* Name — 1:1 live link to pitch */}
                  <span className="text-xs font-semibold flex-1 truncate"
                    style={{ color: player.name ? "#f1f5f9" : "#374151" }}>
                    {player.name || <span className="italic">Starter</span>}
                  </span>

                  {/* Meta chips */}
                  <div className="flex items-center gap-1 shrink-0">
                    {player.foot && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background:GLASS.xs, color:"#64748b" }}>{player.foot==="B"?"Both":player.foot}</span>}
                    {player.age  && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background:GLASS.xs, color:"#64748b" }}>{player.age}y</span>}
                    {player.yellowCards > 0 && <div style={{ width:6, height:9, background:BRAND.colors.yellow, borderRadius:1 }}/>}
                    {player.redCards    > 0 && <div style={{ width:6, height:9, background:BRAND.colors.red,    borderRadius:1 }}/>}
                    {hasStats && <span className="text-[9px]" style={{ color:"#475569" }}>
                      {[player.goals&&`⚽${player.goals}`, player.assists&&`🎯${player.assists}`, player.appearances&&`🏃${player.appearances}`].filter(Boolean).join(" ")}
                    </span>}
                    <span style={{ color:"#334155", fontSize:10, marginLeft:2 }}>{isOpen ? "▲" : "▼"}</span>
                  </div>
                </div>

                {/* Expanded detail editor */}
                {isOpen && (
                  <div className="pb-3 pt-1 px-1" style={{ borderTop:"1px solid rgba(255,255,255,0.05)" }}>

                    {/* Identity row */}
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div>
                        <div className="text-[9px] font-bold mb-1 tracking-widest" style={{ color:"#475569" }}>NAME</div>
                        <input className="w-full rounded-lg px-2.5 py-2 text-xs focus:outline-none"
                          style={{ background:GLASS.sm, border:"1px solid rgba(255,255,255,0.1)", color:"#fff" }}
                          value={player.name} maxLength={30} placeholder="Player name"
                          onChange={e => onPlayerUpdate(player.id, { name: e.target.value })}/>
                      </div>
                      <div>
                        <div className="text-[9px] font-bold mb-1 tracking-widest" style={{ color:"#475569" }}>SUB</div>
                        <input className="w-full rounded-lg px-2.5 py-2 text-xs focus:outline-none"
                          style={{ background:GLASS.sm, border:"1px solid rgba(255,255,255,0.1)", color:BRAND.colors.yellow }}
                          value={player.subName} maxLength={30} placeholder="Sub name"
                          onChange={e => setSubs(prev => prev.map((s,si) => si===player.idx ? e.target.value : s))}/>
                      </div>
                      <div>
                        <div className="text-[9px] font-bold mb-1 tracking-widest" style={{ color:"#475569" }}>JERSEY #</div>
                        <input className="w-full rounded-lg px-2.5 py-2 text-xs focus:outline-none"
                          style={{ background:GLASS.sm, border:"1px solid rgba(255,255,255,0.1)", color:"#fff" }}
                          value={player.jersey} maxLength={2} placeholder="00"
                          onChange={e => onPlayerUpdate(player.id, { jersey: e.target.value.replace(/[^0-9]/g,"").slice(0,2) })}/>
                      </div>
                      <div>
                        <div className="text-[9px] font-bold mb-1 tracking-widest" style={{ color:"#475569" }}>AGE</div>
                        <input className="w-full rounded-lg px-2.5 py-2 text-xs focus:outline-none"
                          style={{ background:GLASS.sm, border:"1px solid rgba(255,255,255,0.1)", color:"#fff" }}
                          value={player.age} maxLength={2} placeholder="–"
                          onChange={e => onPlayerUpdate(player.id, { age: e.target.value.replace(/[^0-9]/g,"").slice(0,2) })}/>
                      </div>
                    </div>

                    {/* Foot toggle */}
                    <div className="mb-3">
                      <div className="text-[9px] font-bold mb-1 tracking-widest" style={{ color:"#475569" }}>STRONG FOOT</div>
                      <div className="flex rounded-lg overflow-hidden" style={{ border:"1px solid rgba(255,255,255,0.08)" }}>
                        {["R","L","B"].map(f => (
                          <button key={f}
                            onClick={() => onPlayerUpdate(player.id, { foot: player.foot===f ? "" : f })}
                            className="flex-1 py-1.5 text-xs font-black transition-all"
                            style={{ background: player.foot===f ? BRAND.colors.green : "rgba(255,255,255,0.03)",
                              color: player.foot===f ? "#fff" : "#475569", border:"none", cursor:"pointer" }}>
                            {f==="B"?"BOTH":f}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Stats steppers */}
                    <div className="mb-3">
                      <div className="text-[9px] font-bold mb-2 tracking-widest" style={{ color:"#475569" }}>SEASON STATS</div>
                      <div className="grid grid-cols-3 gap-1.5">
                        {[
                          { key:"goals",       label:"⚽ Goals"   },
                          { key:"assists",     label:"🎯 Assists"  },
                          { key:"appearances", label:"🏃 Apps"     },
                          { key:"yellowCards", label:"🟨 Yellows"  },
                          { key:"redCards",    label:"🟥 Reds"     },
                        ].map(({ key, label }) => (
                          <div key={key} className="rounded-lg p-2 text-center"
                            style={{ background:GLASS.xs, border:"1px solid rgba(255,255,255,0.07)" }}>
                            <div style={{ fontSize:8, color:"#475569", marginBottom:4 }}>{label}</div>
                            <div className="flex items-center justify-center gap-1.5">
                              <button onClick={() => onPlayerUpdate(player.id, { [key]: Math.max(0,(player[key]||0)-1) })}
                                style={{ background:"none", border:"none", cursor:"pointer", color:"#475569", fontSize:14, lineHeight:1, padding:0 }}>−</button>
                              <span className="font-black text-xs" style={{ color:"#e2e8f0", minWidth:16, textAlign:"center" }}>{player[key]||0}</span>
                              <button onClick={() => onPlayerUpdate(player.id, { [key]: (player[key]||0)+1 })}
                                style={{ background:"none", border:"none", cursor:"pointer", color:BRAND.colors.green, fontSize:14, lineHeight:1, padding:0 }}>+</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Alt positions */}
                    <div>
                      <div className="text-[9px] font-bold mb-2 tracking-widest" style={{ color:"#475569" }}>ALSO PLAYS</div>
                      <div className="flex flex-wrap gap-1">
                        {ALL_POSITIONS.filter(p => p !== player.pos).map(pos => {
                          const active = (player.altPositions||[]).includes(pos);
                          return (
                            <button key={pos}
                              onClick={() => onPlayerUpdate(player.id, {
                                altPositions: active
                                  ? (player.altPositions||[]).filter(p=>p!==pos)
                                  : [...(player.altPositions||[]), pos]
                              })}
                              className="px-2 py-0.5 rounded text-[10px] font-bold transition-all"
                              style={{ background: active ? "rgba(99,102,241,0.25)" : GLASS.xs,
                                border: active ? "1px solid rgba(99,102,241,0.5)" : "1px solid rgba(255,255,255,0.07)",
                                color: active ? "#a5b4fc" : "#475569", cursor:"pointer" }}>
                              {pos}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                  </div>
                )}

                {/* Sub row (always visible when set) */}
                {player.subName && !isOpen && (
                  <div className="flex items-center gap-2.5 pb-2 -mt-1 pl-1">
                    <span style={{ fontSize:9, color:"#4b5563", paddingLeft:3, paddingRight:6 }}>↳</span>
                    <span className="text-[11px] font-medium italic" style={{ color:BRAND.colors.yellow, opacity:0.85 }}>
                      {player.subName}
                    </span>
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


// ─── Builder Layout (responsive) ─────────────────────────────────────────────
const BuilderLayout = memo(function BuilderLayout({
  exportRef, pitchRef, drawRef,
  teamName, format, formation, jerseyColor, accentFg, pitchBg,
  players, setPlayers, subs, setSubs, onPlayerUpdate, rosterLoading,
  drawMode, drawing, currentPts, strokes, balls,
  showOpposition, oppPlayers,
  onCirclePointerDown, onCirclePointerMove, onCirclePointerUp, dragging,
  moveMode, setMoveMode, undoPosition, positionHistoryLen, resetFormation,
  onDrawStart, onDrawMove, onDrawEnd,
  ptsToSmoothPath, getArrowHead,
  setDrawMode, undoLast, clearStrokes,
  oppFormation, handleOppFormation, setShowOpposition,
  exporting, handleExport,
  phases, currentPhaseIdx, onSwitchPhase, onAddPhase, onDeletePhase, onRenamePhase,
  isAnimating, onToggleAnimation, animSpeed, onSetAnimSpeed,
  session, team, onShowAuth, profile,
}) {
  const containerRef = useRef(null);
  const [pitchSize, setPitchSize] = useState({ w: 340, isDesktop: false });
  const [playmakersOpen, setPlaymakerOpen] = useState(false); // mobile only

  // ── Roster-loading toast ─────────────────────────────────────────────────
  const RosterLoadingBanner = rosterLoading ? (
    <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center py-2 gap-2 text-xs font-bold tracking-wide"
      style={{ background: BRAND.colors.green, color:"#fff", fontFamily: BRAND.fonts.body }}>
      <span style={{ display:"inline-block", animation:"spin 1s linear infinite", fontSize:14 }}>⚙️</span>
      Loading your saved roster…
    </div>
  ) : null;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    function measure() {
      const W = el.offsetWidth;
      const H = el.offsetHeight;
      const desktop = W >= 768;
      if (desktop) {
        // Pitch sits in the auto centre column. Size it by height so the two
        // 1fr side columns always get equal remaining space.
        // Height budget: subtract download btn (52px) + top/bottom padding (32px)
        const maxByH = Math.floor((H - 84) * (2 / 3));
        // Width guard: pitch must leave at least 180px for each side panel
        const maxByW = W - 360 - 32; // 180px×2 panels + 16px×2 outer pad
        const w = Math.min(maxByH, maxByW, 440);
        setPitchSize({ w: Math.max(w, 200), isDesktop: true });
      } else {
        setPitchSize({ w: Math.min(W - 24, 440), isDesktop: false });
      }
    }
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Reusable toggle pill
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
        <div className="tracking-widest" style={{ fontFamily: BRAND.fonts.display, fontSize: pitchSize.isDesktop ? 36 : 28, textShadow:`0 2px 20px ${jerseyColor}99` }}>
          {teamName || "MY TEAM FC"}
        </div>
        <div className="font-black tracking-[3px]" style={{ fontFamily: BRAND.fonts.display, fontSize: pitchSize.isDesktop ? 28 : 24, color: BRAND.colors.yellow }}>
          {format}v{format}
        </div>
        <div className="font-black tracking-widest" style={{ fontFamily: BRAND.fonts.display, fontSize: pitchSize.isDesktop ? 20 : 17, color: "#ffffff", lineHeight:1, textShadow:"0 2px 24px rgba(0,0,0,0.6)" }}>
          {formation}
        </div>
      </div>
      {/* Pitch wrapper — extra padding on all sides so player labels never clip in export */}
      <div style={{ padding:"30px 20px 60px 20px", width:"100%", display:"flex", justifyContent:"center" }}>
      <div ref={pitchRef} className="relative rounded-2xl shadow-2xl"
        style={{ width: pitchSize.w, aspectRatio:"2/3", background: pitchBg, boxShadow:`0 0 60px rgba(0,0,0,0.5), 0 20px 60px rgba(0,0,0,0.7)`, overflow:"visible", flexShrink:0, cursor: dragging ? "grabbing" : "default", touchAction: moveMode ? "none" : "pan-y" }}
        onPointerMove={e => { if (dragging) onCirclePointerMove(e, dragging); }}
        onPointerUp={e => { if (dragging) onCirclePointerUp(e, dragging); }}
        onPointerLeave={e => { if (dragging) onCirclePointerUp(e, dragging); }}>
        <div className="absolute inset-0 rounded-2xl overflow-hidden"><PitchLines/></div>
        {players.map((p,i) => (
          <PlayerSpot key={p.id} player={p} subName={subs[i] ?? ""} jerseyColor={jerseyColor}
            moveMode={moveMode}
            onStarterChange={useCallback(name => setPlayers(prev => prev.map(q => q.id===p.id ? {...q,name} : q)), [p.id])}
            onSubChange={useCallback(name => setSubs(prev => prev.map((s,si) => si===i ? name : s)), [i])}
            onCirclePointerDown={onCirclePointerDown}/>
        ))}
        {showOpposition && oppPlayers.map(p => (
          <div key={p.id} className="absolute flex flex-col items-center pointer-events-none"
            style={{ left:`${p.x}%`, top:`${100 - p.y}%`, transform:"translate(-50%,-50%)", zIndex:15 }}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <line x1="5" y1="5" x2="23" y2="23" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round"/>
              <line x1="23" y1="5" x2="5" y2="23" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
            <div className="text-[11px] font-bold" style={{ color:"#fca5a5", textShadow:"0 1px 4px rgba(0,0,0,0.9)", marginTop:1 }}>{p.pos}</div>
          </div>
        ))}
        {balls.map((b, i) => (
          <div key={i} className="absolute pointer-events-none"
            style={{ left:`${b.x}%`, top:`${b.y}%`, transform:"translate(-50%,-50%)", zIndex:18, fontSize:20, lineHeight:1, filter:"drop-shadow(0 2px 4px rgba(0,0,0,0.7))" }}>⚽</div>
        ))}
        <svg ref={drawRef} className="absolute inset-0 rounded-2xl" viewBox="0 0 100 100" preserveAspectRatio="none"
          style={{ width:"100%", height:"100%", zIndex: drawMode ? 20 : 0, cursor: drawMode ? (drawMode==="ball" ? "cell" : "crosshair") : "default", touchAction:"none", pointerEvents: drawMode ? "all" : "none" }}>
          <rect x="0" y="0" width="100" height="100" fill="transparent"
            onPointerDown={e => { try { e.currentTarget.setPointerCapture(e.pointerId); } catch {} onDrawStart(e); }}
            onPointerMove={onDrawMove} onPointerUp={onDrawEnd}
            onTouchStart={onDrawStart} onTouchMove={onDrawMove} onTouchEnd={onDrawEnd}/>
          {strokes.map((s, i) => {
            const color = s.type==="run" ? "#22c55e" : "#facc15";
            const arrow = getArrowHead(s.pts);
            return (
              <g key={i} opacity="0.92">
                <path d={ptsToSmoothPath(s.pts)} fill="none" stroke={color} strokeWidth="0.65" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={s.type==="pass" ? "2.5 1.8" : "none"}/>
                {arrow && <><line x1={arrow.top.x1} y1={arrow.top.y1} x2={arrow.top.x2} y2={arrow.top.y2} stroke={color} strokeWidth="0.6" strokeLinecap="round"/>
                <line x1={arrow.bottom.x1} y1={arrow.bottom.y1} x2={arrow.bottom.x2} y2={arrow.bottom.y2} stroke={color} strokeWidth="1.0" strokeLinecap="round"/></>}
              </g>
            );
          })}
          {drawing && currentPts.length > 1 && (() => {
            const color = drawMode==="run" ? "#22c55e" : "#facc15";
            const arrow = getArrowHead(currentPts);
            return (
              <g opacity="0.6">
                <path d={ptsToSmoothPath(currentPts)} fill="none" stroke={color} strokeWidth="0.65" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={drawMode==="pass" ? "2.5 1.8" : "none"}/>
                {arrow && <><line x1={arrow.top.x1} y1={arrow.top.y1} x2={arrow.top.x2} y2={arrow.top.y2} stroke={color} strokeWidth="0.6" strokeLinecap="round"/>
                <line x1={arrow.bottom.x1} y1={arrow.bottom.y1} x2={arrow.bottom.x2} y2={arrow.bottom.y2} stroke={color} strokeWidth="1.0" strokeLinecap="round"/></>}
              </g>
            );
          })()}
        </svg>
      </div>
      </div>{/* end pitch wrapper */}
      {/* FCROSTER.COM branding — captured in export */}
      <div className="w-full text-center pt-1 pb-2">
        <span className="font-black tracking-widest" style={{ fontFamily: BRAND.fonts.display, fontSize:13, color:"#a855f7", letterSpacing:3 }}>
          FCROSTER.COM
        </span>
      </div>
    </div>
    {/* Hint text — outside export capture zone */}
    <p className="text-[10px] text-center mt-2 w-full" style={{ color:"#6b7280" }}>
      {drawMode === "run"  && <span style={{ color:"#22c55e" }}>Drawing runs — drag on pitch</span>}
      {drawMode === "pass" && <span style={{ color:"#facc15" }}>Drawing passes — drag on pitch</span>}
      {drawMode === "ball" && <span style={{ color:"#fff" }}>Tap pitch to drop ball</span>}
      {!drawMode && <>Tap <span style={{ textDecoration:"underline" }}>Starter</span> or <span style={{ color: BRAND.colors.yellow, textDecoration:"underline" }}>+sub</span> to enter a name</>}
    </p>
    </>
  );

  // ─── Playmaker content (shared between desktop always-open and mobile dropdown) ─
  const playmakeContent = (
    <div className="px-4 pb-4 flex flex-col gap-2" style={{ borderTop:`1px solid rgba(255,255,255,0.08)` }}>

      {/* ── PLAYER MOVEMENT ────────────────────────────────────────────────── */}
      <div className="pt-2 pb-1 text-[9px] font-bold tracking-widest uppercase" style={{ color:"#94a3b8", letterSpacing:2 }}>Player Movement</div>
      <button onClick={() => setMoveMode(v => !v)}
        className="flex items-center justify-between px-3 py-2.5 rounded-xl transition-all"
        style={{ background: moveMode ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.03)", border:`1px solid ${moveMode ? "#6366f1" : GLASS.md}`, fontFamily: BRAND.fonts.body }}>
        <div className="flex items-center gap-3">
          <span style={{ fontSize:16 }}>🕹️</span>
          <span className={CLS_BADGE} style={{ color: moveMode ? "#a5b4fc" : "#cbd5e1" }}>Move Positions</span>
        </div>
        <Toggle on={moveMode} color="#6366f1"/>
      </button>
      {positionHistoryLen > 0 && (
        <div className="flex gap-2">
          <button onClick={undoPosition}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold flex-1"
            style={{ background:GLASS.xs, border:`1px solid rgba(255,255,255,0.1)`, color:"#cbd5e1", fontFamily: BRAND.fonts.body }}>
            ↩ Undo move
          </button>
          <button onClick={resetFormation}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold flex-1"
            style={{ background:"rgba(239,68,68,0.07)", border:`1px solid rgba(239,68,68,0.2)`, color:"#f87171", fontFamily: BRAND.fonts.body }}>
            ⟳ Reset
          </button>
        </div>
      )}

      {/* ── PHASES (premium) ─────────────────────────────────────────────── */}
      <div className="pt-3 pb-1 flex items-center justify-between">
        <span className="text-[9px] font-bold tracking-widest uppercase" style={{ color:"#94a3b8", letterSpacing:2 }}>
          Play Phases
        </span>
        {session ? (
          <span style={{ fontSize:18, lineHeight:1 }} title={profile?.display_name || "Signed in"}>
            {profile?.avatar_emoji || "⚽"}
          </span>
        ) : (
          <button onClick={onShowAuth}
            className="text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 transition-all hover:brightness-125"
            style={{ background:"rgba(245,197,24,0.12)", color:BRAND.colors.yellow, border:`1px solid rgba(245,197,24,0.25)`, cursor:"pointer" }}>
            🔒 Sign in
          </button>
        )}
      </div>

      {/* Phase timeline strip */}
      <div className="flex gap-1.5 flex-wrap">
        {phases.map((ph, i) => (
          <button key={ph.id}
            onClick={() => session ? onSwitchPhase(i) : onShowAuth()}
            className="px-3 py-1.5 rounded-lg text-[11px] font-black transition-all relative group"
            style={{
              background: i === currentPhaseIdx ? BRAND.colors.yellow : GLASS.xs,
              color:       i === currentPhaseIdx ? "#111"              : "#64748b",
              border:      i === currentPhaseIdx ? `2px solid ${BRAND.colors.yellow}` : "1px solid rgba(255,255,255,0.1)",
              opacity:     !session && i > 0 ? 0.45 : 1,
              minWidth:70,
            }}>
            {ph.label}
            {/* Delete badge — only on non-active phases with 2+ total, only for session users */}
            {session && phases.length > 1 && i !== currentPhaseIdx && (
              <span
                onClick={e => { e.stopPropagation(); onDeletePhase(i); }}
                className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background:BRAND.colors.red, color:"#fff" }}>×</span>
            )}
          </button>
        ))}

        {/* Add Phase button — distinct from phase pills */}
        {session ? (
          <button onClick={onAddPhase}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all hover:brightness-125 active:scale-95"
            style={{
              background: "rgba(45,122,58,0.12)",
              color: BRAND.colors.green,
              border: `1.5px dashed ${BRAND.colors.green}`,
              minWidth: 52,
              letterSpacing: 0.3,
            }}>
            <span style={{ fontSize:13, lineHeight:1, marginTop:-1 }}>＋</span>
            <span>Add</span>
          </button>
        ) : (
          <button onClick={onShowAuth}
            className="px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all"
            style={{ background:"rgba(245,197,24,0.07)", color:BRAND.colors.yellow, border:`1px dashed rgba(245,197,24,0.3)` }}>
            🔒 Add phases
          </button>
        )}
      </div>

      {/* Rename current phase */}
      {session && (
        <input
          className="w-full rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
          style={{ background:GLASS.xs, border:"1px solid rgba(255,255,255,0.08)", color:"#cbd5e1", fontFamily:BRAND.fonts.body }}
          value={phases[currentPhaseIdx]?.label ?? ""}
          maxLength={20}
          placeholder="Phase name…"
          onChange={e => onRenamePhase(currentPhaseIdx, e.target.value)}/>
      )}

      {/* Animation controls */}
      {session && phases.length >= 2 && (
        <div className="flex gap-2 items-center mt-1">
          <button onClick={onToggleAnimation}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs tracking-wide flex-1 transition-all hover:brightness-110 active:scale-95"
            style={{ background: isAnimating ? BRAND.colors.red : BRAND.colors.green, color:"#fff", border:"none", cursor:"pointer", fontFamily:BRAND.fonts.display, letterSpacing:1 }}>
            {isAnimating ? "⏹ STOP" : "▶ ANIMATE"}
          </button>
          <div className="flex flex-col items-center gap-0.5 shrink-0">
            <span className="text-[8px] font-bold" style={{ color:"#475569" }}>{(animSpeed/1000).toFixed(1)}s</span>
            <input type="range" min={400} max={3000} step={200} value={animSpeed}
              onChange={e => onSetAnimSpeed(Number(e.target.value))}
              className="w-16" style={{ accentColor: BRAND.colors.green }}/>
          </div>
        </div>
      )}

      {/* Phase count hint for non-session users */}
      {!session && (
        <button onClick={onShowAuth}
          className="w-full py-2.5 rounded-xl text-xs font-bold text-center transition-all hover:brightness-110"
          style={{ background:"rgba(245,197,24,0.07)", color:BRAND.colors.yellow, border:`1px solid rgba(245,197,24,0.2)`, fontFamily:BRAND.fonts.body }}>
          Sign in to unlock phases & animation →
        </button>
      )}

      {/* ── DRAW ON PITCH ──────────────────────────────────────────────────── */}
      <div className="pt-2 pb-1 text-[9px] font-bold tracking-widest uppercase" style={{ color:"#94a3b8", letterSpacing:2 }}>Draw on Pitch</div>
      {[
        { mode:"run",  label:"Draw Run",  color:"#22c55e", dash:false },
        { mode:"pass", label:"Draw Pass", color:"#facc15", dash:true  },
      ].map(({ mode:m, label, color, dash }) => {
        const isOn = drawMode === m;
        return (
          <button key={m} onClick={() => setDrawMode(isOn ? null : m)}
            className="flex items-center justify-between px-3 py-2.5 rounded-xl transition-all"
            style={{ background: isOn ? `${color}14` : "rgba(255,255,255,0.03)", border:`1px solid ${isOn ? color : GLASS.md}`, fontFamily: BRAND.fonts.body }}>
            <div className="flex items-center gap-3">
              <svg width="32" height="14" viewBox="0 0 32 14">
                <line x1="2" y1="7" x2="22" y2="7" stroke={color} strokeWidth="1.1" strokeDasharray={dash ? "2.5 1.8" : "none"} strokeLinecap="round"/>
                <line x1="19" y1="3.5" x2="25" y2="7" stroke={color} strokeWidth="0.8" strokeLinecap="round"/>
                <line x1="19" y1="10.5" x2="25" y2="7" stroke={color} strokeWidth="0.8" strokeLinecap="round"/>
              </svg>
              <span className={CLS_BADGE} style={{ color: isOn ? color : "#cbd5e1" }}>{label}</span>
            </div>
            <Toggle on={isOn} color={color}/>
          </button>
        );
      })}
      <button onClick={() => setDrawMode(drawMode === "ball" ? null : "ball")}
        className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all"
        style={{ background: drawMode==="ball" ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.03)", border:`2px solid ${drawMode==="ball" ? "rgba(255,255,255,0.6)" : GLASS.md}`, fontFamily: BRAND.fonts.body }}>
        <span style={{ fontSize:20, lineHeight:1, filter: drawMode==="ball" ? "drop-shadow(0 0 4px rgba(255,255,255,0.6))" : "none" }}>⚽</span>
        <span className={CLS_BADGE} style={{ color: drawMode==="ball" ? "#fff" : "#cbd5e1" }}>Drop Ball</span>
      </button>
      {(strokes.length > 0 || balls.length > 0) && (
        <div className="flex gap-2 mt-1">
          <button onClick={undoLast} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold flex-1"
            style={{ background:GLASS.xs, border:`1px solid rgba(255,255,255,0.15)`, color:"#cbd5e1", fontFamily: BRAND.fonts.body }}>↩ Undo</button>
          <button onClick={clearStrokes} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold flex-1"
            style={{ background:"rgba(239,68,68,0.07)", border:`1px solid rgba(239,68,68,0.2)`, color:"#f87171", fontFamily: BRAND.fonts.body }}>🗑 Clear all</button>
        </div>
      )}

      {/* ── OPPOSITION ─────────────────────────────────────────────────────── */}
      <div className="pt-3 pb-1 text-[9px] font-bold tracking-widest uppercase" style={{ color:"#94a3b8", letterSpacing:2 }}>Opposition</div>
      <button onClick={() => setShowOpposition(v => !v)}
        className="flex items-center justify-between px-3 py-2.5 rounded-xl transition-all"
        style={{ background: showOpposition ? "rgba(239,68,68,0.1)" : "rgba(255,255,255,0.03)", border:`1px solid ${showOpposition ? "#ef4444" : GLASS.md}`, fontFamily: BRAND.fonts.body }}>
        <div className="flex items-center gap-3">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <line x1="4" y1="4" x2="20" y2="20" stroke="#ef4444" strokeWidth="2.2" strokeLinecap="round"/>
            <line x1="20" y1="4" x2="4" y2="20" stroke="#ef4444" strokeWidth="2.2" strokeLinecap="round"/>
          </svg>
          <span className={CLS_BADGE} style={{ color: showOpposition ? "#ef4444" : "#cbd5e1" }}>Show Opposition</span>
        </div>
        <Toggle on={showOpposition} color="#ef4444"/>
      </button>
      {showOpposition && (
        <div className="flex gap-2 items-center mt-1">
          <span className="text-[10px] font-bold shrink-0" style={{ color:"#6b7280" }}>Formation</span>
          <select value={oppFormation} onChange={e => handleOppFormation(e.target.value)}
            className="flex-1 rounded-lg px-2 py-1.5 text-xs font-bold focus:outline-none"
            style={{ background:"#1e293b", border:`1px solid rgba(255,255,255,0.1)`, color:"#fff", fontFamily: BRAND.fonts.body }}>
            {Object.keys(FORMATIONS[format]).map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
      )}
    </div>
  );

  // Desktop: always-expanded Playmaker panel with static header
  const PlaymakerPanel = (
    <div className={CLS_CARD} style={{ background:"#0f1b2d", border:`2px solid ${BRAND.colors.yellow}`, boxShadow:`0 0 18px ${BRAND.colors.yellow}30` }}>
      <div className="flex items-center gap-2 px-4 py-3" style={{ background:"rgba(245,197,24,0.10)" }}>
        <span style={{ fontSize:16 }}>🧠</span>
        <span className={CLS_HDR} style={{ color: BRAND.colors.yellow, fontFamily: BRAND.fonts.display, letterSpacing:2, fontSize:15 }}>PLAYMAKER MENU 🔥</span>
      </div>
      {playmakeContent}
    </div>
  );

  // Mobile: collapsible dropdown
  const MobileToolbar = (
    <div className="flex flex-col gap-3 w-full" style={{ maxWidth:"min(440px,100%)" }}>
      <div className={CLS_CARD} style={{ background:"#0f1b2d", border:`2px solid ${BRAND.colors.yellow}`, boxShadow:`0 0 18px ${BRAND.colors.yellow}30` }}>
        <button className="w-full flex items-center justify-between gap-2 px-4 py-3"
          onClick={() => setPlaymakerOpen(v => !v)}
          style={{ background: playmakersOpen ? "rgba(245,197,24,0.13)" : "rgba(245,197,24,0.07)", fontFamily: BRAND.fonts.body }}>
          <div className={CLS_ROW}>
            <span style={{ fontSize:16 }}>🧠</span>
            <span className={CLS_HDR} style={{ color: BRAND.colors.yellow, fontFamily: BRAND.fonts.display, letterSpacing:2, fontSize:15 }}>PLAYMAKER MENU 🔥</span>
          </div>
          <span style={{ color: BRAND.colors.yellow, fontSize:12, display:"inline-block", transform: playmakersOpen ? "rotate(180deg)" : "rotate(0deg)", transition:"transform 0.2s" }}>▼</span>
        </button>
        {playmakersOpen && playmakeContent}
      </div>
      <div className={CLS_CARD} style={{ background:"#0f1b2d", border:`2px solid ${BRAND.colors.green}`, boxShadow: exporting ? "none" : `0 0 18px ${BRAND.colors.green}50` }}>
        <button onClick={handleExport} disabled={exporting}
          className="w-full flex items-center justify-between gap-2 px-4 py-3 transition-all hover:brightness-110 active:scale-95"
          style={{ background: exporting ? "rgba(45,122,58,0.3)" : BRAND.colors.green }}>
          <div className={CLS_ROW}>
            <span style={{ fontSize:15 }}>📥</span>
            <span className={CLS_HDR} style={{ color:"#fff", fontFamily: BRAND.fonts.display, letterSpacing:2, fontSize:15 }}>
              {exporting ? "SAVING…" : "DOWNLOAD"}
            </span>
          </div>
          <span style={{ fontSize:13, color:"#fff", fontWeight:900 }}>↓</span>
        </button>
      </div>
      <RosterPanel players={players} subs={subs} teamName={teamName} format={format} formation={formation} onPlayerUpdate={onPlayerUpdate} setSubs={setSubs}/>
    </div>
  );

  return (
    <>
      {RosterLoadingBanner}
      <div ref={containerRef} className="flex-1 flex" style={{ minHeight:0 }}>
      {pitchSize.isDesktop ? (
        /* Desktop: pitch dead centre, each side panel centred in its half of the remaining space */
        <div className="flex-1 overflow-y-auto" style={{
          display:"grid",
          gridTemplateColumns:"1fr auto 1fr",
          alignItems:"start",
          padding:"16px 12px",
          gap:0,
          minHeight:0,
        }}>
          {/* Left half — Playmaker centred within it */}
          <div className="flex justify-center pt-2" style={{ paddingRight:16 }}>
            <div style={{ width:200 }}>{PlaymakerPanel}</div>
          </div>
          {/* Centre — pitch fixed width + Download below */}
          <div className="flex flex-col items-center gap-3" style={{ width: pitchSize.w }}>
            {Pitch}
            <div className="rounded-2xl overflow-hidden w-full" style={{ background:"#0f1b2d", border:`2px solid ${BRAND.colors.green}`, boxShadow: exporting ? "none" : `0 0 18px ${BRAND.colors.green}50` }}>
              <button onClick={handleExport} disabled={exporting}
                className="w-full flex items-center justify-between gap-2 px-4 py-3 transition-all hover:brightness-110 active:scale-95"
                style={{ background: exporting ? "rgba(45,122,58,0.3)" : BRAND.colors.green }}>
                <div className={CLS_ROW}>
                  <span style={{ fontSize:15 }}>📥</span>
                  <span className={CLS_HDR} style={{ color:"#fff", fontFamily: BRAND.fonts.display, letterSpacing:2, fontSize:15 }}>
                    {exporting ? "SAVING…" : "DOWNLOAD"}
                  </span>
                </div>
                <span style={{ fontSize:13, color:"#fff", fontWeight:900 }}>↓</span>
              </button>
            </div>
          </div>
          {/* Right half — Roster centred within it */}
          <div className="flex justify-center pt-2" style={{ paddingLeft:16 }}>
            <div style={{ width:200 }}>
              <RosterPanel players={players} subs={subs} teamName={teamName} format={format} formation={formation} onPlayerUpdate={onPlayerUpdate} setSubs={setSubs} defaultExpanded={true}/>
            </div>
          </div>
        </div>
      ) : (
        /* Mobile: stacked — untouched */
        <div className="flex-1 flex flex-col items-center gap-4 py-4 px-3 overflow-y-auto">
          {Pitch}
          {MobileToolbar}
        </div>
      )}
    </div>
    </>
  );
}); // ← closes memo(BuilderLayout)

// ─── Formation Diagram (mini pitch + dots, no names) ─────────────────────────
function FormationDiagram({ formation, format = 11 }) {
  const players = FORMATIONS[format]?.[formation] || [];
  const s = "rgba(255,255,255,0.28)";
  return (
    <div className="relative rounded-xl overflow-hidden" style={{ background:"radial-gradient(ellipse at 50% 40%, #2d7a3a, #1a5c2e 70%, #0d3320)", aspectRatio:"2/3", width:"100%" }}>
      {/* Pitch lines */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 150" preserveAspectRatio="none">
        <rect x="4" y="3" width="92" height="144" rx="2" fill="none" stroke={s} strokeWidth="0.8"/>
        <line x1="4" y1="75" x2="96" y2="75" stroke={s} strokeWidth="0.5"/>
        <circle cx="50" cy="75" r="12" fill="none" stroke={s} strokeWidth="0.5"/>
        <circle cx="50" cy="75" r="0.8" fill={s}/>
        <rect x="28" y="3"  width="44" height="16" fill="none" stroke={s} strokeWidth="0.5"/>
        <rect x="28" y="131" width="44" height="16" fill="none" stroke={s} strokeWidth="0.5"/>
        <rect x="38" y="3"  width="24" height="7"  fill="none" stroke={s} strokeWidth="0.4"/>
        <rect x="38" y="140" width="24" height="7" fill="none" stroke={s} strokeWidth="0.4"/>
      </svg>
      {/* Player dots with position label */}
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


const BLOG_POSTS = [
  { id:"442", tag:"11v11", formation:"4-4-2", title:"4-4-2: The Classic Balanced Attack", why:"A foundational tactic and defensive juggernaut. It excels at controlling the center and protecting the goalkeeper with two organized lines. It's balanced and easy for players to learn and execute on game day.", fundamentals:"Requires solid team chemistry and a disciplined work rate from all players. Midfielders must understand they are the engine room, providing key links between defensive blocks and the attacking front two, making it perfect for high-pressing strategies." },
  { id:"433", tag:"11v11", formation:"4-3-3", title:"4-3-3: Total Football & High Press", why:"The heartbeat of modern, attacking soccer (pioneered by Cruyff's Ajax and Barcelona). It creates dangerous 1v1 situations for wingers, stretches opponent defenses, and enables devastating counter-attacks and an unstoppable high press.", fundamentals:"Success relies on the creative playmaker and defensive discipline. The holding midfielder is essential to breaking up opponent attacks, while outside backs must possess the engine for key overlaps and defensive recovery." },
  { id:"4231", tag:"11v11", formation:"4-2-3-1", title:"4-2-3-1: Modern Pragmatism & Central Overload", why:"The current professional standard. A masterclass in strategic flexibility, it utilizes defensive depth (two Pivots) to secure the box while allowing the front four creative freedom to create scoring chances.", fundamentals:"Critical role for the specialized number 10 playmaker. The two defensive midfielders must coordinate perfectly, one breaking up play, the other orchestrating possession and protecting the defensive line." },
  { id:"352", tag:"11v11", formation:"3-5-2", title:"3-5-2: Midfield Dominance", why:"A dynamic strategy to control the center circle with an overload of five midfielders. It offers strong defensive stability with three center-backs and creates instant width through tireless wing-backs.", fundamentals:"The engine of the team rests on the wing-backs; they are essentially full-backs and wingers combined. Midfielders must be comfortable playing under pressure and adept at winning second balls." },
  { id:"343", tag:"11v11", formation:"3-4-3", title:"3-4-3: The Risk & Reward Attacking Overload", why:"An aggressive, all-out attack formation designed to swarm the final third and suffocate opponents in possession. Ideal for teams with dominant players and confident central defenders.", fundamentals:"Demands incredible physical conditioning from the two central midfielders. The narrow attacking trio must have elite understanding and inter-changeability." },
  { id:"532", tag:"11v11", formation:"5-3-2", title:"5-3-2: The Counter-Attacking Stronghold", why:"The defensive park-the-bus masterpiece, often used when protecting a lead or facing a stronger opponent. A tactical fortress designed to clog the penalty box and lure the opponent in before launching lethal counter-attacks.", fundamentals:"Requires absolute mental focus and defensive organization. Striker chemistry must be precise; they have few chances and must be ruthlessly clinical." },
  { id:"541", tag:"11v11", formation:"5-4-1", title:"5-4-1: The Low Block Fortress", why:"The most extreme defensive setup. It's about limiting space, making it nearly impossible for the opposition to break through the lines. Ideal for grinding out a result or managing a narrow lead.", fundamentals:"Discipline is paramount; players must stay narrow and communicate constantly. It focuses on forcing opponent mistakes near the box and relies on set-pieces or rare breaks for scoring opportunities." },
  { id:"4141", tag:"11v11", formation:"4-1-4-1", title:"4-1-4-1: Possession Control & Positional Play", why:"The ultimate midfield chess match formation. It provides maximum passing options and positional flexibility. Ideal for teams that value slow, rhythmic build-up play.", fundamentals:"Everything pivots on the lone defensive midfielder. Outside midfielders operate as dynamic attacking threats, connecting play in the central attacking channel while full-backs provide necessary width." },
  { id:"451", tag:"11v11", formation:"4-5-1", title:"4-5-1: The Midfield Wall", why:"One of the most common professional formations. Controls the middle of the park with five midfielders while remaining defensively solid with a compact four-man backline.", fundamentals:"The lone striker must be physically imposing and capable of holding up play. The wide midfielders are key — they must contribute both defensively and provide width in attack." },
  { id:"3421", tag:"11v11", formation:"3-4-2-1", title:"3-4-2-1: The Christmas Tree (Wide)", why:"Provides a three-man defensive base with two creative shadow strikers supporting one centre forward. Creates overloads in the final third and is difficult to defend against.", fundamentals:"The two shadow strikers (SS) must have excellent movement and timing to avoid being offside. Wing midfielders must track back to protect the exposed flanks." },
  { id:"332-9v9", tag:"9v9", formation:"3-3-2", title:"3-3-2: The Balanced Classic", why:"The direct predecessor to the 4-4-2. It provides a stable spine with three defenders and a clear attacking partnership up front. The gold standard for teaching fundamental roles and zonal marking.", fundamentals:"Success hinges on the Midfield 3 acting as a unit. The wide midfielders must provide the width that the back three lacks, essentially acting as wing-backs to prevent being flanked." },
  { id:"323-9v9", tag:"9v9", formation:"3-2-3", title:"3-2-3: The Attacking Overload", why:"Favored by coaches who want to dominate the final third. By putting three players high up the pitch, you force the opposition deep and create constant goal-scoring opportunities.", fundamentals:"The two central midfielders must be highly disciplined. They are the insurance policy; if they push too high, the team is exposed to a vertical counter-attack." },
  { id:"233-9v9", tag:"9v9", formation:"2-3-3", title:"2-3-3: Total Offense", why:"An aggressive, high-risk setup designed for ball-dominant teams. It stretches the field horizontally and vertically, making it perfect for possession-based soccer.", fundamentals:"Requires two elite, fast center-backs capable of winning 1v1 duels in space. The midfield three must retreat instantly on transitions to support a vulnerable backline." },
  { id:"422-9v9", tag:"9v9", formation:"4-2-2", title:"4-2-2: Defensive Solidity", why:"Transitioning players into a traditional four-man backline early. A hard to beat formation that emphasizes clean sheets and organized defensive blocks.", fundamentals:"Focuses on the full-back's development. They must learn when to overlap into the attack and when to tuck in to support the center-backs." },
  { id:"242-9v9", tag:"9v9", formation:"2-4-2", title:"2-4-2: The Midfield Engine", why:"Designed to win the battle for the center circle. With four midfielders, you create a diamond that allows for superior passing triangles and keeps the ball away from the opponent.", fundamentals:"Movement off the ball is key. Players must constantly rotate to create passing lanes. If the midfield remains static, the two strikers become isolated." },
  { id:"341-9v9", tag:"9v9", formation:"3-4-1", title:"3-4-1: The Creative Hub", why:"Built entirely around a Number 10. This formation provides a massive safety net of seven players behind one creative playmaker who pulls the strings for a lone, clinical striker.", fundamentals:"The lone striker must be a target man, capable of holding up play while the four midfielders join the attack." },
  { id:"321-7v7", tag:"7v7", formation:"3-2-1", title:"3-2-1: The Christmas Tree (Defensive Base)", why:"The most secure 7v7 setup. It provides a solid three-man backline to prevent easy goals while maintaining a central spine that is difficult for opponents to play through.", fundamentals:"Success depends on the two midfielders transition speed. They must support the lone striker to avoid isolation and quickly drop back to form a defensive block." },
  { id:"231-7v7", tag:"7v7", formation:"2-3-1", title:"2-3-1: The Total Football Prototype", why:"The gold standard for youth development. It creates natural passing triangles across the whole pitch. It encourages defenders to step up and wingers to track back.", fundamentals:"The Wingers are the key. They must provide the width to stretch the defense. If they stay too central, the pitch becomes small and the attack stalls." },
  { id:"222-7v7", tag:"7v7", formation:"2-2-2", title:"2-2-2: The Box Balanced", why:"Simplicity and symmetry. It pairs players up in every third. This makes player rotations and substitution patterns easy for coaches and intuitive for players.", fundamentals:"Requires elite communication between pairs. It's a masterclass in staggered positioning to avoid standing on the same vertical line." },
  { id:"312-7v7", tag:"7v7", formation:"3-1-2", title:"3-1-2: The Counter-Attack Specialist", why:"It prioritizes a clean sheet with three dedicated defenders while keeping two strikers high to exploit long-ball transitions.", fundamentals:"The lone Holding Midfielder is the pivot. They must have a high interception rate and the vision to launch immediate vertical passes to the two strikers." },
  { id:"132-7v7", tag:"7v7", formation:"1-3-2", title:"1-3-2: The High Press Gamble", why:"An aggressive formation used to suffocate the opponent in their own half. By loading the midfield and attack, you force turnovers near the opponent's goal for quick-strike scoring.", fundamentals:"The lone defender must be a Sweeper-Keeper hybrid. They need the pace to cover the entire back half of the field." },
  { id:"232-7v7", tag:"7v7", formation:"2-3-2", title:"2-3-2: The Midfield Overload", why:"Extremely common in youth 7-a-side. Provides a balanced defensive base with two CBs while overloading the midfield and maintaining a two-striker threat.", fundamentals:"The three midfielders must constantly shift as a unit. Wide midfielders push forward when the team has the ball, tracking back when defending." },
  { id:"121-5v5", tag:"5v5", formation:"1-2-1", title:"1-2-1: The Diamond", why:"The most balanced and widely used 5v5 setup. It provides depth, width, and a clear point in the attack. Designed to create passing triangles naturally, making it the king of ball retention.", fundamentals:"The Anchor (defender) and Pivot (striker) must stay connected. The two wide midfielders are the lungs of the team, providing constant rotation to pull defenders out of position." },
  { id:"211-5v5", tag:"5v5", formation:"2-1-1", title:"2-1-1: The Pyramid (Defensive Base)", why:"A safety-first approach. It prioritizes a solid foundation with two defenders, making it extremely difficult for opponents to find a direct path to the goal. Perfect for counter-attacking teams.", fundamentals:"The lone midfielder is the Engine. They must have the high-intensity work rate to support the striker while tracking back to ensure the two defenders aren't overloaded." },
  { id:"112-5v5", tag:"5v5", formation:"1-1-2", title:"1-1-2: The Heavy Press", why:"An aggressive, front-loaded strategy. By keeping two strikers high, you force the opponent's keeper into risky throws and look for high-turnover goals. High-risk, high-reward soccer.", fundamentals:"Requires a Last Man defender with elite anticipation. The lone defender and midfielder must stay compact to prevent the long ball from beating the entire team." },
  { id:"22-5v5", tag:"5v5", formation:"2-2", title:"2-2: The Square (The Box)", why:"Total symmetry and simplicity. The easiest formation for zonal defending. Great for beginners to learn covering and for pros to execute highly disciplined man-to-man defensive shifts.", fundamentals:"Fluidity is mandatory. If the Box stays static, the team becomes easy to defend. Players must practice interchanging roles — when a defender carries the ball forward, a forward must rotate back." },
];

// ─── Supabase Client ──────────────────────────────────────────────────────────
const SUPABASE_URL  = "https://myorudjfmsmixgjygsuk.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15b3J1ZGpmbXNtaXhnanlnc3VrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1MjYxNDIsImV4cCI6MjA5MDEwMjE0Mn0.nENeexKGlEWkUhp-Z7tDmMVcng9KD7_tAFDJqf5rzfQ";

// Lightweight Supabase REST helper — no SDK needed
const sb = {
  headers: { "Content-Type":"application/json", "apikey": SUPABASE_ANON, "Authorization": `Bearer ${SUPABASE_ANON}` },

  async select(table, query="") {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}${query}`, { headers: { ...sb.headers, "Accept":"application/json" } });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },

  async signUp(email, password) {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method:"POST", headers: sb.headers,
      body: JSON.stringify({ email, password }),
    });
    return r.json();
  },

  async signIn(email, password) {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method:"POST", headers: sb.headers,
      body: JSON.stringify({ email, password }),
    });
    return r.json();
  },

  async signOut(token) {
    await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
      method:"POST", headers: { ...sb.headers, "Authorization": `Bearer ${token}` },
    });
  },

  // Google OAuth — redirects browser to Google, returns via callback URL
  signInWithGoogle() {
    track("login", { method: "google" });
    const redirectTo = encodeURIComponent(window.location.origin + window.location.pathname);
    window.location.href = `${SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${redirectTo}`;
  },

  async authedInsert(table, data, token) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method:"POST",
      headers: { ...sb.headers, "Authorization": `Bearer ${token}`, "Prefer":"return=representation" },
      body: JSON.stringify(data),
    });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },

  async updatePost(postId, data, token) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/posts?id=eq.${postId}`, {
      method:"PATCH",
      headers: { ...sb.headers, "Authorization":`Bearer ${token}`, "Prefer":"return=minimal" },
      body: JSON.stringify(data),
    });
    return r.ok;
  },

  async deletePost(postId, token) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/posts?id=eq.${postId}`, {
      method:"PATCH",
      headers: { ...sb.headers, "Authorization":`Bearer ${token}`, "Prefer":"return=minimal" },
      body: JSON.stringify({ is_deleted:true, title:"[Deleted]", body:"[This post has been deleted]" }),
    });
    return r.ok;
  },

  // Upsert (insert or update on conflict) — used for roster + profile saves
  async upsert(table, data, token) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method:"POST",
      headers: { ...sb.headers, "Authorization": `Bearer ${token}`, "Prefer":"resolution=merge-duplicates,return=representation" },
      body: JSON.stringify(data),
    });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },

  // Fetch a single user profile
  async getPostCount(userId, token) {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/posts?user_id=eq.${userId}&is_deleted=not.eq.true&select=id`,
      { headers: { ...sb.headers, "Authorization":`Bearer ${token}` } }
    );
    if (!r.ok) return 0;
    const data = await r.json();
    return Array.isArray(data) ? data.length : 0;
  },

  async getProfile(userId, token) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=*`, {
      headers: { ...sb.headers, "Authorization": `Bearer ${token}`, "Accept":"application/json" },
    });
    if (!r.ok) return null;
    const data = await r.json();
    return Array.isArray(data) && data.length ? data[0] : null;
  },

  // Fetch a saved roster for user
  async getRoster(userId, token) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/rosters?user_id=eq.${userId}&select=*`, {
      headers: { ...sb.headers, "Authorization": `Bearer ${token}`, "Accept":"application/json" },
    });
    if (!r.ok) return null;
    const data = await r.json();
    return Array.isArray(data) && data.length ? data[0] : null;
  },

  // Fetch reaction counts for a post (anon-readable)
  async getReactions(postId) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/reactions?post_id=eq.${postId}&select=type`, {
      headers: { ...sb.headers, "Accept":"application/json" },
    });
    if (!r.ok) return {};
    const rows = await r.json();
    return (rows || []).reduce((acc, row) => {
      acc[row.type] = (acc[row.type] || 0) + 1;
      return acc;
    }, {});
  },

  // Fetch which types the current user has reacted with on a post
  async getUserReactions(postId, userId, token) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/reactions?post_id=eq.${postId}&user_id=eq.${userId}&select=type`, {
      headers: { ...sb.headers, "Authorization": `Bearer ${token}`, "Accept":"application/json" },
    });
    if (!r.ok) return [];
    const rows = await r.json();
    return (rows || []).map(row => row.type);
  },

  // Toggle a reaction — insert if not present, delete if already there
  async toggleReaction(postId, type, userId, token) {
    const checkR = await fetch(`${SUPABASE_URL}/rest/v1/reactions?post_id=eq.${postId}&user_id=eq.${userId}&type=eq.${type}&select=id`, {
      headers: { ...sb.headers, "Authorization": `Bearer ${token}`, "Accept":"application/json" },
    });
    const existing = await checkR.json();
    if (Array.isArray(existing) && existing.length > 0) {
      await fetch(`${SUPABASE_URL}/rest/v1/reactions?post_id=eq.${postId}&user_id=eq.${userId}&type=eq.${type}`, {
        method:"DELETE", headers: { ...sb.headers, "Authorization": `Bearer ${token}` },
      });
      return "removed";
    } else {
      await fetch(`${SUPABASE_URL}/rest/v1/reactions`, {
        method:"POST",
        headers: { ...sb.headers, "Authorization": `Bearer ${token}`, "Prefer":"return=minimal" },
        body: JSON.stringify({ post_id: postId, user_id: userId, type }),
      });
      return "added";
    }
  },

  // ── Team management ────────────────────────────────────────────────────────
  async createTeam(name, format, userId, token) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/teams`, {
      method:"POST",
      headers: { ...sb.headers, "Authorization":`Bearer ${token}`, "Prefer":"return=representation" },
      body: JSON.stringify({ name: name.trim(), format, captain_id: userId }),
    });
    if (!r.ok) return null;
    const rows = await r.json();
    const team = Array.isArray(rows) ? rows[0] : rows;
    if (!team?.id) return null;
    // Insert captain row into team_members
    await fetch(`${SUPABASE_URL}/rest/v1/team_members`, {
      method:"POST",
      headers: { ...sb.headers, "Authorization":`Bearer ${token}`, "Prefer":"return=minimal" },
      body: JSON.stringify({ team_id: team.id, user_id: userId, role:"captain" }),
    });
    return team;
  },

  async getTeam(teamId, token) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/teams?id=eq.${teamId}&select=*`, {
      headers: { ...sb.headers, "Authorization":`Bearer ${token}`, "Accept":"application/json" },
    });
    if (!r.ok) return null;
    const rows = await r.json();
    return Array.isArray(rows) && rows.length ? rows[0] : null;
  },

  async getTeamByInviteCode(code) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/teams?invite_code=eq.${encodeURIComponent(code.toUpperCase())}&select=*`, {
      headers: { ...sb.headers, "Accept":"application/json" },
    });
    if (!r.ok) return null;
    const rows = await r.json();
    return Array.isArray(rows) && rows.length ? rows[0] : null;
  },

  async getTeamMembers(teamId, token) {
    // Join team_members with profiles to get display info
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/team_members?team_id=eq.${teamId}&select=*,profiles(display_name,avatar_emoji)`,
      { headers: { ...sb.headers, "Authorization":`Bearer ${token}`, "Accept":"application/json" } },
    );
    if (!r.ok) return [];
    const rows = await r.json();
    return Array.isArray(rows) ? rows : [];
  },

  async joinTeam(teamId, userId, token) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/team_members`, {
      method:"POST",
      headers: { ...sb.headers, "Authorization":`Bearer ${token}`, "Prefer":"return=minimal" },
      body: JSON.stringify({ team_id: teamId, user_id: userId, role:"player" }),
    });
    return r.ok;
  },

  async leaveTeam(teamId, userId, token) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/team_members?team_id=eq.${teamId}&user_id=eq.${userId}`, {
      method:"DELETE",
      headers: { ...sb.headers, "Authorization":`Bearer ${token}` },
    });
    return r.ok;
  },

  async updateMember(teamId, userId, updates, token) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/team_members?team_id=eq.${teamId}&user_id=eq.${userId}`, {
      method:"PATCH",
      headers: { ...sb.headers, "Authorization":`Bearer ${token}`, "Prefer":"return=minimal" },
      body: JSON.stringify(updates),
    });
    return r.ok;
  },

  async removeMember(teamId, userId, token) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/team_members?team_id=eq.${teamId}&user_id=eq.${userId}`, {
      method:"DELETE",
      headers: { ...sb.headers, "Authorization":`Bearer ${token}` },
    });
    return r.ok;
  },

  async regenerateInviteCode(teamId, token) {
    // Generate a new 6-char code client-side
    const code = Math.random().toString(36).substring(2,8).toUpperCase();
    const r = await fetch(`${SUPABASE_URL}/rest/v1/teams?id=eq.${teamId}`, {
      method:"PATCH",
      headers: { ...sb.headers, "Authorization":`Bearer ${token}`, "Prefer":"return=minimal" },
      body: JSON.stringify({ invite_code: code }),
    });
    return r.ok ? code : null;
  },

};

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
    sb.upsert("profiles", payload, session.token).catch(() => {});
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

                  {/* Overall score pill — live update */}
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <span style={{ fontSize:22 }}>{cls.emoji}</span>
                      <div>
                        <span className="font-black text-2xl" style={{ color:cls.color }}>{overall}</span>
                        <span className="text-xs font-bold ml-2" style={{ color:"#64748b" }}>{cls.name}</span>
                      </div>
                    </div>
                    <div>
                      {Array.from({length:Math.min(cls.stars,5)}).map((_,i) => (
                        <span key={i} style={{ color:cls.color, fontSize:12 }}>★</span>
                      ))}
                      {cls.stars === 6 && <span style={{ fontSize:13 }}>👑</span>}
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

                  {/* Full-width sliders */}
                  {ATTRS.map(a => {
                    const m = ATTR_META[a];
                    const val = Number(form[`attr_${a}`] || 10);
                    return (
                      <div key={a}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black w-8" style={{ color:m.color }}>{m.label}</span>
                            <span className="text-[10px]" style={{ color:"#475569" }}>{m.desc}</span>
                          </div>
                          <span className="text-base font-black w-8 text-right" style={{ color:m.color }}>{val}</span>
                        </div>
                        <input type="range" min={ATTR_MIN} max={ATTR_MAX} value={val}
                          onChange={e => setAttr(a, e.target.value)}
                          className="w-full" style={{ accentColor:m.color, height:20 }}/>
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

              {/* Privacy info */}
              <button onClick={() => setShowPrivacy(v => !v)}
                className="w-full text-left flex items-center justify-between px-3 py-2 rounded-lg text-xs"
                style={{ background:GLASS.xs, border:"1px solid rgba(255,255,255,0.06)", color:"#64748b" }}>
                <span>ℹ️ What's shown publicly?</span>
                <span>{showPrivacy ? "▲" : "▼"}</span>
              </button>
              {showPrivacy && (
                <div className="rounded-xl p-3 text-xs space-y-1.5"
                  style={{ background:"rgba(99,102,241,0.08)", border:"1px solid rgba(99,102,241,0.2)" }}>
                  <div style={{ color:"#a5b4fc", fontWeight:"bold" }}>👁️ Always public</div>
                  <div style={{ color:"#94a3b8" }}>Display name · Avatar · Role in football · Country · Club name · Bio · Social links · Player class & stats (if set to show)</div>
                  <div className="mt-2" style={{ color:"#a5b4fc", fontWeight:"bold" }}>🔒 Always private</div>
                  <div style={{ color:"#94a3b8" }}>Email address · Age</div>
                  <div className="mt-2" style={{ color:"#a5b4fc", fontWeight:"bold" }}>🔒 Private unless you toggle</div>
                  <div style={{ color:"#94a3b8" }}>Gender · Experience level</div>
                </div>
              )}
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
              <button onClick={handleFinish} disabled={saving}
                className="flex-1 py-2.5 rounded-xl text-xs font-black tracking-wide transition-all hover:brightness-110"
                style={{ background:BRAND.colors.green, color:"#fff", border:"none", cursor:"pointer",
                         fontFamily:BRAND.fonts.display, letterSpacing:1 }}>
                {saving ? "SAVING…" : isEdit ? "SAVE CHANGES ✓" : "START PLAYING ⚽"}
              </button>
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


// ─── Error Boundary ─────────────────────────────────────────────────────────
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch() {} // intentional no-op
  render() {
    if (this.state.error) {
      return (
        <div className="flex flex-col items-center justify-center" style={{ minHeight:"100dvh", background:BRAND.colors.navy, color:"#fff", fontFamily:BRAND.fonts.body, padding:24, textAlign:"center" }}>
          <div style={{ fontSize:48, marginBottom:12 }}>⚽</div>
          <div className="font-black mb-2" style={{ fontFamily:BRAND.fonts.display, fontSize:24, letterSpacing:1 }}>SOMETHING WENT WRONG</div>
          <p className="text-sm mb-6" style={{ color:"#64748b", maxWidth:320 }}>An unexpected error occurred. Refresh the page to get back in the game.</p>
          <button onClick={() => window.location.reload()}
            className="px-6 py-3 rounded-xl font-black text-sm tracking-wide"
            style={{ background:BRAND.colors.green, color:"#fff", border:"none", cursor:"pointer", fontFamily:BRAND.fonts.display, letterSpacing:1 }}>
            RELOAD PAGE
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function initPlayers(fmt, form) {
  return FORMATIONS[fmt][form].map(p => ({
    ...p, name:"",
    jersey:"", age:"", foot:"",
    goals:0, assists:0, appearances:0, yellowCards:0, redCards:0,
    altPositions:[],
  }));
}
function initSubs(count) { return Array.from({ length:count }, () => ""); }

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
  const [players,     setPlayers]     = useState(() => { const s = loadRosterLocal(); return s?.players?.length ? s.players : initPlayers(11,"4-4-2"); });
  const [subs,        setSubs]        = useState(() => { const s = loadRosterLocal(); return s?.subs ?? initSubs(FORMATIONS[11]["4-4-2"].length); });
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
    setPlayers(FORMATIONS[format][formation].map(p => ({ ...p, name: players.find(q => q.id === p.id)?.name || "" })));
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
    setPlayers(initPlayers(f, def));
    setSubs(initSubs(FORMATIONS[f][def].length));
    setOppFormation(FORMAT_DEFAULTS[f]);
    setOppPlayers(FORMATIONS[f][FORMAT_DEFAULTS[f]].map(p => ({ ...p })));
  }
  function handleFormation(f) {
    track("select_formation", { formation: f, format });
    setFormation(f);
    const tpl = FORMATIONS[format][f];
    setPlayers(tpl.map((t,i) => {
      const prev = players[i] || {};
      return { ...t, name:prev.name||"", jersey:prev.jersey||"", age:prev.age||"", foot:prev.foot||"",
        goals:prev.goals||0, assists:prev.assists||0, appearances:prev.appearances||0,
        yellowCards:prev.yellowCards||0, redCards:prev.redCards||0, altPositions:prev.altPositions||[] };
    }));
    setSubs(prev => tpl.map((_,i) => prev[i] ?? ""));
  }
  async function handleExport() {
    track("share", { method: "image_export", content_type: "lineup" });
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
  const availForms = useMemo(() => Object.keys(FORMATIONS[format]), [format]);

  // ─── Opposition state ─────────────────────────────────────────────────────────
  const [oppFormation, setOppFormation] = useState("4-4-2");
  const [oppPlayers,   setOppPlayers]   = useState(() => FORMATIONS[11]["4-4-2"].map(p => ({ ...p })));

  function handleOppFormation(f) {
    setOppFormation(f);
    setOppPlayers(FORMATIONS[format][f].map(p => ({ ...p })));
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
        {activeTab === "builder" && (
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
          />
        )}
        {activeTab === "about" && <AboutTab session={session} onShowAuth={() => setShowAuth(true)} onGoProfile={() => setActiveTab("profile")}/>}
        {activeTab === "profile" && (
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
          <CommunityTab session={session} profile={profile} setSession={setSession} showAuth={showAuth} setShowAuth={setShowAuth}/>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="shrink-0 text-center py-3 text-[10px]" style={{ color: BRAND.colors.muted, borderTop:`1px solid ${BRAND.colors.border}`, fontFamily: BRAND.fonts.body }}>
        © 2025 FCRoster.com · Connect. Organize. Compete.
      </footer>

      {/* ── Global Auth Modal ── */}
      {showAuth && (
        <AuthModal
          onClose={() => setShowAuth(false)}
          onAuth={sess => { setSession(sess); setShowAuth(false); }}
        />
      )}

      {/* ── Profile Panel (slide-in) ── */}
      {showProfile && session && (
        <ProfilePanel
          session={session}
          profile={profile}
          team={team}
          teamMembers={teamMembers}
          onClose={() => setShowProfile(false)}
          onSignOut={handleSignOut}
          onGoProfile={() => { setActiveTab("profile"); setShowProfile(false); }}
        />
      )}

      {/* ── Team Modals ── */}
      {showCreateTeam && session && (
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
      )}

      {showJoinTeam && session && (
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
      )}

      {showManageSquad && session && team && (
        <ManageSquadModal
          session={session}
          team={team}
          members={teamMembers}
          onClose={() => setShowManageSquad(false)}
          onUpdated={updated => setTeamMembers(updated)}
        />
      )}

      {/* ── Onboarding Modal (first login) ── */}
      {showOnboarding && session && (
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
      )}
      {showEditProfile && session && (
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
      )}
    </div>
  );
}

export default function FCRosterApp(props) {
  return <ErrorBoundary><App {...props}/></ErrorBoundary>;
}
