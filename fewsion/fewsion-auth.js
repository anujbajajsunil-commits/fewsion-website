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

// Updated Form Submission Controller
async function startGenerate(){
  const bn = document.getElementById('brandName').value.trim();
  const cn = document.getElementById('campaignName').value.trim();
  const km = document.getElementById('keyMessage').value.trim();
  
  if (!bn || !cn || !km) {
    const e = document.getElementById('genErr');
    e.textContent = 'Please fill in brand name, campaign name, and key message.';
    e.style.display = 'block';
    return;
  }
  document.getElementById('genErr').style.display = 'none';
  go(4);

  const msgs = ['Crafting AI-powered campaign brief', 'Analysing creator fit signals', 'Building brand storefront', 'Generating match criteria'];
  let mi = 0;
  const msgEl = document.getElementById('genMsg');
  const int = setInterval(() => { mi++; if (mi < msgs.length) msgEl.textContent = msgs[mi]; }, 2000);

  const brandData = {
    brandName: bn,
    industry: S.industry || 'Not specified',
    website: document.getElementById('website').value,
    brandDesc: document.getElementById('brandDesc').value,
    market: S.market || 'Not specified',
    campaignName: cn,
    objective: S.obj || 'Not specified',
    contentTypes: S.ctype,
    startDate: document.getElementById('startDate').value,
    duration: document.getElementById('duration').value,
    budget: getBudget(),
    creatorTiers: S.tier,
    minEngagement: getEng(),
    creatorNiches: S.cniche,
    languages: S.lang,
    creatorCount: document.getElementById('creatorCount').value,
    genderPref: document.getElementById('genderPref').value,
    keyMessage: km,
    dos: document.getElementById('dos').value,
    donts: document.getElementById('donts').value,
    tone: S.tone,
    promoCode: document.getElementById('promoCode').value
  };

  try {
    // Browser client requests directly to api.anthropic.com will always trigger a CORS block.
    // If you plan to use live responses, migrate this specific endpoint fetch to a serverless backend function.
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{ role: 'user', content: buildPrompt(brandData) }]
      })
    });
    const data = await resp.json();
    clearInterval(int);
    const textBlock = data.content.find(b => b.type === 'text');
    if (!textBlock) throw new Error('no text');
    const raw = textBlock.text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(raw);
    
    renderStorefront(brandData, parsed);
    await saveBrandToSupabase(brandData, parsed);

  } catch (e) {
    console.warn("API/CORS restriction encountered. Processing fallback path gracefully...");
    clearInterval(int);
    const fallback = fallbackBrief(brandData);
    
    // Renders UI matching image_1a7100.png 
    renderStorefront(brandData, fallback);
    
    // Executes fallback save to Supabase table
    await saveBrandToSupabase(brandData, fallback);
  }
}

// Updated Supabase Write Hook with Session Safeguards
async function saveBrandToSupabase(brandData, aiParsedResult) {
  try {
    if (!supabaseClientInstance && window.supabase) {
      supabaseClientInstance = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    }
    
    if (!supabaseClientInstance) {
      console.error("Supabase engine down or client uninitialized.");
      return; 
    }

    // Safely check for FewsionAuth instance availability
    let userId = null;
    if (typeof FewsionAuth !== 'undefined') {
      const activeUser = FewsionAuth.getUser();
      if (activeUser && activeUser.id) {
        userId = activeUser.id;
      }
    }

    // Fallback: If not logged in, fetch or match a dummy row for development
    if (!userId) {
      console.warn("FewsionAuth profile missing or unlinked. Querying active Supabase session fallback...");
      const { data: sessionData } = await supabaseClientInstance.auth.getSession();
      if (sessionData && sessionData.session) {
        userId = sessionData.session.user.id;
      } else {
        // Stop execution if no valid authenticated record can be matched
        console.error("Submission halted: Entries require a authenticated user_id.");
        return;
      }
    }

    const payload = {
      user_id: userId, 
      brand_name: brandData.brandName,
      industry: brandData.industry,
      website_url: brandData.website,
      brand_description: brandData.brandDesc,
      primary_market: brandData.market,
      campaign_name: brandData.campaignName,
      campaign_objective: brandData.objective,
      content_types_needed: brandData.contentTypes, 
      start_date: brandData.startDate,
      duration: brandData.duration,
      budget_range: brandData.budget,
      creator_tier_preferences: brandData.creatorTiers,
      min_engagement_rate: parseFloat(brandData.minEngagement) || 0.00,
      creator_niches: brandData.creatorNiches,
      language_preferences: brandData.languages,
      creator_count: brandData.creatorCount,
      gender_preference: brandData.genderPref,
      key_message: brandData.keyMessage,
      dos: brandData.dos,
      donts: brandData.donts,
      brand_tone: brandData.tone,
      promo_code: brandData.promoCode,
      ai_fit_score: parseInt(aiParsedResult.campaign_fit_score) || 74
    };

    console.log("Transmitting payload to 'brand_profiles' table...", payload);

    const { data, error } = await supabaseClientInstance
      .from('brand_profiles')
      .insert([payload]);

    if (error) throw error;
    console.log("Data successfully posted to Supabase database!");

  } catch (err) {
    console.error("Database table insertion crash:", err.message);
  }
}
