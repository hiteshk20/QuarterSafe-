/**
 * QUARANTIN — Main Application Entry Point
 * Initializer, router between views, event binding.
 */

const App = {
  profile: null,
  currentResults: null,

  /**
   * Initializes the entire application.
   * Called on DOMContentLoaded.
   * @returns {void}
   */
  init() {
    // Register PWA features
    PWA.init();

    // Initialize theme
    const savedTheme = Storage.getTheme();
    UI.setTheme(savedTheme);

    // Load profile
    this.profile = Storage.loadProfile();

    // Check unlock status from URL params (Stripe return)
    Unlock.checkUnlockParam();

    // Check if unlocked
    const unlocked = Storage.isUnlocked();

    // Show onboarding if no profile exists
    if (!this.profile) {
      this.showOnboarding();
    } else {
      this.showCalculator();
    }

    // Update UI based on unlock status
    UI.updateCalculatorCTA(unlocked);
    UI.updateLockOverlays(unlocked);

    // Bind events
    this.bindNavigation();
    this.bindCalculatorInput();
    this.bindThemeToggle();
    this.bindSettingsGear();
    this.bindUnlockButtons();
    this.bindOnboarding();
    this.bindModals();

    // Initialize quarterly tracker
    Quarterly.renderQuarterlyTracker();
  },

  /**
   * Shows the onboarding modal for first-time users.
   * @returns {void}
   */
  showOnboarding() {
    this.populateStateDropdown('onboarding-state');
    UI.showModal('modal-onboarding');
  },

  /**
   * Shows the calculator screen with saved profile.
   * @returns {void}
   */
  showCalculator() {
    UI.showScreen('screen-calculator');
  },

  /**
   * Populates a state dropdown/select element with all 50 states + DC.
   * @param {string} selectId - The select element ID
   * @returns {void}
   */
  populateStateDropdown(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return;

    const states = TAX_DATA.getStatesList();
    select.innerHTML = '';

    states.forEach((state) => {
      const option = document.createElement('option');
      option.value = state.code;
      option.textContent = state.name;
      select.appendChild(option);
    });
  },

  /**
   * Binds navigation tab click events.
   * @returns {void}
   */
  bindNavigation() {
    const tabs = document.querySelectorAll('.nav-tab');
    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const screenId = tab.dataset.screen;
        UI.showScreen(screenId);

        // Trigger screen-specific renders
        if (screenId === 'screen-history') {
          History.renderHistoryTable();
          History.renderYTDCards();
        } else if (screenId === 'screen-dashboard') {
          Dashboard.renderDashboard();
        } else if (screenId === 'screen-settings') {
          Settings.loadSettingsForm();
        }
      });
    });
  },

  /**
   * Binds the payment input field with debounced calculation.
   * @returns {void}
   */
  bindCalculatorInput() {
    const input = document.getElementById('payment-input');
    if (!input) return;

    const debouncedCalc = debounce(() => {
      this.runCalculation();
    }, 150);

    input.addEventListener('input', () => {
      // Add typing glow
      input.classList.add('typing');

      // Clear typing glow after 500ms of no input
      clearTimeout(input._typingTimeout);
      input._typingTimeout = setTimeout(() => {
        input.classList.remove('typing');
      }, 500);

      debouncedCalc();
    });

    // Also recalculate when profile-related settings change
    input.addEventListener('blur', () => {
      input.classList.remove('typing');
    });
  },

  /**
   * Runs the full calculation and renders output.
   * Validates input before calculating.
   * @returns {void}
   */
  runCalculation() {
    const input = document.getElementById('payment-input');
    const rawValue = input ? input.value : '';
    const grossPayment = sanitizeNumber(rawValue);

    // Validate input
    if (rawValue.trim() === '' || rawValue.trim() === '$') {
      UI.showInputError('payment-input', 'payment-input-error', null);
      UI.renderCalculatorOutput({
        seTax: 0, federalTax: 0, stateTax: 0,
        totalTaxThisPayment: 0, quarantineAmount: 0,
        netTakeHome: 0, effectiveRate: 0
      });
      this.currentResults = null;
      return;
    }

    if (grossPayment <= 0) {
      UI.showInputError('payment-input', 'payment-input-error', 'Please enter a valid positive amount.');
      return;
    }

    if (grossPayment > 99999999) {
      UI.showInputError('payment-input', 'payment-input-error', 'Amount too large. Maximum is $99,999,999.');
      return;
    }

    // Clear any previous error
    UI.showInputError('payment-input', 'payment-input-error', null);

    // Get profile data
    const profile = this.profile || {};
    const filingStatus = profile.filingStatus || 'single';
    const stateCode = profile.stateCode || 'CA';
    const businessDeductions = profile.businessDeductions || 0;
    const w2Income = profile.w2Income || 0;

    // Get YTD gross from payment history
    Storage.getAllPayments().then((payments) => {
      const ytdGross = payments.reduce((sum, p) => sum + (p.gross || 0), 0);

      // Run calculation
      const results = calculateFullPayment({
        grossPayment,
        filingStatus,
        stateCode,
        businessDeductions,
        w2Income,
        ytdGross
      });

      this.currentResults = results;
      UI.renderCalculatorOutput(results);

      // Trigger "shock moment" animation on quarantine amount
      const quarantineEl = document.getElementById('out-quarantine');
      if (quarantineEl && results.quarantineAmount > 0) {
        quarantineEl.classList.add('animate-flash-red');
        setTimeout(() => {
          quarantineEl.classList.remove('animate-flash-red');
        }, 1000);
      }
    });
  },

  /**
   * Binds theme toggle button.
   * @returns {void}
   */
  bindThemeToggle() {
    const toggle = document.getElementById('theme-toggle');
    if (toggle) {
      toggle.addEventListener('click', () => {
        UI.toggleTheme();
      });
    }
  },

  /**
   * Binds settings gear button to navigate to settings screen.
   * @returns {void}
   */
  bindSettingsGear() {
    const gear = document.getElementById('settings-gear');
    if (gear) {
      gear.addEventListener('click', () => {
        UI.showScreen('screen-settings');
        Settings.loadSettingsForm();
      });
    }
  },

  /**
   * Binds all unlock trigger buttons.
   * @returns {void}
   */
  bindUnlockButtons() {
    const unlockButtons = document.querySelectorAll('[data-unlock-trigger], #btn-unlock-cta');
    unlockButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        Unlock.showUnlockModal();
      });
    });
  },

  /**
   * Binds onboarding modal step navigation.
   * @returns {void}
   */
  bindOnboarding() {
    let currentStep = 1;
    const totalSteps = 3;

    const showStep = (step) => {
      const steps = document.querySelectorAll('.onboarding-step');
      const dots = document.querySelectorAll('.progress-dot');

      steps.forEach((s, i) => {
        if (i + 1 === step) {
          s.classList.remove('hidden');
          s.classList.add('active');
        } else {
          s.classList.add('hidden');
          s.classList.remove('active');
        }
      });

      dots.forEach((dot, i) => {
        if (i + 1 === step) {
          dot.classList.add('active');
        } else {
          dot.classList.remove('active');
        }
      });

      currentStep = step;
    };

    // Next buttons
    const nextButtons = document.querySelectorAll('[data-onboarding-next]');
    nextButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        if (currentStep < totalSteps) {
          showStep(currentStep + 1);
        }
      });
    });

    // Back buttons
    const backButtons = document.querySelectorAll('[data-onboarding-back]');
    backButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        if (currentStep > 1) {
          showStep(currentStep - 1);
        }
      });
    });

    // Complete button
    const completeBtn = document.querySelector('[data-onboarding-complete]');
    if (completeBtn) {
      completeBtn.addEventListener('click', () => {
        this.completeOnboarding();
      });
    }

    // Skip button
    const skipBtn = document.querySelector('[data-onboarding-skip]');
    if (skipBtn) {
      skipBtn.addEventListener('click', () => {
        this.completeOnboarding(true);
      });
    }
  },

  /**
   * Completes onboarding, saves profile, dismisses modal.
   * @param {boolean} [skipW2=false] - Whether W-2 step was skipped
   * @returns {void}
   */
  completeOnboarding(skipW2 = false) {
    // Gather values
    const filingRadio = document.querySelector('input[name="onboarding-filing"]:checked');
    const filingStatus = filingRadio ? filingRadio.value : 'single';

    const stateSelect = document.getElementById('onboarding-state');
    const stateCode = stateSelect ? stateSelect.value : 'CA';

    const w2Input = document.getElementById('onboarding-w2');
    const w2Income = (!skipW2 && w2Input) ? sanitizeNumber(w2Input.value) : 0;

    // Save profile
    const profile = {
      filingStatus,
      stateCode,
      w2Income,
      businessDeductions: 0,
      taxYear: getCurrentYear()
    };

    Storage.saveProfile(profile);
    this.profile = profile;

    // Close modal
    UI.hideModal('modal-onboarding');

    // Show calculator
    UI.showScreen('screen-calculator');
    UI.showToast('Profile saved! Start calculating your payments.', 'success');
  },

  /**
   * Binds modal close buttons and overlay clicks.
   * @returns {void}
   */
  bindModals() {
    // Close buttons
    const closeButtons = document.querySelectorAll('[data-modal-close]');
    closeButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        UI.hideModal();
      });
    });

    // Click overlay to close (except onboarding)
    const overlays = document.querySelectorAll('.modal-overlay');
    overlays.forEach((overlay) => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay && overlay.id !== 'modal-onboarding') {
          UI.hideModal();
        }
      });
    });
  }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
