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


  // 1. Declare state variables first to fix the initialization error
  let selectedRole = 'brand';

  // 2. Safely call your script checks after variables are declared
  if (typeof FewsionAuth !== 'undefined') {
    FewsionAuth.redirectIfLoggedIn();
  } else {
    console.error("Critical: fewsion-auth.js library is missing or failed to link in the HTML header.");
  }

  // 3. UI Interaction Controller
  function selectRole(role, el) {
    selectedRole = role;
    document.querySelectorAll('.role-btn').forEach(b => b.classList.remove('active'));
    el.classList.add('active');
  }

  function showToast(msg, type='') {
    const t = document.getElementById('toast');
    if (t) {
      t.textContent = msg;
      t.className = 'toast ' + type + ' show';
      setTimeout(() => t.classList.remove('show'), 3000);
    }
  }

  // Explicit routing rules for each platform role
  function getRedirectUrl(role) {
    switch(role) {
      case 'brand':
        return 'fewsion_brand_portal.html';
      case 'creator':
        return 'creator_profile_builder.html';
      case 'editor':
        return 'fewsion_editor_portal.html';
      default:
        return 'index.html'; // Fallback safeguard
    }
  }

  function socialLogin(provider) {
    showToast(`Signing in with ${provider.charAt(0).toUpperCase() + provider.slice(1)}...`);
    setTimeout(() => {
      const names = { brand: 'Arjun Desai', creator: 'Priya Sharma', editor: 'Kabir Mehta' };
      const companies = { brand: 'BrewBox India', creator: null, editor: null };
      const user = {
        role: selectedRole,
        name: names[selectedRole],
        email: names[selectedRole].toLowerCase().replace(' ', '') + '@example.com',
        company: companies[selectedRole],
        avatar: names[selectedRole].split(' ').map(n => n[0]).join(''),
        joinedAt: new Date().toISOString(),
        plan: 'free'
      };
      
      if (typeof FewsionAuth !== 'undefined') {
        FewsionAuth.login(user);
      }
      
      window.location.href = getRedirectUrl(selectedRole);
    }, 1200);
  }

  function handleLogin() {
    const email = document.getElementById('emailInput').value.trim();
    const pass = document.getElementById('passInput').value;
    let valid = true;

    // Validate email
    const emailInput = document.getElementById('emailInput');
    const emailError = document.getElementById('emailError');
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      if(emailInput) emailInput.classList.add('error');
      if(emailError) emailError.style.display = 'block';
      valid = false;
    } else {
      if(emailInput) emailInput.classList.remove('error');
      if(emailError) emailError.style.display = 'none';
    }

    // Validate password
    const passInput = document.getElementById('passInput');
    const passError = document.getElementById('passError');
    if (!pass || pass.length < 6) {
      if(passInput) passInput.classList.add('error');
      if(passError) passError.style.display = 'block';
      valid = false;
    } else {
      if(passInput) passInput.classList.remove('error');
      if(passError) passError.style.display = 'none';
    }
    
    if (!valid) return;

    const btn = document.getElementById('loginBtn');
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Signing in...';
    }

    setTimeout(() => {
      const user = {
        role: selectedRole,
        name: email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        email,
        avatar: email.slice(0, 2).toUpperCase(),
        joinedAt: new Date().toISOString(),
        plan: 'free'
      };
      
      if (typeof FewsionAuth !== 'undefined') {
        FewsionAuth.login(user);
      }
      
      showToast('Welcome back! Redirecting...', 'success');
      setTimeout(() => window.location.href = getRedirectUrl(selectedRole), 800);
    }, 1000);
  }

  // Enter key submission
  document.addEventListener('keydown', e => { if (e.key === 'Enter') handleLogin(); });
