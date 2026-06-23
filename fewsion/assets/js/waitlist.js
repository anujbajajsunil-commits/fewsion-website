/**
 * ─────────────────────────────────────────────
 *  Fewsion — waitlist.js
 *  Handles waitlist form submission.
 *  Writes to /data/waitlist/entries.json via
 *  the GitHub Actions + Netlify Forms pipeline
 *  (or a simple POST to a serverless function).
 *  Falls back to localStorage for offline/dev.
 * ─────────────────────────────────────────────
 */

'use strict';

const WAITLIST_KEY     = 'fewsion_waitlist_submitted';
const WAITLIST_API_URL = '/api/waitlist'; // proxied via netlify function

/**
 * Submit a waitlist entry.
 * @param {Object} payload - { name, email, role, source }
 * @returns {Promise<{success: boolean, message: string}>}
 */
async function submitWaitlistEntry(payload) {
  // Prevent duplicate submissions
  if (localStorage.getItem(WAITLIST_KEY)) {
    return { success: false, message: 'already_submitted' };
  }

  const entry = {
    ...payload,
    id:         `wl_${Date.now()}`,
    submittedAt: new Date().toISOString(),
    userAgent:  navigator.userAgent,
    referrer:   document.referrer || 'direct',
  };

  try {
    const res = await fetch(WAITLIST_API_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(entry),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    localStorage.setItem(WAITLIST_KEY, JSON.stringify({ email: payload.email, at: entry.submittedAt }));
    trackEvent('waitlist_submitted', { role: payload.role });
    return { success: true, message: 'submitted' };

  } catch (err) {
    // Dev fallback — persist locally so you can inspect
    console.warn('[Fewsion] Waitlist API unavailable, saving locally.', err.message);
    const offline = JSON.parse(localStorage.getItem('fewsion_waitlist_offline') || '[]');
    offline.push(entry);
    localStorage.setItem('fewsion_waitlist_offline', JSON.stringify(offline));
    return { success: true, message: 'offline_saved' };
  }
}

/**
 * Wire a waitlist form element to the submission handler.
 * @param {string} formSelector - CSS selector for the <form>
 */
function initWaitlistForm(formSelector) {
  const form = document.querySelector(formSelector);
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('[type="submit"]');
    const originalText = btn ? btn.textContent : '';

    if (btn) { btn.textContent = 'Submitting…'; btn.disabled = true; }

    const payload = {
      name:   (form.querySelector('[name="name"]')?.value   || '').trim(),
      email:  (form.querySelector('[name="email"]')?.value  || '').trim(),
      role:   (form.querySelector('[name="role"]')?.value   || 'unknown'),
      source: new URLSearchParams(window.location.search).get('utm_source') || 'organic',
    };

    const result = await submitWaitlistEntry(payload);

    if (result.success) {
      form.innerHTML = `
        <div class="waitlist-success" role="alert">
          <span class="success-icon">✓</span>
          <p>You're on the list! We'll reach out before launch.</p>
          <p class="success-sub">Share Fewsion with a fellow creator to jump the queue.</p>
        </div>`;
    } else if (result.message === 'already_submitted') {
      showFormMessage(form, "You've already joined — we'll be in touch!", 'info');
      if (btn) { btn.textContent = originalText; btn.disabled = false; }
    } else {
      showFormMessage(form, 'Something went wrong. Please try again.', 'error');
      if (btn) { btn.textContent = originalText; btn.disabled = false; }
    }
  });
}

function showFormMessage(form, message, type = 'info') {
  const existing = form.querySelector('.form-message');
  if (existing) existing.remove();
  const el = document.createElement('p');
  el.className = `form-message form-message--${type}`;
  el.textContent = message;
  form.appendChild(el);
}

/* ── Minimal analytics helper ── */
function trackEvent(name, props = {}) {
  // Drop in your analytics here (Plausible / Posthog / GA4)
  if (typeof window.plausible === 'function') {
    window.plausible(name, { props });
  }
  if (typeof window.gtag === 'function') {
    window.gtag('event', name, props);
  }
  // console.log(`[fewsion:analytics] ${name}`, props); // dev debug
}

/* ── Auto-init if data attribute present ── */
document.querySelectorAll('[data-waitlist-form]').forEach(form => {
  initWaitlistForm(`#${form.id}`);
});

export { submitWaitlistEntry, initWaitlistForm, trackEvent };
