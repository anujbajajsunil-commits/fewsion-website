function animateCounter(el) {
  const value = parseFloat(el.dataset.value || '0');
  const prefix = el.dataset.prefix || '';
  const suffix = el.dataset.suffix || '';
  const decimals = parseInt(el.dataset.decimals || '0', 10);
  const duration = 2000;
  const start = performance.now();

  function tick(now) {
    const p = Math.min((now - start) / duration, 1);
    const eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
    const current = value * eased;
    const formatted = decimals > 0
      ? current.toFixed(decimals)
      : Math.round(current).toLocaleString('en-IN');
    el.textContent = `${prefix}${formatted}${suffix}`;
    if (p < 1) requestAnimationFrame(tick);
    else el.textContent = `${prefix}${decimals > 0 ? value.toFixed(decimals) : value.toLocaleString('en-IN')}${suffix}`;
  }
  requestAnimationFrame(tick);
}

const counterObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        counterObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.3, rootMargin: '0px 0px -60px 0px' }
);
document.querySelectorAll('[data-counter]').forEach((el) => counterObserver.observe(el));
/* ============================================================
   Fewsion Shared Navbar — nav.js
   ------------------------------------------------------------
   USAGE:
   1. Add a placeholder div as the FIRST thing inside <body>:
        <div id="fewsion-nav"></div>
   2. Load this script anywhere on the page (head or body):
        <script src="nav.js"></script>

   REQUIRES: the page must already define Fewsion's CSS
   variables in :root (--black, --amber, --amber2, --white,
   --muted, --text, --border, --border2, --font-display) —
   every Fewsion page already does this as part of the shared
   design system, so no extra setup is needed.
   ============================================================ */
 // 1. GSAP Scroll Reveals (Replacing Framer Motion)
    gsap.registerPlugin(ScrollTrigger);

    gsap.from(".hero-reveal", {
      opacity: 0,
      y: 40,
      duration: 1,
      stagger: 0.2,
      ease: "power3.out"
    });

    gsap.from(".tilt-card", {
      scrollTrigger: {
        trigger: "#business",
        start: "top 80%"
      },
      opacity: 0,
      y: 30,
      duration: 0.8,
      stagger: 0.15,
      ease: "power3.out"
    });

    // 2. Magnetic Button Effect (SpotlightButton / MagneticButton replica)
    document.querySelectorAll('.magnetic-btn').forEach(btn => {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        gsap.to(btn, { x: x * 0.3, y: y * 0.3, duration: 0.3, ease: 'power2.out' });
      });
      btn.addEventListener('mouseleave', () => {
        gsap.to(btn, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.3)' });
      });
    });
// --------------------------------------------------------------//

