/**
 * QUARANTIN — Quarterly Deadline Tracker
 * Countdown logic and installment calculation.
 * IRS Form 1040-ES quarterly estimated tax deadlines.
 */

const Quarterly = {
  /**
   * Gets the next upcoming IRS quarterly deadline.
   * Compares today's date against QUARTERLY_DEADLINES array.
   * @returns {Object|null} Next deadline object { period, due, year } or null
   * @example
   * Quarterly.getNextDeadline() → { period: 'Q3', due: '2026-09-15', year: 2026 }
   */
  getNextDeadline() {
    const today = getToday();
    const deadlines = TAX_DATA.QUARTERLY_DEADLINES;

    for (let i = 0; i < deadlines.length; i++) {
      const dueDate = new Date(deadlines[i].due + 'T23:59:59');
      if (dueDate >= today) {
        return deadlines[i];
      }
    }

    // If no future deadline found (shouldn't happen with our data range)
    return null;
  },

  /**
   * Calculates the number of days until a given deadline.
   * @param {string} deadlineDateStr - ISO date string of the deadline
   * @returns {number} Integer days remaining (0 if past)
   * @example
   * Quarterly.getDaysUntilDeadline('2026-09-15') → 43
   */
  getDaysUntilDeadline(deadlineDateStr) {
    const today = getToday();
    const deadline = new Date(deadlineDateStr + 'T23:59:59');
    const days = daysBetween(today, deadline);

    // If deadline is today, return 0
    if (deadline < today) return 0;
    return days;
  },

  /**
   * Determines the urgency level based on days remaining.
   * Green (>60 days), Yellow (30-60), Orange (15-29), Red (<15)
   * @param {number} days - Days until deadline
   * @returns {string} 'safe' | 'warning' | 'alert' | 'critical'
   * @example
   * Quarterly.getUrgencyLevel(45) → 'warning'
   * Quarterly.getUrgencyLevel(10) → 'critical'
   */
  getUrgencyLevel(days) {
    if (days > 60) return 'safe';
    if (days >= 30) return 'warning';
    if (days >= 15) return 'alert';
    return 'critical';
  },

  /**
   * Calculates the estimated quarterly installment due.
   * Formula: YTD total tax owed ÷ quarters elapsed.
   * @param {number} ytdTaxOwed - Total tax owed year-to-date
   * @param {number} quartersElapsed - Number of quarters elapsed this year (1-4)
   * @returns {number} Estimated installment amount
   * @example
   * Quarterly.calculateInstallmentDue(12000, 3) → 4000
   */
  calculateInstallmentDue(ytdTaxOwed, quartersElapsed) {
    if (typeof ytdTaxOwed !== 'number' || isNaN(ytdTaxOwed) || ytdTaxOwed <= 0) {
      return 0;
    }
    if (typeof quartersElapsed !== 'number' || quartersElapsed <= 0) {
      return ytdTaxOwed;
    }
    return Math.round((ytdTaxOwed / quartersElapsed) * 100) / 100;
  },

  /**
   * Determines how many quarters have elapsed based on current date.
   * Q1 ends March 31, Q2 ends May 31, Q3 ends Aug 31, Q4 ends Dec 31.
   * @returns {number} Quarters elapsed (1-4)
   * @example
   * Quarterly.getQuartersElapsed() → 3 (if in September)
   */
  getQuartersElapsed() {
    const now = new Date();
    const month = now.getMonth(); // 0-11

    if (month <= 2) return 1;   // Jan-Mar
    if (month <= 4) return 2;   // Apr-May
    if (month <= 7) return 3;   // Jun-Aug
    return 4;                    // Sep-Dec
  },

  /**
   * Renders the quarterly tracker section.
   * Orchestrates all sub-functions and updates DOM.
   * @returns {void}
   * @example
   * Quarterly.renderQuarterlyTracker()
   */
  renderQuarterlyTracker() {
    const tracker = document.getElementById('quarterly-tracker');
    if (!tracker) return;

    const nextDeadline = this.getNextDeadline();
    if (!nextDeadline) return;

    const days = this.getDaysUntilDeadline(nextDeadline.due);
    const urgency = this.getUrgencyLevel(days);

    // Update deadline date
    const dateEl = tracker.querySelector('.quarterly-date');
    if (dateEl) {
      dateEl.textContent = formatDate(nextDeadline.due) + ' (' + nextDeadline.period + ')';
    }

    // Update countdown number
    const countdownEl = tracker.querySelector('.countdown-number');
    if (countdownEl) {
      countdownEl.textContent = String(days);
    }

    // Apply urgency class
    tracker.classList.remove('urgency-safe', 'urgency-warning', 'urgency-alert', 'urgency-critical');
    tracker.classList.add('urgency-' + urgency);

    // Add pulse animation for critical state
    if (urgency === 'critical' && countdownEl) {
      countdownEl.classList.add('animate-countdown-pulse');
    } else if (countdownEl) {
      countdownEl.classList.remove('animate-countdown-pulse');
    }

    // Calculate and display installment
    Storage.getYTDTotals().then((totals) => {
      const quartersElapsed = this.getQuartersElapsed();
      const installment = this.calculateInstallmentDue(totals.totalTax, quartersElapsed);

      const installmentEl = tracker.querySelector('.installment-amount');
      if (installmentEl) {
        installmentEl.textContent = formatCurrency(installment);
      }
    });
  }
};
