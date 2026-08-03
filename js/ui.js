/**
 * QUARANTIN — UI Module
 * All DOM manipulation, render functions, screen transitions.
 * RULE 4: Other modules call ui.js render functions, never touch DOM raw.
 */

const UI = {
  activeModal: null,
  lastFocusedElement: null,
  animationFrameId: null,

  /**
   * Shows a specific screen and hides all others.
   * @param {string} screenId - The screen element ID to show
   * @returns {void}
   * @example
   * UI.showScreen('screen-calculator')
   */
  showScreen(screenId) {
    const screens = document.querySelectorAll('.screen');
    screens.forEach((screen) => {
      if (screen.id === screenId) {
        screen.classList.remove('hidden');
        screen.classList.add('active');
      } else {
        screen.classList.add('hidden');
        screen.classList.remove('active');
      }
    });

    // Update nav tabs
    const tabs = document.querySelectorAll('.nav-tab');
    tabs.forEach((tab) => {
      if (tab.dataset.screen === screenId) {
        tab.classList.add('active');
        tab.setAttribute('aria-current', 'page');
      } else {
        tab.classList.remove('active');
        tab.removeAttribute('aria-current');
      }
    });
  },

  /**
   * Renders calculator output values with count-up animation.
   * Uses requestAnimationFrame for smooth updates.
   * @param {Object} results - Calculation results from calculateFullPayment()
   * @returns {void}
   * @example
   * UI.renderCalculatorOutput({ seTax: 480.4, federalTax: 408, ... })
   */
  renderCalculatorOutput(results) {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }

    this.animationFrameId = requestAnimationFrame(() => {
      this.updateOutputValue('out-se-tax', results.seTax, 'currency');
      this.updateOutputValue('out-fed-tax', results.federalTax, 'currency');
      this.updateOutputValue('out-state-tax', results.stateTax, 'currency');
      this.updateOutputValue('out-total-tax', results.totalTaxThisPayment, 'currency');
      this.updateOutputValue('out-quarantine', results.quarantineAmount, 'currency');
      this.updateOutputValue('out-net', results.netTakeHome, 'currency');
      this.updateOutputValue('out-rate', results.effectiveRate, 'percent');
    });
  },

  /**
   * Updates a single output value element with animation.
   * @param {string} elementId - The DOM element ID
   * @param {number} value - The numeric value to display
   * @param {string} formatType - 'currency' or 'percent'
   * @returns {void}
   */
  updateOutputValue(elementId, value, formatType) {
    const el = document.getElementById(elementId);
    if (!el) return;

    const formatted = formatType === 'percent'
      ? formatPercentage(value)
      : formatCurrency(value);

    el.textContent = formatted;
    el.classList.add('animate-count-up');

    // Remove animation class after it completes
    setTimeout(() => {
      el.classList.remove('animate-count-up');
    }, 500);
  },

  /**
   * Shows a modal with focus trap.
   * @param {string} modalId - The modal element ID
   * @returns {void}
   * @example
   * UI.showModal('modal-onboarding')
   */
  showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    this.lastFocusedElement = document.activeElement;
    modal.classList.remove('hidden');
    this.activeModal = modal;

    // Focus first focusable element
    const focusable = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length > 0) {
      focusable[0].focus();
    }

    // Add keydown listener for focus trap and Escape
    modal.addEventListener('keydown', this.handleModalKeydown.bind(this));

    // Prevent body scroll
    document.body.style.overflow = 'hidden';
  },

  /**
   * Hides the currently active modal.
   * @param {string} [modalId] - Optional specific modal ID
   * @returns {void}
   */
  hideModal(modalId) {
    const modal = modalId
      ? document.getElementById(modalId)
      : this.activeModal;

    if (!modal) return;

    modal.classList.add('hidden');
    modal.removeEventListener('keydown', this.handleModalKeydown.bind(this));
    this.activeModal = null;

    // Restore body scroll
    document.body.style.overflow = '';

    // Return focus to previously focused element
    if (this.lastFocusedElement) {
      this.lastFocusedElement.focus();
      this.lastFocusedElement = null;
    }
  },

  /**
   * Handles keydown events within a modal for focus trapping and Escape.
   * @param {KeyboardEvent} event - The keydown event
   * @returns {void}
   */
  handleModalKeydown(event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.hideModal();
      return;
    }

    if (event.key === 'Tab') {
      const modal = this.activeModal;
      if (!modal) return;

      const focusable = modal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstFocusable = focusable[0];
      const lastFocusable = focusable[focusable.length - 1];

      if (event.shiftKey) {
        if (document.activeElement === firstFocusable) {
          event.preventDefault();
          lastFocusable.focus();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          event.preventDefault();
          firstFocusable.focus();
        }
      }
    }
  },

  /**
   * Shows a toast notification.
   * @param {string} message - The message to display
   * @param {string} [type='info'] - 'success' | 'error' | 'info'
   * @returns {void}
   * @example
   * UI.showToast('Payment saved!', 'success')
   */
  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast ' + type;
    toast.setAttribute('role', 'status');

    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
    const iconSpan = document.createElement('span');
    iconSpan.textContent = icon;
    iconSpan.setAttribute('aria-hidden', 'true');

    const textSpan = document.createElement('span');
    textSpan.textContent = message;

    toast.appendChild(iconSpan);
    toast.appendChild(textSpan);
    container.appendChild(toast);

    // Auto-dismiss after 3000ms
    setTimeout(() => {
      toast.classList.add('toast-dismiss');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 3000);
  },

  /**
   * Applies theme to the document.
   * @param {string} mode - 'dark' or 'light'
   * @returns {void}
   * @example
   * UI.setTheme('dark')
   */
  setTheme(mode) {
    document.documentElement.setAttribute('data-theme', mode);

    // Update theme toggle icon
    const sunIcon = document.querySelector('.icon-sun');
    const moonIcon = document.querySelector('.icon-moon');
    const themeToggle = document.getElementById('setting-theme');

    if (mode === 'dark') {
      if (sunIcon) sunIcon.classList.add('hidden');
      if (moonIcon) moonIcon.classList.remove('hidden');
      if (themeToggle) themeToggle.setAttribute('aria-checked', 'true');
    } else {
      if (sunIcon) sunIcon.classList.remove('hidden');
      if (moonIcon) moonIcon.classList.add('hidden');
      if (themeToggle) themeToggle.setAttribute('aria-checked', 'false');
    }
  },

  /**
   * Toggles between dark and light theme.
   * @returns {void}
   */
  toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const newTheme = current === 'dark' ? 'light' : 'dark';
    this.setTheme(newTheme);
    Storage.saveTheme(newTheme);
  },

  /**
   * Shows or hides an inline error message below an input.
   * @param {string} inputId - The input element ID
   * @param {string} errorId - The error message element ID
   * @param {string|null} message - Error message or null to clear
   * @returns {void}
   * @example
   * UI.showInputError('payment-input', 'payment-input-error', 'Please enter a valid amount')
   */
  showInputError(inputId, errorId, message) {
    const input = document.getElementById(inputId);
    const errorEl = document.getElementById(errorId);

    if (message) {
      if (errorEl) {
        errorEl.textContent = message;
        errorEl.classList.remove('hidden');
      }
      if (input) {
        input.setAttribute('aria-invalid', 'true');
        input.classList.add('animate-shake');
        setTimeout(() => input.classList.remove('animate-shake'), 500);
      }
    } else {
      if (errorEl) {
        errorEl.textContent = '';
        errorEl.classList.add('hidden');
      }
      if (input) {
        input.removeAttribute('aria-invalid');
      }
    }
  },

  /**
   * Updates the save/unlock CTA button based on unlock status.
   * @param {boolean} unlocked - Whether the app is unlocked
   * @returns {void}
   */
  updateCalculatorCTA(unlocked) {
    const saveBtn = document.getElementById('btn-save-payment');
    const unlockBtn = document.getElementById('btn-unlock-cta');

    if (unlocked) {
      if (saveBtn) saveBtn.classList.remove('hidden');
      if (unlockBtn) unlockBtn.classList.add('hidden');
    } else {
      if (saveBtn) saveBtn.classList.add('hidden');
      if (unlockBtn) unlockBtn.classList.remove('hidden');
    }
  },

  /**
   * Shows or hides lock overlays based on unlock status.
   * @param {boolean} unlocked - Whether the app is unlocked
   * @returns {void}
   */
  updateLockOverlays(unlocked) {
    const overlays = document.querySelectorAll('.locked-overlay');
    const lockedContents = document.querySelectorAll('.locked-content');

    overlays.forEach((overlay) => {
      overlay.style.display = unlocked ? 'none' : 'flex';
    });

    lockedContents.forEach((content) => {
      if (unlocked) {
        content.style.filter = 'none';
        content.style.pointerEvents = 'auto';
        content.style.userSelect = 'auto';
      } else {
        content.style.filter = 'blur(6px)';
        content.style.pointerEvents = 'none';
        content.style.userSelect = 'none';
      }
    });
  }
};
