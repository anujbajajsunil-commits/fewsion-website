/**
 * fewsion-data.js
 * Shared data layer for the Fewsion brand dashboard SPA.
 *
 * Depends on:
 *  - @supabase/supabase-js (loaded via CDN before this file)
 *  - fewsion-auth.js (must expose a global `FewsionAuth` with .client() and .requireAuth())
 *
 * Usage:
 *   const user = await FewsionData.init();
 *   FewsionData.onChange((section) => { ... re-render whatever depends on `section` ... });
 */
const FewsionData = (() => {
  let supabase = null;
  let currentUser = null;
  let channel = null;

  const state = {
    profile: null,
    campaigns: [],
    applications: [],
    collaborations: [],
    payments: [],
    notifications: [],
    messages: {}, // keyed by collaboration_id -> array of messages
  };

  const listeners = new Set();

  function onChange(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn); // returns an unsubscribe fn
  }

  function emit(section) {
    listeners.forEach((fn) => {
      try { fn(section); } catch (err) { console.error("FewsionData listener error:", err); }
    });
  }

  // ---------------------------------------------------------------------
  // Bootstrapping
  // ---------------------------------------------------------------------

  async function init() {
    supabase = FewsionAuth.client();
    const auth = await FewsionAuth.requireAuth("brand");
    if (!auth) return null; // FewsionAuth already handled the redirect

    currentUser = auth.user;
    await loadAll();
    subscribeRealtime();
    return currentUser;
  }

  async function loadAll() {
    const [profileRes, campaignsRes, collabRes, notifRes] = await Promise.all([
      supabase.from("brand_profiles").select("*").eq("user_id", currentUser.id).maybeSingle(),
      supabase.from("campaign_briefs").select("*").eq("brand_id", currentUser.id).order("created_at", { ascending: false }),
      supabase.from("collaborations").select("*").eq("brand_id", currentUser.id),
      supabase.from("notifications").select("*").eq("user_id", currentUser.id).order("created_at", { ascending: false }).limit(50),
    ]);

    logIfError("brand_profiles", profileRes.error);
    logIfError("campaign_briefs", campaignsRes.error);
    logIfError("collaborations", collabRes.error);
    logIfError("notifications", notifRes.error);

    state.profile = profileRes.data || null;
    state.campaigns = campaignsRes.data || [];
    state.collaborations = collabRes.data || [];
    state.notifications = notifRes.data || [];

    // Applications are keyed off campaign IDs, so fetch after campaigns resolve
    const campaignIds = state.campaigns.map((c) => c.id);
    if (campaignIds.length) {
      const { data: apps, error: appsErr } = await supabase
        .from("applications")
        .select("*, users(first_name, last_name, email, role)")
        .in("campaign_id", campaignIds)
        .order("applied_at", { ascending: false });
      logIfError("applications", appsErr);
      state.applications = apps || [];
    } else {
      state.applications = [];
    }

    // Payments are keyed off collaboration IDs
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

    emit("all");
  }

  function logIfError(table, error) {
    if (error) console.error(`Fewsion: failed fetching ${table}:`, error);
  }

  // ---------------------------------------------------------------------
  // Realtime
  // ---------------------------------------------------------------------

  function subscribeRealtime() {
    if (channel) supabase.removeChannel(channel);

    channel = supabase
      .channel("brand-live-" + currentUser.id)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${currentUser.id}` },
        (payload) => {
          state.notifications.unshift(payload.new);
          emit("notifications");
        }
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "applications" }, (payload) => {
        const row = payload.new || payload.old;
        const campaignIds = state.campaigns.map((c) => c.id);
        if (!row || !campaignIds.includes(row.campaign_id)) return;
        upsertLocal(state.applications, payload);
        emit("applications");
      })
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "collaborations", filter: `brand_id=eq.${currentUser.id}` },
        (payload) => {
          upsertLocal(state.collaborations, payload);
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
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const cid = payload.new.collaboration_id;
        // Only keep pushing into threads the brand has actually opened this session
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
  // Applications: approve / reject
  // ---------------------------------------------------------------------

  async function updateApplicationStatus(applicationId, newStatus) {
    const { error } = await supabase.from("applications").update({ status: newStatus }).eq("id", applicationId);
    if (error) throw error;

    const application = state.applications.find((a) => a.id === applicationId);
    if (application) application.status = newStatus;
    emit("applications");
    if (!application) return;

    const campaign = state.campaigns.find((c) => c.id === application.campaign_id);
    const campaignTitle = campaign ? campaign.campaign_title : "a campaign";

    if (newStatus === "approved") {
      const { data: collab, error: collabError } = await supabase
        .from("collaborations")
        .insert({
          campaign_id: application.campaign_id,
          creator_id: application.creator_id,
          brand_id: currentUser.id,
          status: "active",
          payment: campaign ? campaign.budget_allocated : null,
        })
        .select()
        .single();

      if (collabError) {
        console.error("Failed to create collaboration:", collabError);
      } else if (collab) {
        state.collaborations.unshift(collab);
        emit("collaborations");
      }

      await supabase.from("notifications").insert({
        user_id: application.creator_id,
        title: "Application approved",
        message: `Your application for "${campaignTitle}" was approved!`,
        is_read: false,
      });
    }

    if (newStatus === "rejected") {
      await supabase.from("notifications").insert({
        user_id: application.creator_id,
        title: "Application update",
        message: `Your application for "${campaignTitle}" was not approved this time.`,
        is_read: false,
      });
    }
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

  function totalSpend(onlyReleased = false) {
    return state.payments
      .filter((p) => !onlyReleased || p.status === "released")
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);
  }

  function unreadNotificationCount() {
    return state.notifications.filter((n) => !n.is_read).length;
  }

  function campaignById(id) {
    return state.campaigns.find((c) => c.id === id) || null;
  }

  function applicationsForCampaign(campaignId) {
    return state.applications.filter((a) => a.campaign_id === campaignId);
  }

  function collaborationsForCampaign(campaignId) {
    return state.collaborations.filter((c) => c.campaign_id === campaignId);
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
    updateApplicationStatus,
    loadMessages,
    sendMessage,
    markNotificationsRead,
    totalSpend,
    unreadNotificationCount,
    campaignById,
    applicationsForCampaign,
    collaborationsForCampaign,
    paymentsForCollaboration,
    getUser,
  };
})();
