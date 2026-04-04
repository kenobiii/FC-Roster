// ─── Head injection — SEO, PWA, GA4 (runs at module load time) ───────────────
// Import and side-effect: this runs immediately when imported

import { LOGO_SRC, FAVICON_SRC, BRAND } from "./tokens.js";

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
