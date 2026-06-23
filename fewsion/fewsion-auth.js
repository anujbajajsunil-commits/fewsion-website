// ── Fewsion Auth State ──
// Simple sessionStorage-based auth for demo/prototype

const FewsionAuth = {
  login(user) {
    sessionStorage.setItem('fw_user', JSON.stringify(user));
  },
  logout() {
    sessionStorage.removeItem('fw_user');
    window.location.href = 'index.html';
  },
  getUser() {
    try { return JSON.parse(sessionStorage.getItem('fw_user')); } catch { return null; }
  },
  isLoggedIn() {
    return !!this.getUser();
  },
  requireAuth(role) {
    const user = this.getUser();
    if (!user) { window.location.href = 'login.html'; return null; }
    if (role && user.role !== role) {
      window.location.href = user.role + '-dashboard.html';
      return null;
    }
    return user;
  },
  redirectIfLoggedIn() {
    const user = this.getUser();
    if (user) window.location.href = user.role + '-dashboard.html';
  }
};
