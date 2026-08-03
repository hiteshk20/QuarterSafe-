/**
 * QUARANTIN — Storage Layer
 * All localStorage and IndexedDB read/write/delete operations.
 * RULE 3: No other file may call localStorage or IndexedDB directly.
 * All functions wrapped in try/catch.
 * All IndexedDB operations use Promises.
 */

const Storage = {
  DB_NAME: 'quarantin_db',
  DB_VERSION: 1,
  STORE_NAME: 'payments',
  db: null,

  // ============================================
  // PROFILE FUNCTIONS
  // ============================================

  /**
   * Saves user profile to localStorage.
   * @param {Object} profileObject - Profile data
   * @param {string} profileObject.filingStatus - Filing status key
   * @param {string} profileObject.stateCode - Two-letter state code
   * @param {number} profileObject.w2Income - W-2 income this year
   * @param {number} profileObject.businessDeductions - Annual deductions
   * @param {number} profileObject.taxYear - Tax year
   * @returns {boolean} True if saved successfully
   * @example
   * Storage.saveProfile({ filingStatus: 'single', stateCode: 'CA', w2Income: 0, businessDeductions: 0, taxYear: 2024 })
   */
  saveProfile(profileObject) {
    try {
      localStorage.setItem('quarantin_profile', JSON.stringify(profileObject));
      return true;
    } catch (e) {
      console.error('Failed to save profile:', e);
      UI.showToast('Storage unavailable. Data may not be saved on this device.', 'error');
      return false;
    }
  },

  /**
   * Loads user profile from localStorage.
   * @returns {Object|null} Profile object or null if not found
   * @example
   * Storage.loadProfile() → { filingStatus: 'single', stateCode: 'CA', ... }
   */
  loadProfile() {
    try {
      const raw = localStorage.getItem('quarantin_profile');
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (typeof parsed !== 'object' || parsed === null) return null;
      return parsed;
    } catch (e) {
      console.error('Failed to load profile:', e);
      return null;
    }
  },

  /**
   * Clears user profile from localStorage.
   * @returns {void}
   */
  clearProfile() {
    try {
      localStorage.removeItem('quarantin_profile');
    } catch (e) {
      console.error('Failed to clear profile:', e);
    }
  },

  // ============================================
  // UNLOCK FUNCTIONS
  // ============================================

  /**
   * Sets the unlocked flag in localStorage.
   * @returns {void}
   */
  setUnlocked() {
    try {
      localStorage.setItem('q_unlocked', 'true');
    } catch (e) {
      console.error('Failed to set unlock:', e);
    }
  },

  /**
   * Checks if the app is unlocked.
   * @returns {boolean} True if unlocked
   * @example
   * Storage.isUnlocked() → true
   */
  isUnlocked() {
    try {
      return localStorage.getItem('q_unlocked') === 'true';
    } catch (e) {
      return false;
    }
  },

  /**
   * Clears the unlock flag.
   * @returns {void}
   */
  clearUnlock() {
    try {
      localStorage.removeItem('q_unlocked');
    } catch (e) {
      console.error('Failed to clear unlock:', e);
    }
  },

  // ============================================
  // PAYMENT LOG FUNCTIONS (IndexedDB primary)
  // ============================================

  /**
   * Initializes IndexedDB database.
   * Creates 'quarantin_db' v1 with 'payments' object store.
   * @returns {Promise<IDBDatabase>} Resolves with database instance
   * @example
   * await Storage.initDB()
   */
  initDB() {
    return new Promise((resolve, reject) => {
      if (this.db) {
        resolve(this.db);
        return;
      }

      try {
        const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          if (!db.objectStoreNames.contains(this.STORE_NAME)) {
            const store = db.createObjectStore(this.STORE_NAME, { keyPath: 'id' });
            store.createIndex('date', 'date', { unique: false });
            store.createIndex('gross', 'gross', { unique: false });
          }
        };

        request.onsuccess = (event) => {
          this.db = event.target.result;
          resolve(this.db);
        };

        request.onerror = (event) => {
          console.error('IndexedDB open error:', event.target.error);
          reject(event.target.error);
        };
      } catch (e) {
        console.error('IndexedDB not available:', e);
        reject(e);
      }
    });
  },

  /**
   * Saves a payment entry to IndexedDB.
   * @param {Object} entryObject - Payment entry
   * @param {string} entryObject.id - Unique ID
   * @param {string} entryObject.date - ISO date string
   * @param {number} entryObject.gross - Gross payment amount
   * @param {number} entryObject.seTax - SE tax amount
   * @param {number} entryObject.federalTax - Federal tax amount
   * @param {number} entryObject.stateTax - State tax amount
   * @param {number} entryObject.totalTax - Total tax amount
   * @param {number} entryObject.netTakeHome - Net take-home amount
   * @param {number} entryObject.quarantineAmount - Quarantine amount
   * @returns {Promise<void>} Resolves when saved
   * @example
   * await Storage.savePayment({ id: 'abc', date: '2024-01-15', gross: 3400, ... })
   */
  savePayment(entryObject) {
    return this.initDB().then((db) => {
      return new Promise((resolve, reject) => {
        try {
          const transaction = db.transaction([this.STORE_NAME], 'readwrite');
          const store = transaction.objectStore(this.STORE_NAME);
          const request = store.put(entryObject);

          request.onsuccess = () => resolve();
          request.onerror = (event) => {
            console.error('Failed to save payment:', event.target.error);
            reject(event.target.error);
          };
        } catch (e) {
          console.error('savePayment error:', e);
          reject(e);
        }
      });
    });
  },

  /**
   * Gets all payment entries sorted by date descending.
   * @returns {Promise<Array>} Array of payment objects
   * @example
   * const payments = await Storage.getAllPayments()
   */
  getAllPayments() {
    return this.initDB().then((db) => {
      return new Promise((resolve, reject) => {
        try {
          const transaction = db.transaction([this.STORE_NAME], 'readonly');
          const store = transaction.objectStore(this.STORE_NAME);
          const request = store.getAll();

          request.onsuccess = () => {
            const payments = request.result || [];
            // Sort by date descending
            payments.sort((a, b) => new Date(b.date) - new Date(a.date));
            resolve(payments);
          };

          request.onerror = (event) => {
            console.error('Failed to get payments:', event.target.error);
            resolve([]);
          };
        } catch (e) {
          console.error('getAllPayments error:', e);
          resolve([]);
        }
      });
    });
  },

  /**
   * Deletes a payment entry by ID.
   * @param {string} id - The payment entry ID to delete
   * @returns {Promise<void>} Resolves when deleted
   * @example
   * await Storage.deletePayment('abc-123')
   */
  deletePayment(id) {
    return this.initDB().then((db) => {
      return new Promise((resolve, reject) => {
        try {
          const transaction = db.transaction([this.STORE_NAME], 'readwrite');
          const store = transaction.objectStore(this.STORE_NAME);
          const request = store.delete(id);

          request.onsuccess = () => resolve();
          request.onerror = (event) => {
            console.error('Failed to delete payment:', event.target.error);
            reject(event.target.error);
          };
        } catch (e) {
          console.error('deletePayment error:', e);
          reject(e);
        }
      });
    });
  },

  /**
   * Clears all payment entries from IndexedDB.
   * @returns {Promise<void>} Resolves when cleared
   * @example
   * await Storage.clearAllPayments()
   */
  clearAllPayments() {
    return this.initDB().then((db) => {
      return new Promise((resolve, reject) => {
        try {
          const transaction = db.transaction([this.STORE_NAME], 'readwrite');
          const store = transaction.objectStore(this.STORE_NAME);
          const request = store.clear();

          request.onsuccess = () => resolve();
          request.onerror = (event) => {
            console.error('Failed to clear payments:', event.target.error);
            reject(event.target.error);
          };
        } catch (e) {
          console.error('clearAllPayments error:', e);
          reject(e);
        }
      });
    });
  },

  // ============================================
  // YTD SUMMARY FUNCTIONS
  // ============================================

  /**
   * Calculates year-to-date totals from all payments.
   * @returns {Promise<Object>} YTD totals object
   * @example
   * const totals = await Storage.getYTDTotals()
   * → { totalGross: 34000, totalSETax: 4800, totalFedTax: 4080,
   *     totalStateTax: 2370, totalTax: 11250, totalNet: 22750, paymentCount: 10 }
   */
  getYTDTotals() {
    return this.getAllPayments().then((payments) => {
      const totals = {
        totalGross: 0,
        totalSETax: 0,
        totalFedTax: 0,
        totalStateTax: 0,
        totalTax: 0,
        totalNet: 0,
        totalQuarantine: 0,
        paymentCount: payments.length
      };

      payments.forEach((p) => {
        totals.totalGross += p.gross || 0;
        totals.totalSETax += p.seTax || 0;
        totals.totalFedTax += p.federalTax || 0;
        totals.totalStateTax += p.stateTax || 0;
        totals.totalTax += p.totalTax || 0;
        totals.totalNet += p.netTakeHome || 0;
        totals.totalQuarantine += p.quarantineAmount || 0;
      });

      return totals;
    });
  },

  // ============================================
  // SETTINGS FUNCTIONS
  // ============================================

  /**
   * Saves a single setting to localStorage.
   * @param {string} key - Setting key
   * @param {*} value - Setting value (will be JSON stringified)
   * @returns {boolean} True if saved
   * @example
   * Storage.saveSetting('taxYear', 2024)
   */
  saveSetting(key, value) {
    try {
      localStorage.setItem('quarantin_setting_' + key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('Failed to save setting:', e);
      return false;
    }
  },

  /**
   * Gets a single setting from localStorage.
   * @param {string} key - Setting key
   * @returns {*} Setting value or null
   * @example
   * Storage.getSetting('taxYear') → 2024
   */
  getSetting(key) {
    try {
      const raw = localStorage.getItem('quarantin_setting_' + key);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  },

  /**
   * Saves theme preference to localStorage.
   * @param {string} mode - 'dark' or 'light'
   * @returns {void}
   */
  saveTheme(mode) {
    try {
      localStorage.setItem('quarantin_theme', mode);
    } catch (e) {
      console.error('Failed to save theme:', e);
    }
  },

  /**
   * Gets theme preference from localStorage.
   * Defaults to system preference if not saved.
   * @returns {string} 'dark' or 'light'
   * @example
   * Storage.getTheme() → 'dark'
   */
  getTheme() {
    try {
      const saved = localStorage.getItem('quarantin_theme');
      if (saved === 'dark' || saved === 'light') {
        return saved;
      }
    } catch (e) {
      // Fall through to system preference
    }
    // Default to system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
    return 'dark';
  },

  // ============================================
  // RESET ALL DATA
  // ============================================

  /**
   * Clears ALL app data: localStorage and IndexedDB.
   * @returns {Promise<void>} Resolves when all data is cleared
   * @example
   * await Storage.resetAllData()
   */
  resetAllData() {
    return new Promise((resolve) => {
      // Clear all quarantin localStorage keys
      try {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.startsWith('quarantin_') || key === 'q_unlocked')) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach((key) => localStorage.removeItem(key));
      } catch (e) {
        console.error('Failed to clear localStorage:', e);
      }

      // Clear IndexedDB
      this.clearAllPayments()
        .then(() => {
          // Close DB connection
          if (this.db) {
            this.db.close();
            this.db = null;
          }
          resolve();
        })
        .catch(() => {
          resolve();
        });
    });
  }
};
