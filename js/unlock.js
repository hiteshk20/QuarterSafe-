/**
 * QUARANTIN — Unlock Module
 * Stripe payment flow, URL param detection, unlock state management.
 * Stripe.js loaded ONLY when unlock modal is opened (lazy load).
 * The ONLY external JS allowed.
 */

const Unlock = {
  /**
   * Stripe configuration.
   * Replace STRIPE_KEY with your actual Stripe publishable key.
   * Replace PAYMENT_LINK_URL with your actual Stripe Payment Link.
   */
  CONFIG: {
    // Replace with your actual Stripe publishable key
    STRIPE_KEY: 'pk_live_REPLACE_WITH_YOUR_STRIPE_PUBLISHABLE_KEY',
    // Replace with your actual Stripe Payment Link URL
    PAYMENT_LINK_URL: 'https://buy.stripe.com/REPLACE_WITH_YOUR_PAYMENT_LINK'
  },

  stripeLoaded: false,

  /**
   * Checks URL parameters for Stripe payment success.
   * Called on app load. If ?payment=success or ?unlocked=true found,
   * sets unlocked flag and cleans URL.
   * @returns {void}
   * @example
   * Unlock.checkUnlockParam()
   */
  checkUnlockParam() {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const paymentSuccess = urlParams.get('payment') === 'success';
      const unlockedParam = urlParams.get('unlocked') === 'true';

      if (paymentSuccess || unlockedParam) {
        // Set unlocked in localStorage
        Storage.setUnlocked();

        // Clean URL without reload
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);

        // Update UI
        UI.updateCalculatorCTA(true);
        UI.updateLockOverlays(true);

        // Show success modal
        UI.showModal('modal-unlocked');

        // Re-render quarterly tracker
        Quarterly.renderQuarterlyTracker();
      }
    } catch (e) {
      console.error('Error checking unlock param:', e);
    }
  },

  /**
   * Shows the unlock modal with feature list and Stripe button.
   * @returns {void}
   * @example
   * Unlock.showUnlockModal()
   */
  showUnlockModal() {
    // Check if offline
    if (!navigator.onLine) {
      UI.showToast('Requires internet connection to unlock', 'error');
      return;
    }

    UI.showModal('modal-unlock');
    this.initStripeButton();
  },

  /**
   * Initializes the Stripe checkout button.
   * Loads Stripe.js lazily (only when unlock modal is opened).
   * Uses Stripe Payment Links — no server required.
   * @returns {void}
   * @example
   * Unlock.initStripeButton()
   */
  initStripeButton() {
    const checkoutBtn = document.getElementById('btn-stripe-checkout');
    if (!checkoutBtn) return;

    // Remove existing listeners
    const newBtn = checkoutBtn.cloneNode(true);
    checkoutBtn.parentNode.replaceChild(newBtn, checkoutBtn);

    newBtn.addEventListener('click', () => {
      // Open Stripe Payment Link in new tab
      // The Payment Link is configured with a success URL that redirects
      // back to this app with ?payment=success
      window.open(this.CONFIG.PAYMENT_LINK_URL, '_blank');

      // Show info toast
      UI.showToast('Complete payment in the new tab, then return here.', 'info');
    });
  },

  /**
   * Renders lock overlays for all locked features.
   * Called when unlock status changes.
   * @returns {void}
   * @example
   * Unlock.renderLockOverlays()
   */
  renderLockOverlays() {
    const unlocked = Storage.isUnlocked();
    UI.updateLockOverlays(unlocked);
    UI.updateCalculatorCTA(unlocked);
  }
};
