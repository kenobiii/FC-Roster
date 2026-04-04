// ─── SEO / PWA / GA4 head injection ─────────────────────────────────────────
// Called once from main.jsx (or App.jsx) on app load.
// Injects meta tags, Open Graph, Twitter cards, PWA manifest link, and GA4.

export function injectHead({
  title       = "FCRoster.com — Build Your Football Lineup",
  description = "Create football lineups, manage your roster, and connect with players worldwide. Free lineup builder for 5v5, 7v7, 9v9 and 11v11.",
  url         = "https://fcroster.com",
  image       = "https://fcroster.com/og-image.png",
  ga4Id       = "",   // e.g. "G-XXXXXXXXXX" — leave blank until GA4 is set up
} = {}) {

  // ── Title ──────────────────────────────────────────────────────────────────
  document.title = title;

  // ── Helper: upsert a <meta> tag ────────────────────────────────────────────
  function meta(attr, val, content) {
    let el = document.querySelector(`meta[${attr}="${val}"]`);
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute(attr, val);
      document.head.appendChild(el);
    }
    el.setAttribute("content", content);
  }

  // ── Helper: upsert a <link> tag ────────────────────────────────────────────
  function link(rel, href, extra = {}) {
    let el = document.querySelector(`link[rel="${rel}"]`);
    if (!el) {
      el = document.createElement("link");
      el.rel = rel;
      document.head.appendChild(el);
    }
    el.href = href;
    Object.entries(extra).forEach(([k, v]) => el.setAttribute(k, v));
  }

  // ── Standard SEO ──────────────────────────────────────────────────────────
  meta("name", "description",        description);
  meta("name", "robots",             "index, follow");
  meta("name", "theme-color",        "#2d7a3a");
  meta("name", "application-name",   "FCRoster.com");

  // ── Open Graph ────────────────────────────────────────────────────────────
  meta("property", "og:type",        "website");
  meta("property", "og:url",         url);
  meta("property", "og:title",       title);
  meta("property", "og:description", description);
  meta("property", "og:image",       image);
  meta("property", "og:site_name",   "FCRoster.com");

  // ── Twitter Card ──────────────────────────────────────────────────────────
  meta("name", "twitter:card",        "summary_large_image");
  meta("name", "twitter:title",       title);
  meta("name", "twitter:description", description);
  meta("name", "twitter:image",       image);

  // ── PWA / favicon / apple ─────────────────────────────────────────────────
  link("icon",             "/favicon.png",  { type:"image/png" });
  link("apple-touch-icon", "/logo.png");
  link("manifest",         "/manifest.json");

  // ── Canonical ─────────────────────────────────────────────────────────────
  link("canonical", url);

  // ── Structured data (JSON-LD) ─────────────────────────────────────────────
  const existingLd = document.querySelector('script[type="application/ld+json"]');
  if (!existingLd) {
    const ld = document.createElement("script");
    ld.type = "application/ld+json";
    ld.textContent = JSON.stringify({
      "@context":   "https://schema.org",
      "@type":      "WebApplication",
      "name":       "FCRoster.com",
      "url":        url,
      "description": description,
      "applicationCategory": "SportsApplication",
      "operatingSystem": "Any",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD",
      },
    });
    document.head.appendChild(ld);
  }

  // ── Google Analytics 4 ────────────────────────────────────────────────────
  if (ga4Id && !window.__ga4Loaded) {
    window.__ga4Loaded = true;
    const script = document.createElement("script");
    script.async = true;
    script.src   = `https://www.googletagmanager.com/gtag/js?id=${ga4Id}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js",     new Date());
    window.gtag("config", ga4Id, { send_page_view: true });
  }
}
