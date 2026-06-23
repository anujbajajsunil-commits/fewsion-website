/**
 * ─────────────────────────────────────────────
 *  Fewsion — pricing.js
 *  Handles the Brand / Creator / Editor tab
 *  switcher on pricing.html, plus the
 *  monthly ↔ annual billing toggle.
 * ─────────────────────────────────────────────
 */

'use strict';

/* ── Plan tab switcher ── */
function initPricingTabs() {
  const tabs   = document.querySelectorAll('.pricing-tab');
  const panels = document.querySelectorAll('.plans-panel');
  if (!tabs.length) return;

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.target;
      tabs.forEach(t => t.classList.remove('active'));
      panels.forEach(p => p.hidden = true);
      tab.classList.add('active');
      const panel = document.getElementById(`plans-${target}`);
      if (panel) panel.hidden = false;
    });
  });
}

/* ── Annual billing toggle ── */
const ANNUAL_DISCOUNT = 0.20; // 20% off

function initBillingToggle() {
  const toggle = document.getElementById('billingToggle');
  if (!toggle) return;

  const monthlyLabels = document.querySelectorAll('[data-price-monthly]');
  const annualLabels  = document.querySelectorAll('[data-price-annual]');
  const saveBadge     = document.getElementById('saveBadge');

  toggle.addEventListener('change', () => {
    const isAnnual = toggle.checked;
    toggle.closest('.toggle-wrap')?.classList.toggle('annual', isAnnual);
    if (saveBadge) saveBadge.style.display = isAnnual ? 'inline-block' : 'none';

    monthlyLabels.forEach(el => {
      const monthly = Number(el.dataset.priceMonthly);
      const annual  = Math.round(monthly * (1 - ANNUAL_DISCOUNT));
      el.textContent = isAnnual ? `₹${annual.toLocaleString('en-IN')}` : `₹${monthly.toLocaleString('en-IN')}`;
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initPricingTabs();
  initBillingToggle();
});