(function () {
  function init() {
    var NAV_LINKS = [
      { href: 'creators.html', label: 'Creators' },
      { href: 'brands.html', label: 'Brands' },
      { href: 'editors.html', label: 'Editors' },
      { href: 'pricing.html', label: 'Pricing' },
      { href: 'index.html#solution', label: 'How It Works' }
    ];

    var currentPage = (window.location.pathname.split('/').pop() || 'index.html');

    var linksHTML = NAV_LINKS.map(function (l) {
      var isActive = l.href.indexOf(currentPage) === 0 && currentPage !== '' && currentPage !== 'index.html';
      return '<li><a href="' + l.href + '"' + (isActive ? ' class="nav-active"' : '') + '>' + l.label + '</a></li>';
    }).join('');

    var navHTML =
      '<nav id="navbar">' +
        '<a class="nav-logo" href="index.html">Few<span>sion</span></a>' +
        '<ul class="nav-links" id="navLinks">' +
          linksHTML +
          '<li><a href="signup.html" class="nav-cta">Sign up</a></li>' +
          '<li><a href="login.html" class="nav-cta nav-cta-ghost">Login</a></li>' +
        '</ul>' +
        '<div class="nav-hamburger" id="hamburger"><span></span><span></span><span></span></div>' +
      '</nav>';

    var navCSS =
      'nav#navbar{position:fixed;top:0;left:0;right:0;z-index:100;padding:0 5%;height:70px;' +
        'display:flex;align-items:center;justify-content:space-between;' +
        'background:rgba(8,8,8,0.92);backdrop-filter:blur(16px);' +
        'border-bottom:1px solid var(--border);}' +
      '.nav-logo{font-family:var(--font-display);font-size:22px;font-weight:800;letter-spacing:-.5px;color:var(--white);text-decoration:none;}' +
      '.nav-logo span{color:var(--amber);}' +
      '.nav-links{display:flex;align-items:center;gap:36px;list-style:none;}' +
      '.nav-links a{font-size:14px;color:var(--muted);text-decoration:none;font-weight:400;letter-spacing:.02em;transition:color .2s;}' +
      '.nav-links a:hover,.nav-links a.nav-active{color:var(--text);}' +
      '.nav-cta{background:var(--amber);color:#000 !important;font-weight:600 !important;padding:9px 22px;border-radius:50px;transition:opacity .2s,transform .2s !important;}' +
      '.nav-cta:hover{opacity:.88;transform:translateY(-1px) !important;}' +
      '.nav-cta-ghost{background:transparent !important;color:var(--amber) !important;border:1px solid rgba(245,166,35,.4);}' +
      '.nav-hamburger{display:none;flex-direction:column;gap:5px;cursor:pointer;padding:4px;}' +
      '.nav-hamburger span{display:block;width:24px;height:2px;background:var(--text);border-radius:2px;transition:all .3s;}' +
      '@media (max-width:768px){' +
        '.nav-links{display:none;}' +
        '.nav-links.open{display:flex;flex-direction:column;position:fixed;inset:70px 0 0 0;background:rgba(8,8,8,0.97);backdrop-filter:blur(16px);padding:32px 5%;gap:24px;z-index:99;}' +
        '.nav-links.open a{font-size:22px;color:var(--text);}' +
        '.nav-hamburger{display:flex;}' +
      '}';

    // Inject CSS once
    if (!document.getElementById('fewsion-nav-style')) {
      var style = document.createElement('style');
      style.id = 'fewsion-nav-style';
      style.textContent = navCSS;
      document.head.appendChild(style);
    }

    // Inject HTML into placeholder (or prepend to body as a fallback)
    var mount = document.getElementById('fewsion-nav');
    if (mount) {
      mount.innerHTML = navHTML;
    } else {
      document.body.insertAdjacentHTML('afterbegin', navHTML);
    }

    // Mobile menu toggle
    var hamburger = document.getElementById('hamburger');
    var navLinksEl = document.getElementById('navLinks');
    if (hamburger && navLinksEl) {
      hamburger.addEventListener('click', function () {
        navLinksEl.classList.toggle('open');
      });
      navLinksEl.querySelectorAll('a').forEach(function (a) {
        a.addEventListener('click', function () { navLinksEl.classList.remove('open'); });
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
// <nav id="navbar">
//   <a class="nav-logo" href="index.html">Few<span>sion</span></a>
//   <ul class="nav-links" id="navLinks">
//     <li><a href="creators.html">Creators</a></li>
//     <li><a href="brands.html">Brands</a></li>
//     <li><a href="editors.html">Editors</a></li>
//     <li><a href="pricing.html">Pricing</a></li>
//     <li><a href="#solution">How It Works</a></li>
//     <li><a href="signup.html" class="nav-cta">Sign up </a></li>
//     <li><a href="login.html" class="nav-cta">Login</a></li>
//   </ul>
//   <div class="nav-hamburger" id="hamburger" onclick="toggleMenu()">
//     <span></span><span></span><span></span>
//   </div>
// </nav>
// <style>
//   :root {
//     --black: #080808;
//     --deep: #0e0e0e;
//     --card: #141414;
//     --card2: #1a1a1a;
//     --border: rgba(255,255,255,0.07);
//     --border2: rgba(255,255,255,0.12);
//     --amber: #F5A623;
//     --amber2: #FF6B35;
//     --amber-glow: rgba(245,166,35,0.15);
//     --text: #f0ece4;
//     --muted: #888;
//     --muted2: #555;
//     --white: #ffffff;
//     --font-display: 'Syne', sans-serif;
//     --font-body: 'DM Sans', sans-serif;
//     --radius: 16px;
//     --radius-sm: 10px;
//   }

//   *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
//  /* ─── NAV ─── */
//   nav {
//     position: fixed;
//     top: 0; left: 0; right: 0;
//     z-index: 100;
//     padding: 0 5%;
//     height: 70px;
//     display: flex;
//     align-items: center;
//     justify-content: space-between;
//     transition: background 0.3s, border-color 0.3s;
//     border-bottom: 1px solid transparent;
//   }
//   nav.scrolled {
//     background: rgba(8,8,8,0.92);
//     backdrop-filter: blur(16px);
//     border-color: var(--border);
//   }
//   .nav-logo {
//     font-family: var(--font-display);
//     font-size: 22px;
//     font-weight: 800;
//     letter-spacing: -0.5px;
//     color: var(--white);
//     text-decoration: none;
//   }
//   .nav-logo span { color: var(--amber); }
//   .nav-links {
//     display: flex;
//     align-items: center;
//     gap: 36px;
//     list-style: none;
//   }
//   .nav-links a {
//     font-size: 14px;
//     color: var(--muted);
//     text-decoration: none;
//     font-weight: 400;
//     letter-spacing: 0.02em;
//     transition: color 0.2s;
//   }
//   .nav-links a:hover { color: var(--text); }
//   .nav-cta {
//     background: var(--amber);
//     color: #000 !important;
//     font-weight: 600 !important;
//     padding: 9px 22px;
//     border-radius: 50px;
//     transition: opacity 0.2s, transform 0.2s !important;
//   }
//   .nav-cta:hover { opacity: 0.88; transform: translateY(-1px) !important; }
//   .nav-hamburger {
//     display: none;
//     flex-direction: column;
//     gap: 5px;
//     cursor: pointer;
//     padding: 4px;
//   }
//   .nav-hamburger span {
//     display: block;
//     width: 24px;
//     height: 2px;
//     background: var(--text);
//     border-radius: 2px;
//     transition: all 0.3s;
//   }

//     </style>
//  // Sticky nav
//   const navbar = document.getElementById('navbar');
//   window.addEventListener('scroll', () => {
//     navbar.classList.toggle('scrolled', window.scrollY > 20);
//   });

//   // Mobile menu
//   function toggleMenu() {
//     document.getElementById('navLinks').classList.toggle('open');
//   }
//   document.querySelectorAll('.nav-links a').forEach(a => {
//     a.addEventListener('click', () => document.getElementById('navLinks').classList.remove('open'));
//   });

//   // Competitor tabs
//   function showTab(id) {
//     document.querySelectorAll('.comp-tab').forEach((t,i) => {
//       t.classList.toggle('active', ['global','india','gap'][i] === id);
//     });
//     document.querySelectorAll('.comp-panel').forEach(p => p.classList.remove('active'));
//     document.getElementById('tab-' + id).classList.add('active');
//   }

//   // Scroll reveal
//   const observer = new IntersectionObserver((entries) => {
//     entries.forEach(entry => {
//       if (entry.isIntersecting) {
//         entry.target.classList.add('visible');
//         observer.unobserve(entry.target);
//       }
//     });
//   }, { threshold: 0.1 });

//   document.querySelectorAll('.reveal, .roadmap-item').forEach(el => observer.observe(el));

//   // Smooth active nav highlight
//   const sections = document.querySelectorAll('section[id]');
//   const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');
//   window.addEventListener('scroll', () => {
//     let current = '';
//     sections.forEach(s => {
//       if (window.scrollY >= s.offsetTop - 120) current = s.id;
//     });
//     navLinks.forEach(a => {
//       a.style.color = a.getAttribute('href') === '#' + current ? 'var(--text)' : '';
//     });
//   });
