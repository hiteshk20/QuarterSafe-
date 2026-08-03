/**
 * QUARANTIN — Settings Module
 * Profile settings panel logic, data export, reset.
 */

const Settings = {
  /**
   * Populates the settings form from the saved profile.
   * @returns {void}
   * @example
   * Settings.loadSettingsForm()
   */
  loadSettingsForm() {
    const profile = Storage.loadProfile();
    if (!profile) return;

    // Filing status
    const filingSelect = document.getElementById('setting-filing-status');
    if (filingSelect && profile.filingStatus) {
      filingSelect.value = profile.filingStatus;
    }

    // State
    const stateSelect = document.getElementById('setting-state');
    if (stateSelect) {
      // Populate state dropdown if not already done
      if (stateSelect.options.length === 0) {
        App.populateStateDropdown('setting-state');
      }
      if (profile.stateCode) {
        stateSelect.value = profile.stateCode;
      }
    }

    // W-2 Income
    const w2Input = document.getElementById('setting-w2-income');
    if (w2Input && typeof profile.w2Income === 'number') {
      w2Input.value = profile.w2Income > 0 ? formatInputNumber(profile.w2Income) : '';
    }

    // Business Deductions
    const dedInput = document.getElementById('setting-deductions');
    if (dedInput && typeof profile.businessDeductions === 'number') {
      dedInput.value = profile.businessDeductions > 0 ? formatInputNumber(profile.businessDeductions) : '';
    }

    // Tax Year
    const yearInput = document.getElementById('setting-tax-year');
    if (yearInput && profile.taxYear) {
      yearInput.value = String(profile.taxYear);
    }

    // Theme toggle
    const themeToggle = document.getElementById('setting-theme');
    if (themeToggle) {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      themeToggle.setAttribute('aria-checked', currentTheme === 'dark' ? 'true' : 'false');
    }

    // Bind settings events
    this.bindSettingsEvents();
  },

  /**
   * Binds all settings form event listeners.
   * @returns {void}
   */
  bindSettingsEvents() {
    // Save settings button
    const saveBtn = document.getElementById('btn-save-settings');
    if (saveBtn) {
      // Remove old listener by cloning
      const newBtn = saveBtn.cloneNode(true);
      saveBtn.parentNode.replaceChild(newBtn, saveBtn);
      newBtn.addEventListener('click', () => {
        this.saveSettingsForm();
      });
    }

    // Theme toggle in settings
    const themeToggle = document.getElementById('setting-theme');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => {
        UI.toggleTheme();
        const newTheme = document.documentElement.getAttribute('data-theme');
        themeToggle.setAttribute('aria-checked', newTheme === 'dark' ? 'true' : 'false');
      });
    }

    // Export JSON button
    const exportBtn = document.getElementById('btn-export-json');
    if (exportBtn) {
      const newExportBtn = exportBtn.cloneNode(true);
      exportBtn.parentNode.replaceChild(newExportBtn, exportBtn);
      newExportBtn.addEventListener('click', () => {
        this.exportAllData();
      });
    }

    // Reset button
    const resetBtn = document.getElementById('btn-reset-data');
    if (resetBtn) {
      const newResetBtn = resetBtn.cloneNode(true);
      resetBtn.parentNode.replaceChild(newResetBtn, resetBtn);
      newResetBtn.addEventListener('click', () => {
        UI.showModal('modal-reset');
        this.bindResetModal();
      });
    }
  },

  /**
   * Binds the reset confirmation modal events.
   * @returns {void}
   */
  bindResetModal() {
    const confirmInput = document.getElementById('reset-confirm-input');
    const confirmBtn = document.getElementById('btn-confirm-reset');

    if (confirmInput && confirmBtn) {
      confirmInput.value = '';
      confirmBtn.disabled = true;

      confirmInput.addEventListener('input', () => {
        confirmBtn.disabled = confirmInput.value.trim() !== 'DELETE';
      });

      confirmBtn.addEventListener('click', () => {
        this.resetAllData();
      });
    }
  },

  /**
   * Validates and saves the settings form.
   * @returns {void}
   * @example
   * Settings.saveSettingsForm()
   */
  saveSettingsForm() {
    const filingSelect = document.getElementById('setting-filing-status');
    const stateSelect = document.getElementById('setting-state');
    const w2Input = document.getElementById('setting-w2-income');
    const dedInput = document.getElementById('setting-deductions');
    const yearInput = document.getElementById('setting-tax-year');

    const filingStatus = filingSelect ? filingSelect.value : 'single';
    const stateCode = stateSelect ? stateSelect.value : 'CA';
    const w2Income = w2Input ? sanitizeNumber(w2Input.value) : 0;
    const businessDeductions = dedInput ? sanitizeNumber(dedInput.value) : 0;
    const taxYear = yearInput ? parseInt(yearInput.value, 10) || getCurrentYear() : getCurrentYear();

    // Validate
    if (taxYear < 2024 || taxYear > 2030) {
      UI.showToast('Tax year must be between 2024 and 2030', 'error');
      return;
    }

    const profile = {
      filingStatus,
      stateCode,
      w2Income,
      businessDeductions,
      taxYear
    };

    Storage.saveProfile(profile);
    App.profile = profile;

    UI.showToast('Settings saved ✅', 'success');

    // Re-run calculator with new values
    App.runCalculation();
  },

  /**
   * Exports all app data (profile + payments) as JSON.
   * @returns {void}
   * @example
   * Settings.exportAllData()
   */
  exportAllData() {
    const profile = Storage.loadProfile();

    Storage.getAllPayments().then((payments) => {
      const exportData = {
        appName: 'QUARANTIN',
        version: '1.0.0',
        exportDate: nowISO(),
        profile: profile,
        unlocked: Storage.isUnlocked(),
        payments: payments
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];

      link.setAttribute('href', url);
      link.setAttribute('download', 'quarantin-backup-' + dateStr + '.json');
      link.style.display = 'none';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => URL.revokeObjectURL(url), 100);

      UI.showToast('Data exported successfully', 'success');
    });
  },

  /**
   * Resets all app data after confirmation.
   * Clears localStorage and IndexedDB, reloads page.
   * @returns {void}
   * @example
   * Settings.resetAllData()
   */
  resetAllData() {
    UI.hideModal('modal-reset');

    Storage.resetAllData().then(() => {
      UI.showToast('All data deleted. Reloading...', 'info');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    });
  }
};
