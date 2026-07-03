/**
 * fewsion-creator-data.js
 * Shared data layer for the Fewsion creator dashboard SPA.
 *
 * Depends on:
 *  - @supabase/supabase-js (loaded via CDN before this file)
 *  - fewsion-auth.js (must expose a global `FewsionAuth` with .client() and .requireAuth())
 *
 * Usage:
 *   const user = await FewsionCreatorData.init();
 *   FewsionCreatorData.onChange((section) => { ... re-render whatever depends on `section` ... });
 */
const FewsionCreatorData = (() => {
  let supabase = null;
  let currentUser = null;
  let channel = null;

  const state = {
    profile: null,
    analytics: null,
    applications: [],   // enriched with campaign_title + brand_name
    collaborations: [], // enriched with campaign_title + brand_name
    payments: [],
    reviews: [],
    notifications: [],
    messages: {}, // keyed by collaboration_id -> array of messages
  };

  const listeners = new Set();

  function onChange(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }

  function emit(section) {
    listeners.forEach((fn) => {
      try { fn(section); } catch (err) { console.error("FewsionCreatorData listener error:", err); }
    });
  }

  // ---------------------------------------------------------------------
  // Bootstrapping
  // ---------------------------------------------------------------------

  async function init() {
    supabase = FewsionAuth.client();
    const auth = await FewsionAuth.requireAuth("creator");
    if (!auth) return null;

    currentUser = auth.user;
    await loadAll();
    subscribeRealtime();
    return currentUser;
  }

  async function loadAll() {
    const [profileRes, analyticsRes, notifRes, collabRes] = await Promise.all([
      supabase.from("creator_profiles").select("*").eq("user_id", currentUser.id).maybeSingle(),
      supabase.from("analytics").select("*").eq("user_id", currentUser.id).maybeSingle(),
      supabase.from("notifications").select("*").eq("user_id", currentUser.id).order("created_at", { ascending: false }).limit(50),
      supabase.from("collaborations").select("*").eq("creator_id", currentUser.id).order("created_at", { ascending: false }),
    ]);

    logIfError("creator_profiles", profileRes.error);
    logIfError("analytics", analyticsRes.error);
    logIfError("notifications", notifRes.error);
    logIfError("collaborations", collabRes.error);

    state.profile = profileRes.data || null;
    state.analytics = analyticsRes.data || null;
    state.notifications = notifRes.data || [];
    state.collaborations = collabRes.data || [];

    const { data: apps, error: appsErr } = await supabase
      .from("applications")
      .select("*")
      .eq("creator_id", currentUser.id)
      .order("applied_at", { ascending: false });
    logIfError("applications", appsErr);
    state.applications = apps || [];

    // Enrich applications + collaborations with campaign title / brand name
    await enrichWithCampaignAndBrand();

    // Payments live on collaborations
    const collabIds = state.collaborations.map((c) => c.id);
    if (collabIds.length) {
      const { data: payments, error: payErr } = await supabase
        .from("payments")
        .select("*")
        .in("collaboration_id", collabIds)
        .order("released_at", { ascending: false });
      logIfError("payments", payErr);
      state.payments = payments || [];
    } else {
      state.payments = [];
    }

    const { data: reviews, error: reviewsErr } = await supabase
      .from("reviews")
      .select("*")
      .eq("reviewee_id", currentUser.id);
    logIfError("reviews", reviewsErr);
    state.reviews = reviews || [];

    emit("all");
  }

  async function enrichWithCampaignAndBrand() {
    const campaignIds = [...new Set([
      ...state.applications.map((a) => a.campaign_id),
      ...state.collaborations.map((c) => c.campaign_id),
    ].filter(Boolean))];

    if (!campaignIds.length) return;

    const { data: campaigns, error: cErr } = await supabase
      .from("campaign_briefs")
      .select("*")
      .in("id", campaignIds);
    logIfError("campaign_briefs (creator view)", cErr);

    const campaignsById = {};
    (campaigns || []).forEach((c) => { campaignsById[c.id] = c; });

    const brandIds = [...new Set((campaigns || []).map((c) => c.brand_id).filter(Boolean))];
    let brandsById = {};
    if (brandIds.length) {
      const { data: brands, error: bErr } = await supabase
        .from("brand_profiles")
        .select("user_id, brand_name")
        .in("user_id", brandIds);
      logIfError("brand_profiles (creator view)", bErr);
      (brands || []).forEach((b) => { brandsById[b.user_id] = b.brand_name; });
    }

    function attach(row) {
      const campaign = campaignsById[row.campaign_id];
      row.campaign_title = campaign ? campaign.campaign_title : "Untitled campaign";
      row.brand_name = campaign ? (brandsById[campaign.brand_id] || "Brand partner") : "Brand partner";
      row.budget_allocated = campaign ? campaign.budget_allocated : null;
    }

    state.applications.forEach(attach);
    state.collaborations.forEach(attach);
  }

  function logIfError(table, error) {
    if (error) console.error(`FewsionCreatorData: failed fetching ${table}:`, error);
  }

  // ---------------------------------------------------------------------
  // Realtime
  // ---------------------------------------------------------------------

  function subscribeRealtime() {
    if (channel) supabase.removeChannel(channel);

    channel = supabase
      .channel("creator-live-" + currentUser.id)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${currentUser.id}` },
        (payload) => {
          state.notifications.unshift(payload.new);
          emit("notifications");
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "applications", filter: `creator_id=eq.${currentUser.id}` },
        async (payload) => {
          upsertLocal(state.applications, payload);
          await enrichWithCampaignAndBrand();
          emit("applications");
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "collaborations", filter: `creator_id=eq.${currentUser.id}` },
        async (payload) => {
          upsertLocal(state.collaborations, payload);
          await enrichWithCampaignAndBrand();
          emit("collaborations");
        }
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "payments" }, (payload) => {
        const row = payload.new || payload.old;
        const collabIds = state.collaborations.map((c) => c.id);
        if (!row || !collabIds.includes(row.collaboration_id)) return;
        upsertLocal(state.payments, payload);
        emit("payments");
      })
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reviews", filter: `reviewee_id=eq.${currentUser.id}` },
        (payload) => {
          upsertLocal(state.reviews, payload);
          emit("reviews");
        }
      )
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const cid = payload.new.collaboration_id;
        if (!state.messages[cid]) return;
        state.messages[cid].push(payload.new);
        emit("messages:" + cid);
      })
      .subscribe();
  }

  function upsertLocal(arr, payload) {
    if (payload.eventType === "DELETE") {
      const idx = arr.findIndex((r) => r.id === payload.old.id);
      if (idx > -1) arr.splice(idx, 1);
      return;
    }
    const idx = arr.findIndex((r) => r.id === payload.new.id);
    if (idx > -1) arr[idx] = payload.new;
    else arr.unshift(payload.new);
  }

  // ---------------------------------------------------------------------
  // Messages
  // ---------------------------------------------------------------------

  async function loadMessages(collaborationId) {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("collaboration_id", collaborationId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Failed to load messages:", error);
      state.messages[collaborationId] = [];
    } else {
      state.messages[collaborationId] = data || [];
    }
    emit("messages:" + collaborationId);
    return state.messages[collaborationId];
  }

  async function sendMessage(collaborationId, content) {
    if (!content || !content.trim()) return null;
    const { data, error } = await supabase
      .from("messages")
      .insert({ collaboration_id: collaborationId, sender_id: currentUser.id, content: content.trim() })
      .select()
      .single();

    if (error) throw error;

    if (!state.messages[collaborationId]) state.messages[collaborationId] = [];
    state.messages[collaborationId].push(data);
    emit("messages:" + collaborationId);
    return data;
  }

  // ---------------------------------------------------------------------
  // Notifications
  // ---------------------------------------------------------------------

  async function markNotificationsRead() {
    const unread = state.notifications.filter((n) => !n.is_read);
    if (!unread.length) return;
    const ids = unread.map((n) => n.id);
    const { error } = await supabase.from("notifications").update({ is_read: true }).in("id", ids);
    if (error) { console.error("Failed to mark notifications read:", error); return; }
    state.notifications.forEach((n) => { n.is_read = true; });
    emit("notifications");
  }

  // ---------------------------------------------------------------------
  // Derived helpers
  // ---------------------------------------------------------------------

  function totalEarnings(onlyReleased = false) {
    return state.payments
      .filter((p) => !onlyReleased || p.status === "released")
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);
  }

  function unreadNotificationCount() {
    return state.notifications.filter((n) => !n.is_read).length;
  }

  function averageRating() {
    if (!state.reviews.length) return null;
    const withRating = state.reviews.filter((r) => r.rating != null);
    if (!withRating.length) return null;
    return (withRating.reduce((s, r) => s + r.rating, 0) / withRating.length).toFixed(1);
  }

  function collaborationById(id) {
    return state.collaborations.find((c) => c.id === id) || null;
  }

  function paymentsForCollaboration(collaborationId) {
    return state.payments.filter((p) => p.collaboration_id === collaborationId);
  }

  function getUser() {
    return currentUser;
  }

  return {
    init,
    state,
    onChange,
    reload: loadAll,
    loadMessages,
    sendMessage,
    markNotificationsRead,
    totalEarnings,
    unreadNotificationCount,
    averageRating,
    collaborationById,
    paymentsForCollaboration,
    getUser,
  };
})();
