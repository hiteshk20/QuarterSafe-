/**
 * QUARANTIN — Export Module
 * PDF export (window.print() + print CSS) and CSV export (Blob).
 * No external libraries.
 */

const Export = {
  /**
   * Exports payment history as a CSV file.
   * Uses Blob + URL.createObjectURL for download.
   * @returns {void}
   * @example
   * Export.exportCSV()
   */
  exportCSV() {
    Storage.getAllPayments().then((payments) => {
      if (payments.length === 0) {
        UI.showToast('No payments to export', 'error');
        return;
      }

      // Build CSV string
      const headers = ['Date', 'Gross', 'SE Tax', 'Federal Tax', 'State Tax', 'Total Tax', 'Net Take-Home', 'Quarantine Amount', 'Effective Rate'];
      const rows = payments.map((p) => {
        return [
          p.date,
          p.gross.toFixed(2),
          p.seTax.toFixed(2),
          p.federalTax.toFixed(2),
          p.stateTax.toFixed(2),
          p.totalTax.toFixed(2),
          p.netTakeHome.toFixed(2),
          p.quarantineAmount.toFixed(2),
          (p.effectiveRate * 100).toFixed(1) + '%'
        ].map((field) => '"' + String(field).replace(/"/g, '""') + '"').join(',');
      });

      const csvContent = [headers.join(','), ...rows].join('\n');

      // Create Blob and trigger download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const year = getCurrentYear();

      link.setAttribute('href', url);
      link.setAttribute('download', 'quarantin-export-' + year + '.csv');
      link.style.display = 'none';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Cleanup
      setTimeout(() => URL.revokeObjectURL(url), 100);

      UI.showToast('CSV exported successfully', 'success');
    });
  },

  /**
   * Exports payment history as PDF using window.print().
   * Adds 'printing' class to body to activate print CSS.
   * @returns {void}
   * @example
   * Export.exportPDF()
   */
  exportPDF() {
    Storage.getAllPayments().then((payments) => {
      if (payments.length === 0) {
        UI.showToast('No payments to export', 'error');
        return;
      }

      // Ensure we're on history screen for print
      UI.showScreen('screen-history');

      // Add print header
      this.addPrintHeader();

      // Add printing class to activate print CSS
      document.body.classList.add('printing');

      // Trigger print dialog
      window.print();

      // Remove printing class after print dialog closes
      const afterPrint = () => {
        document.body.classList.remove('printing');
        this.removePrintHeader();
        window.removeEventListener('afterprint', afterPrint);
      };

      window.addEventListener('afterprint', afterPrint);

      // Fallback: remove class after 2 seconds if afterprint doesn't fire
      setTimeout(() => {
        document.body.classList.remove('printing');
        this.removePrintHeader();
      }, 2000);
    });
  },

  /**
   * Adds a print-specific header to the history screen.
   * @returns {void}
   */
  addPrintHeader() {
    // Remove existing print header if any
    this.removePrintHeader();

    const historyScreen = document.getElementById('screen-history');
    if (!historyScreen) return;

    const header = document.createElement('div');
    header.className = 'print-header';
    header.id = 'print-header';

    const title = document.createElement('div');
    title.className = 'print-header-title';
    title.textContent = 'QUARANTIN — Tax Report ' + getCurrentYear();

    const dateLine = document.createElement('div');
    dateLine.className = 'print-header-date';
    dateLine.textContent = 'Generated: ' + formatDateTime(new Date());

    header.appendChild(title);
    header.appendChild(dateLine);

    // Insert at the beginning of the locked-content
    const lockedContent = historyScreen.querySelector('.locked-content');
    if (lockedContent) {
      lockedContent.insertBefore(header, lockedContent.firstChild);
    }
  },

  /**
   * Removes the print-specific header.
   * @returns {void}
   */
  removePrintHeader() {
    const header = document.getElementById('print-header');
    if (header && header.parentNode) {
      header.parentNode.removeChild(header);
    }
  }
};
