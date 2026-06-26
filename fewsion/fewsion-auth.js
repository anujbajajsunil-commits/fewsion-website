// ─── CONFIG ────────────────────────────────────────────────────────────────
// Replace these two values with your actual Supabase project credentials.
// The URL must be the project root (NOT the /rest/v1/ endpoint).
// ─── CONFIG ────────────────────────────────────────────────────────────────
// Ensure the URL is exactly your project root without any extra appended strings or parameters
const FEWSION_SUPABASE_URL = "https://vdtpdqpmxxcwkqslhvww.supabase.co";
const FEWSION_SUPABASE_KEY = "sb_publishable_zZ43Mm55wlCtH30mffIUtw_iUZd1Kb3"; // anon/public key

// ─── BOOT ──────────────────────────────────────────────────────────────────
const _sb = window.supabase.createClient(FEWSION_SUPABASE_URL, FEWSION_SUPABASE_KEY);

console.log("Supabase URL:", FEWSION_SUPABASE_URL);
console.log("Supabase Key:", FEWSION_SUPABASE_KEY);
console.log("Supabase Client:", _sb);

// ─── PUBLIC API ───────────────────────────────────────────────────────────
// window.FewsionAuth = {

//   /**
//    * Returns the Supabase client so other scripts can reuse the same instance.
//    */
//   client() {
//     return _sb;
//   },

//   /**
//    * Returns the current session user, or null if logged out.
//    */
//   async getUser() {
//     const { data: { user } } = await _sb.auth.getUser();
//     return user;
//   },

//   /**
//    * Fetches the `users` profile row for the current auth user.
//    * Returns { data, error }.
//    */
//   async getProfile(userId) {
//     return await _sb
//       .from("users")
//       .select("*")
//       .eq("id", userId)
//       .single();
//   },

//   /**
//    * If a user is already logged in AND has a complete profile, redirect them
//    * to their role dashboard immediately (call this at the top of signup.html).
//    */
//   async redirectIfLoggedIn() {
//     const user = await FewsionAuth.getUser();
//     if (!user) return;

//     const { data: profile } = await FewsionAuth.getProfile(user.id);
//     if (profile && profile.role) {
//       window.location.href = profile.role + "-dashboard.html";
//     }
//   },

//   /**
//    * Signs the user out and redirects to the given page (default: index.html).
//    */
//   async signOut(redirectTo = "index.html") {
//     await _sb.auth.signOut();
//     window.location.href = redirectTo;
//   },
// };

/**
 * fewsion-auth.js
 * Shared Authentication & Role Management
 */

// ─────────────────────────────────────────
// FEWSION AUTH
// ─────────────────────────────────────────
window.FewsionAuth = {

  // Get Supabase Client
  client() {
    return supabaseClient;
  },

  // Get Current Auth User
  async getUser() {
    const {
      data: { user },
      error
    } = await supabaseClient.auth.getUser();

    if (error) {
      console.error("Get User Error:", error);
      return null;
    }

    return user;
  },

  // Get Profile From Users Table
  async getProfile(userId) {
    const { data, error } = await supabaseClient
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Profile Error:", error);
      return { data: null, error };
    }

    return { data, error: null };
  },

  // Get Current User Profile
  async getCurrentProfile() {
    const user = await this.getUser();

    if (!user) {
      return null;
    }

    const { data } = await this.getProfile(user.id);

    return data;
  },

  // Redirect According To Role
  redirectByRole(role) {
    switch (role) {
      case "brand":
        window.location.href =
          "fewsion_brand_portal.html";
        break;

      case "creator":
        window.location.href =
          "fewsion_creator_portal.html";
        break;

      case "editor":
        window.location.href =
          "fewsion_editor_portal.html";
        break;

      default:
        window.location.href =
          "login.html";
    }
  },

  // Redirect If Logged In
  async redirectIfLoggedIn() {
    const user = await this.getUser();

    if (!user) return;

    const { data: profile } =
      await this.getProfile(user.id);

    if (profile?.role) {
      this.redirectByRole(profile.role);
    }
  },

  // Protect Pages
  async requireAuth(requiredRole = null) {
    const user = await this.getUser();

    if (!user) {
      window.location.href = "login.html";
      return null;
    }

    const { data: profile } =
      await this.getProfile(user.id);

    if (!profile) {
      window.location.href = "login.html";
      return null;
    }

    if (
      requiredRole &&
      profile.role !== requiredRole
    ) {
      this.redirectByRole(profile.role);
      return null;
    }

    return {
      user,
      profile
    };
  },

  // Sign Out
  async signOut(
    redirectTo = "index.html"
  ) {
    await supabaseClient.auth.signOut();
    window.location.href = redirectTo;
  }
};

