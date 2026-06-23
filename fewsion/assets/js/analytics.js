/**
 * ─────────────────────────────────────────────
 *  Fewsion — analytics.js
 *  Thin wrapper around third-party analytics.
 *  Swap the provider without touching page code.
 * ─────────────────────────────────────────────
 *
 *  PROVIDERS SUPPORTED (toggle in config below):
 *    - Plausible  (recommended, privacy-first)
 *    - Google Analytics 4
 *    - PostHog
 *
 *  EVENTS TRACKED:
 *    page_view          — auto on load
 *    waitlist_submitted — role, source
 *    cta_clicked        — label, page
 *    pricing_tab_click  — tab (brand|creator|editor)
 *    nav_click          — destination
 *    scroll_depth       — depth (25|50|75|100)
 */

'use strict';

/* ── Config ── */
const CONFIG = {
  plausible:   true,   // set to false to disable
  ga4:         false,  // set GA_MEASUREMENT_ID below
  posthog:     false,  // set POSTHOG_KEY below
  debug:       false,  // console.log all events in dev
  GA_ID:       'G-XXXXXXXXXX',
  POSTHOG_KEY: 'phc_XXXXXXXXXXXXXXXX',
};

/* ── Core track function ── */
function track(eventName, props = {}) {
  if (CONFIG.debug) {
    console.log(`%c[fewsion:analytics] ${eventName}`, 'color:#F5A623;font-weight:bold', props);
  }

  if (CONFIG.plausible && typeof window.plausible === 'function') {
    window.plausible(eventName, { props });
  }

  if (CONFIG.ga4 && typeof window.gtag === 'function') {
    window.gtag('event', eventName, props);
  }

  if (CONFIG.posthog && typeof window.posthog !== 'undefined') {
    window.posthog.capture(eventName, props);
  }
}

/* ── Auto page view ── */
(function trackPageView() {
  track('page_view', {
    page:     window.location.pathname,
    referrer: document.referrer || 'direct',
    utm_source: new URLSearchParams(window.location.search).get('utm_source') || '',
  });
})();

/* ── Scroll depth ── */
(function trackScrollDepth() {
  const thresholds = [25, 50, 75, 100];
  const fired = new Set();

  window.addEventListener('scroll', () => {
    const scrolled = Math.round(
      (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
    );
    thresholds.forEach(t => {
      if (scrolled >= t && !fired.has(t)) {
        fired.add(t);
        track('scroll_depth', { depth: t, page: window.location.pathname });
      }
    });
  }, { passive: true });
})();

/* ── CTA click tracking ── */
(function trackCTAClicks() {
  document.querySelectorAll('[data-track]').forEach(el => {
    el.addEventListener('click', () => {
      track('cta_clicked', {
        label: el.dataset.track,
        page:  window.location.pathname,
      });
    });
  });
})();

export { track };
