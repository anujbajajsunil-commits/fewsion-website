/**
 * fewsion-editor-data.js
 * Shared data layer for the Fewsion editor dashboard SPA.
 *
 * Depends on:
 *  - @supabase/supabase-js (loaded via CDN before this file)
 *  - fewsion-auth.js (must expose a global `FewsionAuth` with .client() and .requireAuth())
 */
const FewsionEditorData = (() => {
  let supabase = null;
  let currentUser = null;
  let channel = null;

  const state = {
    profile: null,
    collaborations: [], // enriched with campaign_title + brand_name
    payments: [],
    notifications: [],
    messages: {}, // keyed by collaboration_id -> array of messages
    reviews: [],
     portfolioItems: [],
     campaigns: [],
  };

  const listeners = new Set();

  function onChange(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }

  function emit(section) {
    listeners.forEach((fn) => {
      try { fn(section); } catch (err) { console.error("FewsionEditorData listener error:", err); }
    });
  }

  // ---------------------------------------------------------------------
  // Bootstrapping
  // ---------------------------------------------------------------------

  async function init() {
    supabase = FewsionAuth.client();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      window.location.href = "login.html";
      return null;
    }
    currentUser = session.user;
    await loadAll();
    subscribeRealtime();
    return currentUser;
  }

  async function loadAll() {
    const [profileRes, notifRes, collabRes, reviewsRes, portfolioRes] = await Promise.all([
      supabase.from("editor_profiles").select("*").eq("user_id", currentUser.id).maybeSingle(),
      supabase.from("notifications").select("*").eq("user_id", currentUser.id).order("created_at", { ascending: false }).limit(50),
      supabase.from("collaborations").select("*").eq("editor_id", currentUser.id).order("created_at", { ascending: false }),
      supabase.from("reviews").select("*").eq("reviewee_id", currentUser.id),
      supabase.from("portfolio_items").select("*").eq("editor_id", currentUser.id).order("created_at", { ascending: false }),
    ]);

    logIfError("editor_profiles", profileRes.error);
    logIfError("notifications", notifRes.error);
    logIfError("collaborations", collabRes.error);
    logIfError("reviews", reviewsRes.error);
    logIfError("portfolio_items", portfolioRes.error);

    state.profile = profileRes.data || null;
    state.notifications = notifRes.data || [];
    state.collaborations = collabRes.data || [];
    state.reviews = reviewsRes.data || [];
     state.portfolioItems = portfolioRes.data || [];

    await enrichWithCampaignAndBrand();

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

  async function enrichWithCampaignAndBrand() {
    const campaignIds = [...new Set(state.collaborations.map((c) => c.campaign_id).filter(Boolean))];
    if (!campaignIds.length) return;

    const { data: campaigns, error: cErr } = await supabase
      .from("campaign_briefs")
      .select("*")
      .in("id", campaignIds);
    logIfError("campaign_briefs (editor view)", cErr);

    const campaignsById = {};
    (campaigns || []).forEach((c) => { campaignsById[c.id] = c; });

    const brandIds = [...new Set((campaigns || []).map((c) => c.brand_id).filter(Boolean))];
    let brandsById = {};
    if (brandIds.length) {
      const { data: brands, error: bErr } = await supabase
        .from("brand_profiles")
        .select("user_id, brand_name")
        .in("user_id", brandIds);
      logIfError("brand_profiles (editor view)", bErr);
      (brands || []).forEach((b) => { brandsById[b.user_id] = b.brand_name; });
    }

    state.collaborations.forEach((row) => {
      const campaign = campaignsById[row.campaign_id];
      row.campaign_title = campaign ? campaign.campaign_title : "Untitled campaign";
      row.brand_name = campaign ? (brandsById[campaign.brand_id] || "Brand partner") : "Brand partner";
    });
  }

  function logIfError(table, error) {
    if (error) console.error(`FewsionEditorData: failed fetching ${table}:`, error);
  }

  // ---------------------------------------------------------------------
  // Realtime
  // ---------------------------------------------------------------------

  function subscribeRealtime() {
    if (channel) supabase.removeChannel(channel);

    channel = supabase
      .channel("editor-live-" + currentUser.id)
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
        { event: "*", schema: "public", table: "collaborations", filter: `editor_id=eq.${currentUser.id}` },
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
//-------------------------------------------------------------------------
// ---------------------------------------------------------------------
// Portfolio items
// ---------------------------------------------------------------------

async function addPortfolioItem({ title, link, views, ctr, engagement, niche }) {
  const { data, error } = await supabase
    .from("portfolio_items")
    .insert({
      editor_id: currentUser.id,
      title,
      link,
      views: views || 0,
      ctr: ctr || 0,
      engagement: engagement || 0,
      niche: niche || null,
    })
    .select()
    .single();

  if (error) throw error;

  state.portfolioItems.unshift(data);
  emit("portfolio");
  return data;
}

async function deletePortfolioItem(itemId) {
  const { error } = await supabase.from("portfolio_items").delete().eq("id", itemId).eq("editor_id", currentUser.id);
  if (error) throw error;
  const idx = state.portfolioItems.findIndex((p) => p.id === itemId);
  if (idx > -1) state.portfolioItems.splice(idx, 1);
  emit("portfolio");
}

// ---------------------------------------------------------------------
// Campaigns (browse & apply)
// ---------------------------------------------------------------------

async function loadOpenCampaigns() {
  const { data: campaigns, error } = await supabase
    .from("campaigns")
    .select("*")
    .eq("status", "open")
    .order("created_at", { ascending: false });

  if (error) throw error;

  const { data: myApps, error: appErr } = await supabase
    .from("campaign_applications")
    .select("campaign_id")
    .eq("editor_id", currentUser.id);

  if (appErr) console.error("Failed to load campaign applications:", appErr);

  const appliedIds = new Set((myApps || []).map((a) => a.campaign_id));
  const enriched = (campaigns || []).map((c) => ({ ...c, already_applied: appliedIds.has(c.id) }));

  state.campaigns = enriched;
  emit("campaigns");
  return enriched;
}

async function applyToCampaign(campaignId) {
  const { error } = await supabase
    .from("campaign_applications")
    .insert({ campaign_id: campaignId, editor_id: currentUser.id });

  if (error) throw error;

  if (state.campaigns) {
    const c = state.campaigns.find((c) => c.id === campaignId);
    if (c) c.already_applied = true;
  }
  emit("campaigns");
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
  // Editor can update collaboration status (e.g. mark delivered)
  // ---------------------------------------------------------------------

  async function updateCollaborationStatus(collaborationId, newStatus) {
    const { error } = await supabase.from("collaborations").update({ status: newStatus }).eq("id", collaborationId);
    if (error) throw error;
    const collab = state.collaborations.find((c) => c.id === collaborationId);
    if (collab) collab.status = newStatus;
    emit("collaborations");
  }

  // ---------------------------------------------------------------------
  // Derived helpers
  // ---------------------------------------------------------------------

  function totalRevenue(onlyReleased = false) {
    return state.payments
      .filter((p) => !onlyReleased || p.status === "released")
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);
  }

  function unreadNotificationCount() {
    return state.notifications.filter((n) => !n.is_read).length;
  }

  function activeCollaborations() {
    return state.collaborations.filter((c) => {
      const s = (c.status || "").toLowerCase();
      return s !== "completed" && s !== "delivered";
    });
  }

  function completedCollaborations() {
    return state.collaborations.filter((c) => {
      const s = (c.status || "").toLowerCase();
      return s === "completed" || s === "delivered";
    });
  }

  function getUser() {
    return currentUser;
  }

  // ---------------------------------------------------------------------
  // Pending collab invites (from creators/brands assigning this editor)
  // ---------------------------------------------------------------------

  function pendingInvites() {
    return state.collaborations.filter((c) => c.editor_invite_status === "pending");
  }

  async function respondToInvite(collaborationId, accept) {
    const newInviteStatus = accept ? "accepted" : "declined";
    const updates = { editor_invite_status: newInviteStatus };
    // If declined, free the slot up so the creator/brand can invite someone else
    if (!accept) updates.editor_id = null;

    const { error } = await supabase.from("collaborations").update(updates).eq("id", collaborationId);
    if (error) throw error;

    const collab = state.collaborations.find((c) => c.id === collaborationId);
    if (collab) Object.assign(collab, updates);
    emit("collaborations");
  }

  function averageRating() {
    const withRating = state.reviews.filter((r) => r.rating != null);
    if (!withRating.length) return null;
    return (withRating.reduce((s, r) => s + r.rating, 0) / withRating.length).toFixed(1);
  }

  return {
    init,
    state,
    onChange,
    reload: loadAll,
    loadMessages,
    sendMessage,
    markNotificationsRead,
    updateCollaborationStatus,
    totalRevenue,
    unreadNotificationCount,
    activeCollaborations,
    completedCollaborations,
    getUser,
    pendingInvites,
    respondToInvite,
    averageRating,
     addPortfolioItem,      // NEW
  deletePortfolioItem,   // NEW
  loadOpenCampaigns,     // NEW
  applyToCampaign, 
  };
})();
