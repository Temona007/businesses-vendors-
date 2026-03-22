/**
 * Simple demo auth - role selection via buttons
 * In production: JWT, OAuth, session-based auth
 */

const Auth = {
  currentUser: null,

  login(role, userId) {
    this.currentUser = { role, userId };
    sessionStorage.setItem('vendor_dispatch_user', JSON.stringify(this.currentUser));
    return this.currentUser;
  },

  logout() {
    this.currentUser = null;
    sessionStorage.removeItem('vendor_dispatch_user');
  },

  getCurrentUser() {
    if (this.currentUser) return this.currentUser;
    const stored = sessionStorage.getItem('vendor_dispatch_user');
    if (stored) {
      this.currentUser = JSON.parse(stored);
      return this.currentUser;
    }
    return null;
  },

  isLoggedIn() {
    return !!this.getCurrentUser();
  }
};
