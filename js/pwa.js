/**
 * QUARANTIN — PWA Module
 * Service Worker registration, install prompt handling,
 * online/offline event listeners.
 */

const PWA = {
  deferredPrompt: null,
  isOnline: navigator.onLine,

  /**
   * Initializes all PWA functionality.
   * Called from app.js on DOMContentLoaded.
   * @returns {void}
   */
  init() {
    this.registerServiceWorker();
    this.setupInstallPrompt();
    this.setupOnlineOfflineListeners();
    this.updateOnlineStatus();
  },

  /**
   * Registers the Service Worker for offline support.
   * Only registers if the browser supports Service Workers.
   * @returns {void}
   */
  registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then((registration) => {
            console.log('SW registered:', registration.scope);
          })
          .catch((error) => {
            console.error('SW registration failed:', error);
          });
      });
    }
  },

  /**
   * Sets up the beforeinstallprompt event handler
   * and custom install banner logic.
   * @returns {void}
   */
  setupInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
      // Prevent the default mini-infobar
      e.preventDefault();
      // Stash the event so it can be triggered later
      this.deferredPrompt = e;
      // Show custom install banner
      this.showInstallBanner();
    });

    // Handle user clicking the install button
    const installBtn = document.getElementById('install-btn');
    if (installBtn) {
      installBtn.addEventListener('click', () => {
        this.triggerInstall();
      });
    }

    // Handle dismiss button
    const dismissBtn = document.getElementById('install-dismiss');
    if (dismissBtn) {
      dismissBtn.addEventListener('click', () => {
        this.hideInstallBanner();
      });
    }

    // Detect when app is installed
    window.addEventListener('appinstalled', () => {
      this.hideInstallBanner();
      this.deferredPrompt = null;
      UI.showToast('QUARANTIN installed successfully!', 'success');
    });

    // Hide banner if already in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches) {
      this.hideInstallBanner();
    }
  },

  /**
   * Shows the custom install banner.
   * @returns {void}
   */
  showInstallBanner() {
    const banner = document.getElementById('install-banner');
    if (banner) {
      banner.classList.remove('hidden');
    }
  },

  /**
   * Hides the custom install banner.
   * @returns {void}
   */
  hideInstallBanner() {
    const banner = document.getElementById('install-banner');
    if (banner) {
      banner.classList.add('hidden');
    }
  },

  /**
   * Triggers the native install prompt using the deferred event.
   * @returns {Promise<void>}
   */
  async triggerInstall() {
    if (!this.deferredPrompt) {
      return;
    }
    this.deferredPrompt.prompt();
    const { outcome } = await this.deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted install');
    }
    this.deferredPrompt = null;
    this.hideInstallBanner();
  },

  /**
   * Sets up online/offline event listeners.
   * Shows status banner when connectivity changes.
   * @returns {void}
   */
  setupOnlineOfflineListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.updateOnlineStatus();
      this.showStatusBanner('Back online', 'online');
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.updateOnlineStatus();
      this.showStatusBanner('You are offline — all features still work', 'offline');
    });
  },

  /**
   * Updates the internal online status and toggles UI elements.
   * @returns {void}
   */
  updateOnlineStatus() {
    this.isOnline = navigator.onLine;
    // Update unlock buttons if offline
    if (!this.isOnline) {
      this.disableStripeButtons();
    } else {
      this.enableStripeButtons();
    }
  },

  /**
   * Shows a temporary status banner at the top of the screen.
   * @param {string} message - The message to display
   * @param {string} type - 'online' or 'offline'
   * @returns {void}
   */
  showStatusBanner(message, type) {
    const banner = document.getElementById('status-banner');
    const text = document.getElementById('status-banner-text');
    if (!banner || !text) return;

    text.textContent = message;
    banner.className = 'status-banner ' + type;
    banner.classList.remove('hidden');

    // Auto-hide after 4 seconds
    setTimeout(() => {
      banner.classList.add('hidden');
    }, 4000);
  },

  /**
   * Disables Stripe checkout buttons when offline.
   * @returns {void}
   */
  disableStripeButtons() {
    const buttons = document.querySelectorAll('[data-unlock-trigger], #btn-stripe-checkout');
    buttons.forEach((btn) => {
      btn.disabled = true;
      btn.setAttribute('aria-disabled', 'true');
      btn.title = 'Requires internet connection';
    });
  },

  /**
   * Enables Stripe checkout buttons when online.
   * @returns {void}
   */
  enableStripeButtons() {
    const buttons = document.querySelectorAll('[data-unlock-trigger], #btn-stripe-checkout');
    buttons.forEach((btn) => {
      btn.disabled = false;
      btn.removeAttribute('aria-disabled');
      btn.removeAttribute('title');
    });
  }
};
