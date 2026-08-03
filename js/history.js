/**
 * QUARANTIN — Payment History Module
 * Ledger CRUD operations and table rendering.
 * Calls ui.js render functions, does not touch DOM raw.
 */

const History = {
  /**
   * Renders the payment history table.
   * Fetches all payments from storage and builds table rows.
   * @returns {void}
   * @example
   * History.renderHistoryTable()
   */
  renderHistoryTable() {
    Storage.getAllPayments().then((payments) => {
      const tbody = document.getElementById('history-tbody');
      const emptyState = document.getElementById('history-empty');
      const tableContainer = document.querySelector('.history-table-container');

      if (!tbody) return;

      // Clear existing rows
      tbody.innerHTML = '';

      if (payments.length === 0) {
        if (emptyState) emptyState.classList.remove('hidden');
        if (tableContainer) tableContainer.classList.add('hidden');
        this.renderYTDTotals({ totalGross: 0, totalSETax: 0, totalFedTax: 0, totalStateTax: 0, totalTax: 0, totalNet: 0 });
        return;
      }

      if (emptyState) emptyState.classList.add('hidden');
      if (tableContainer) tableContainer.classList.remove('hidden');

      // Build rows
      payments.forEach((payment) => {
        const row = this.createTableRow(payment);
        tbody.appendChild(row);
      });

      // Update YTD totals in tfoot
      Storage.getYTDTotals().then((totals) => {
        this.renderYTDTotals(totals);
      });
    });
  },

  /**
   * Creates a table row element for a payment entry.
   * @param {Object} payment - Payment entry object
   * @returns {HTMLTableRowElement} The constructed table row
   * @example
   * const row = History.createTableRow({ date: '2024-01-15', gross: 3400, ... })
   */
  createTableRow(payment) {
    const row = document.createElement('tr');

    // Date cell
    const dateCell = document.createElement('td');
    dateCell.textContent = formatDate(payment.date);
    row.appendChild(dateCell);

    // Gross cell
    const grossCell = document.createElement('td');
    grossCell.textContent = formatCurrency(payment.gross);
    row.appendChild(grossCell);

    // SE Tax cell
    const seCell = document.createElement('td');
    seCell.textContent = formatCurrency(payment.seTax);
    row.appendChild(seCell);

    // Fed Tax cell
    const fedCell = document.createElement('td');
    fedCell.textContent = formatCurrency(payment.federalTax);
    row.appendChild(fedCell);

    // State Tax cell
    const stateCell = document.createElement('td');
    stateCell.textContent = formatCurrency(payment.stateTax);
    row.appendChild(stateCell);

    // Total Tax cell
    const totalCell = document.createElement('td');
    totalCell.textContent = formatCurrency(payment.totalTax);
    row.appendChild(totalCell);

    // Net cell
    const netCell = document.createElement('td');
    netCell.textContent = formatCurrency(payment.netTakeHome);
    row.appendChild(netCell);

    // Actions cell (delete button)
    const actionsCell = document.createElement('td');
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn-delete';
    deleteBtn.setAttribute('aria-label', 'Delete payment from ' + formatDate(payment.date));
    deleteBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M5.33 4V2.67a1.33 1.33 0 011.34-1.34h2.66a1.33 1.33 0 011.34 1.34V4m2 0v9.33a1.33 1.33 0 01-1.34 1.34H4.67a1.33 1.33 0 01-1.34-1.34V4h9.34z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

    deleteBtn.addEventListener('click', () => {
      this.deletePaymentEntry(payment.id);
    });

    actionsCell.appendChild(deleteBtn);
    row.appendChild(actionsCell);

    return row;
  },

  /**
   * Updates the YTD totals row in the table footer.
   * @param {Object} totals - YTD totals from Storage.getYTDTotals()
   * @returns {void}
   */
  renderYTDTotals(totals) {
    const setVal = (id, value) => {
      const el = document.getElementById(id);
      if (el) el.textContent = formatCurrency(value);
    };

    setVal('tfoot-gross', totals.totalGross);
    setVal('tfoot-se', totals.totalSETax);
    setVal('tfoot-fed', totals.totalFedTax);
    setVal('tfoot-state', totals.totalStateTax);
    setVal('tfoot-total', totals.totalTax);
    setVal('tfoot-net', totals.totalNet);
  },

  /**
   * Renders the YTD summary cards above the table.
   * @returns {void}
   * @example
   * History.renderYTDCards()
   */
  renderYTDCards() {
    Storage.getYTDTotals().then((totals) => {
      const setVal = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = formatCurrency(value);
      };

      setVal('ytd-gross', totals.totalGross);
      setVal('ytd-tax', totals.totalTax);
      setVal('ytd-net', totals.totalNet);

      const countEl = document.getElementById('ytd-count');
      if (countEl) countEl.textContent = String(totals.paymentCount);
    });
  },

  /**
   * Deletes a payment entry and re-renders the table.
   * @param {string} id - The payment entry ID to delete
   * @returns {void}
   * @example
   * History.deletePaymentEntry('abc-123')
   */
  deletePaymentEntry(id) {
    Storage.deletePayment(id).then(() => {
      this.renderHistoryTable();
      this.renderYTDCards();
      UI.showToast('Payment deleted', 'success');
    }).catch(() => {
      UI.showToast('Failed to delete payment', 'error');
    });
  },

  /**
   * Saves the current calculator output as a payment entry.
   * Creates entry with generateId(), saves to storage, re-renders.
   * @returns {void}
   * @example
   * History.saveCurrentCalculation()
   */
  saveCurrentCalculation() {
    const results = App.currentResults;
    if (!results || results.grossPayment <= 0) {
      UI.showToast('Enter a payment amount first', 'error');
      return;
    }

    const entry = {
      id: generateId(),
      date: nowISO(),
      gross: results.grossPayment,
      seTax: results.seTax,
      federalTax: results.federalTax,
      stateTax: results.stateTax,
      totalTax: results.totalTaxThisPayment,
      netTakeHome: results.netTakeHome,
      quarantineAmount: results.quarantineAmount,
      effectiveRate: results.effectiveRate
    };

    Storage.savePayment(entry).then(() => {
      UI.showToast('✅ Payment saved to ledger', 'success');
      this.renderHistoryTable();
      this.renderYTDCards();
      Quarterly.renderQuarterlyTracker();
    }).catch(() => {
      UI.showToast('Failed to save payment', 'error');
    });
  }
};
