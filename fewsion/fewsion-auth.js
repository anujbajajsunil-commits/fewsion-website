// ── Fewsion Auth State ──
// Simple sessionStorage-based auth for demo/prototype

// const FewsionAuth = {
//   login(user) {
//     sessionStorage.setItem('fw_user', JSON.stringify(user));
//   },
//   logout() {
//     sessionStorage.removeItem('fw_user');
//     window.location.href = 'index.html';
//   },
//   getUser() {
//     try { return JSON.parse(sessionStorage.getItem('fw_user')); } catch { return null; }
//   },
//   isLoggedIn() {
//     return !!this.getUser();
//   },
//   requireAuth(role) {
//     const user = this.getUser();
//     if (!user) { window.location.href = 'login.html'; return null; }
//     if (role && user.role !== role) {
//       window.location.href = user.role + '-dashboard.html';
//       return null;
//     }
//     return user;
//   },
//   redirectIfLoggedIn() {
//     const user = this.getUser();
//     if (user) window.location.href = user.role + '-dashboard.html';
//   }
// };

/**
 * fewsion-auth.js
 * Shared auth utilities for Fewsion — used by signup.html, login.html, dashboards.
 *
 * Exposes a global `FewsionAuth` object with helper methods.
 */

// ─── CONFIG ────────────────────────────────────────────────────────────────
// Replace these two values with your actual Supabase project credentials.
// The URL must be the project root (NOT the /rest/v1/ endpoint).
// const FEWSION_SUPABASE_URL = "https://vdtpdqpmxxcwkqslhvww.supabase.co";
const FEWSION_SUPABASE_URL = "https://vdtpdqpmxxcwkqslhvww.supabase.co";
const FEWSION_SUPABASE_KEY = "sb_publishable_zZ43Mm55wlCtH30mffIUtw_iUZd1Kb3"; // anon/public key

// ─── BOOT ──────────────────────────────────────────────────────────────────
// We load the Supabase CDN bundle before this script runs (see HTML), so
// `window.supabase` is available. We create one shared client instance.
const _sb = window.supabase.createClient(FEWSION_SUPABASE_URL, FEWSION_SUPABASE_KEY);

// ─── PUBLIC API ───────────────────────────────────────────────────────────
window.FewsionAuth = {

  /**
   * Returns the Supabase client so other scripts can reuse the same instance.
   */
  client() {
    return _sb;
  },

  /**
   * Returns the current session user, or null if logged out.
   */
  async getUser() {
    const { data: { user } } = await _sb.auth.getUser();
    return user;
  },

  /**
   * Fetches the `users` profile row for the current auth user.
   * Returns { data, error }.
   */
  async getProfile(userId) {
    return await _sb
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();
  },

  /**
   * If a user is already logged in AND has a complete profile, redirect them
   * to their role dashboard immediately (call this at the top of signup.html).
   */
  async redirectIfLoggedIn() {
    const user = await FewsionAuth.getUser();
    if (!user) return;

    const { data: profile } = await FewsionAuth.getProfile(user.id);
    if (profile && profile.role) {
      window.location.href = profile.role + "-dashboard.html";
    }
  },

  /**
   * Signs the user out and redirects to the given page (default: index.html).
   */
  async signOut(redirectTo = "index.html") {
    await _sb.auth.signOut();
    window.location.href = redirectTo;
  },
};
