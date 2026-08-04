/** QUARANTIN — Entry point & router. */
const App = {
  profile: null,
  currentResults: null,
  onboardingStep: 1,

  /**
   * Initialize the app.
   * @returns {void}
   */
  init() {
    PWA.init();
    UI.setTheme(Storage.getTheme());
    this.profile = Storage.loadProfile();
    this.showCaution();

    if (!this.profile) {
      this.populateStateDropdown('onboarding-state');
      UI.showModal('modal-onboarding');
    } else {
      UI.showScreen('screen-calculator');
    }

    this.bindNav();
    this.bindInput();
    this.bindTheme();
    this.bindSave();
    this.bindExports();
    this.bindOnboarding();
    this.bindStateSearch();
    this.bindModals();
    Quarterly.renderQuarterlyTracker();
  },

  /**
   * Show the data-loss caution banner once.
   * @returns {void}
   */
  showCaution() {
    if (Storage.getCautionDismissed()) return;
    const b = document.getElementById('caution-banner');
    if (b) b.classList.remove('hidden');
    const d = document.getElementById('caution-dismiss');
    if (d) d.onclick = () => { b.classList.add('hidden'); Storage.setCautionDismissed(); };
  },

  /**
   * Fill a state <select> with all 50 states + DC.
   * @param {string} selectId
   * @returns {void}
   * @example App.populateStateDropdown('setting-state')
   */
  populateStateDropdown(selectId) {
    const sel = document.getElementById(selectId);
    if (!sel) return;
    sel.innerHTML = '';
    TAX_DATA.getStatesList().forEach(s => {
      const o = document.createElement('option');
      o.value = s.code;
      o.textContent = s.name;
      sel.appendChild(o);
    });
  },

  /**
   * Bind bottom-nav tab switching.
   * @returns {void}
   */
  bindNav() {
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const id = tab.dataset.screen;
        UI.showScreen(id);
        if (id === 'screen-history') { History.renderHistoryTable(); History.renderYTDCards(); }
        else if (id === 'screen-dashboard') Dashboard.renderDashboard();
        else if (id === 'screen-settings') Settings.loadSettingsForm();
      });
    });
  },

  /**
   * Bind payment input with debounce + typing glow.
   * @returns {void}
   */
  bindInput() {
    const input = document.getElementById('payment-input');
    if (!input) return;
    const debounced = debounce(() => this.runCalculation(), 150);
    input.addEventListener('input', () => {
      input.classList.add('typing');
      clearTimeout(input._t);
      input._t = setTimeout(() => input.classList.remove('typing'), 500);
      debounced();
    });
    input.addEventListener('blur', () => input.classList.remove('typing'));
  },

  /**
   * Bind header theme toggle.
   * @returns {void}
   */
  bindTheme() {
    const t = document.getElementById('theme-toggle');
    if (t) t.addEventListener('click', () => UI.toggleTheme());
  },

  /**
   * Bind Save Payment button.
   * @returns {void}
   */
  bindSave() {
    const b = document.getElementById('btn-save-payment');
    if (b) b.addEventListener('click', () => History.saveCurrentCalculation());
  },

  /**
   * Bind CSV / PDF export buttons.
   * @returns {void}
   */
  bindExports() {
    const csv = document.getElementById('btn-export-csv');
    if (csv) csv.addEventListener('click', () => Export.exportCSV());
    const pdf = document.getElementById('btn-export-pdf');
    if (pdf) pdf.addEventListener('click', () => Export.exportPDF());
  },

  /**
   * Filter onboarding state list as user types.
   * @returns {void}
   */
  bindStateSearch() {
    const search = document.getElementById('state-search');
    const select = document.getElementById('onboarding-state');
    if (!search || !select) return;
    search.addEventListener('input', () => {
      const q = search.value.toLowerCase();
      Array.from(select.options).forEach(o => {
        o.hidden = q !== '' && !o.textContent.toLowerCase().includes(q);
      });
    });
  },

  /**
   * Validate input and run the full calculation.
   * @returns {void}
   */
  runCalculation() {
    const input = document.getElementById('payment-input');
    const raw = input ? input.value : '';
    const gross = sanitizeNumber(raw);

    if (raw.trim() === '') {
      UI.showInputError('payment-input', 'payment-input-error', null);
      UI.renderCalculatorOutput({ seTax: 0, federalTax: 0, stateTax: 0, totalTaxThisPayment: 0, quarantineAmount: 0, netTakeHome: 0, effectiveRate: 0 });
      this.currentResults = null;
      return;
    }
    if (gross <= 0) {
      UI.showInputError('payment-input', 'payment-input-error', 'Please enter a valid positive amount.');
      return;
    }
    if (gross > 99999999) {
      UI.showInputError('payment-input', 'payment-input-error', 'Amount too large. Maximum is $99,999,999.');
      return;
    }
    UI.showInputError('payment-input', 'payment-input-error', null);

    const p = this.profile || {};
    Storage.getAllPayments().then(ps => {
      const ytd = ps.reduce((s, x) => s + (x.gross || 0), 0);
      const results = calculateFullPayment({
        grossPayment: gross,
        filingStatus: p.filingStatus || 'single',
        stateCode: p.stateCode || 'CA',
        businessDeductions: p.businessDeductions || 0,
        w2Income: p.w2Income || 0,
        ytdGross: ytd
      });
      this.currentResults = results;
      UI.renderCalculatorOutput(results);

      const q = document.getElementById('out-quarantine');
      if (q && results.quarantineAmount > 0) {
        q.classList.add('animate-flash-red');
        setTimeout(() => q.classList.remove('animate-flash-red'), 1000);
      }
    });
  },

  /**
   * Bind onboarding step navigation.
   * @returns {void}
   */
  bindOnboarding() {
    this.onboardingStep = 1;
    document.querySelectorAll('[data-onboarding-next]').forEach(b => {
      b.addEventListener('click', () => { if (this.onboardingStep < 3) this.showOnboardingStep(this.onboardingStep + 1); });
    });
    document.querySelectorAll('[data-onboarding-back]').forEach(b => {
      b.addEventListener('click', () => { if (this.onboardingStep > 1) this.showOnboardingStep(this.onboardingStep - 1); });
    });
    const complete = document.querySelector('[data-onboarding-complete]');
    if (complete) complete.addEventListener('click', () => this.completeOnboarding(false));
    const skip = document.querySelector('[data-onboarding-skip]');
    if (skip) skip.addEventListener('click', () => this.completeOnboarding(true));
  },

  /**
   * Show a specific onboarding step + update dots.
   * @param {number} step - 1..3
   * @returns {void}
   */
  showOnboardingStep(step) {
    this.onboardingStep = step;
    document.querySelectorAll('.onboarding-step').forEach(s => {
      const on = parseInt(s.dataset.step, 10) === step;
      s.classList.toggle('hidden', !on);
      s.classList.toggle('active', on);
    });
    document.querySelectorAll('.progress-dot').forEach((d, i) => {
      d.classList.toggle('active', i < step);
    });
  },

  /**
   * Finish onboarding, save profile, show calculator.
   * @param {boolean} skipW2 - true if W-2 step skipped
   * @returns {void}
   */
  completeOnboarding(skipW2) {
    const radio = document.querySelector('input[name="onboarding-filing"]:checked');
    const filingStatus = radio ? radio.value : 'single';
    const stateSelect = document.getElementById('onboarding-state');
    const stateCode = stateSelect ? stateSelect.value : 'CA';
    const w2Input = document.getElementById('onboarding-w2');
    const w2Income = (!skipW2 && w2Input) ? sanitizeNumber(w2Input.value) : 0;

    const profile = { filingStatus, stateCode, w2Income, businessDeductions: 0, taxYear: getCurrentYear() };
    Storage.saveProfile(profile);
    this.profile = profile;

    UI.hideModal('modal-onboarding');
    UI.showScreen('screen-calculator');
    UI.showToast('Profile saved — start calculating!', 'success');
  },

  /**
   * Bind modal close buttons + overlay clicks.
   * @returns {void}
   */
  bindModals() {
    document.querySelectorAll('[data-modal-close]').forEach(b => {
      b.addEventListener('click', () => UI.hideModal());
    });
    document.querySelectorAll('.modal-overlay').forEach(o => {
      o.addEventListener('click', e => {
        if (e.target === o && o.id !== 'modal-onboarding') UI.hideModal();
      });
    });
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());
