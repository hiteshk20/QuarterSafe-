/**
 * QUARANTIN — Yearly Dashboard Module
 * Summary stats and Canvas bar chart rendering.
 * Chart uses pure Canvas 2D API — no external libraries.
 */

const Dashboard = {
  chartCanvas: null,
  resizeHandler: null,

  /**
   * Main render function. Fetches all payments, computes stats, renders everything.
   * @returns {void}
   * @example
   * Dashboard.renderDashboard()
   */
  renderDashboard() {
    Storage.getAllPayments().then((payments) => {
      if (payments.length === 0) {
        this.renderEmptyState();
        return;
      }

      Storage.getYTDTotals().then((totals) => {
        this.renderKPICards(totals);
        this.renderStats(payments);

        const monthlyData = this.groupPaymentsByMonth(payments);
        this.renderBarChart(monthlyData);
      });
    });
  },

  /**
   * Renders empty state when no payments exist.
   * @returns {void}
   */
  renderEmptyState() {
    const kpiGross = document.getElementById('kpi-gross');
    const kpiTax = document.getElementById('kpi-tax');
    const kpiNet = document.getElementById('kpi-net');
    const kpiRate = document.getElementById('kpi-rate');

    if (kpiGross) kpiGross.textContent = '$0.00';
    if (kpiTax) kpiTax.textContent = '$0.00';
    if (kpiNet) kpiNet.textContent = '$0.00';
    if (kpiRate) kpiRate.textContent = '0.0%';
  },

  /**
   * Renders the 4 KPI summary cards.
   * @param {Object} totals - YTD totals from Storage.getYTDTotals()
   * @returns {void}
   * @example
   * Dashboard.renderKPICards({ totalGross: 50000, totalTax: 15000, ... })
   */
  renderKPICards(totals) {
    const setVal = (id, value, isPercent = false) => {
      const el = document.getElementById(id);
      if (el) {
        el.textContent = isPercent ? formatPercentage(value) : formatCurrency(value);
      }
    };

    setVal('kpi-gross', totals.totalGross);
    setVal('kpi-tax', totals.totalTax);
    setVal('kpi-net', totals.totalNet);

    // Average effective rate
    const avgRate = totals.totalGross > 0 ? totals.totalTax / totals.totalGross : 0;
    setVal('kpi-rate', avgRate, true);
  },

  /**
   * Renders highest/lowest tax payment stats.
   * @param {Array} payments - Array of payment objects
   * @returns {void}
   */
  renderStats(payments) {
    if (payments.length === 0) return;

    // Highest tax payment
    const highest = payments.reduce((max, p) =>
      p.totalTax > max.totalTax ? p : max, payments[0]);

    // Lowest tax payment
    const lowest = payments.reduce((min, p) =>
      p.totalTax < min.totalTax ? p : min, payments[0]);

    const highestEl = document.getElementById('stat-highest');
    const lowestEl = document.getElementById('stat-lowest');

    if (highestEl) {
      highestEl.textContent = formatCurrency(highest.totalTax) + ' (' + formatDate(highest.date) + ')';
    }
    if (lowestEl) {
      lowestEl.textContent = formatCurrency(lowest.totalTax) + ' (' + formatDate(lowest.date) + ')';
    }
  },

  /**
   * Groups payments by month for the bar chart.
   * Returns a 12-item array with monthly aggregates.
   * @param {Array} payments - Array of payment objects
   * @returns {Array<Object>} 12 items: { month, gross, tax, net }
   * @example
   * Dashboard.groupPaymentsByMonth(payments) →
   * [{ month: 'Jan', gross: 5000, tax: 1500, net: 3500 }, ...]
   */
  groupPaymentsByMonth(payments) {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const monthlyData = monthNames.map((name, index) => ({
      month: name,
      monthIndex: index,
      gross: 0,
      tax: 0,
      net: 0
    }));

    const currentYear = getCurrentYear();

    payments.forEach((payment) => {
      const paymentDate = new Date(payment.date);
      if (paymentDate.getFullYear() !== currentYear) return;

      const monthIndex = paymentDate.getMonth();
      if (monthIndex >= 0 && monthIndex < 12) {
        monthlyData[monthIndex].gross += payment.gross || 0;
        monthlyData[monthIndex].tax += payment.totalTax || 0;
        monthlyData[monthIndex].net += payment.netTakeHome || 0;
      }
    });

    return monthlyData;
  },

  /**
   * Renders the grouped bar chart using Canvas 2D API.
   * Draws 12 months × 3 bars (gross/tax/net) with axes, labels, legend, grid.
   * Responsive: redraws on window resize.
   * @param {Array<Object>} monthlyData - 12-item array of monthly aggregates
   * @returns {void}
   * @example
   * Dashboard.renderBarChart(monthlyData)
   */
  renderBarChart(monthlyData) {
    const canvas = document.getElementById('ytd-chart');
    if (!canvas) return;

    this.chartCanvas = canvas;

    // Remove old resize handler
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
    }

    const draw = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Get container width for responsive canvas
      const container = canvas.parentElement;
      const containerWidth = container ? container.clientWidth - 32 : 800;
      const dpr = window.devicePixelRatio || 1;

      canvas.width = containerWidth * dpr;
      canvas.height = 300 * dpr;
      canvas.style.width = containerWidth + 'px';
      canvas.style.height = '300px';
      ctx.scale(dpr, dpr);

      const width = containerWidth;
      const height = 300;
      const padding = { top: 40, right: 20, bottom: 50, left: 60 };
      const chartWidth = width - padding.left - padding.right;
      const chartHeight = height - padding.top - padding.bottom;

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Get theme colors
      const styles = getComputedStyle(document.documentElement);
      const textColor = styles.getPropertyValue('--color-text-secondary').trim() || '#94A3B8';
      const gridColor = styles.getPropertyValue('--color-border-primary').trim() || '#1E3A5F';
      const grossColor = styles.getPropertyValue('--color-accent-secondary').trim() || '#0EA5E9';
      const taxColor = styles.getPropertyValue('--color-accent-danger').trim() || '#FF4D6D';
      const netColor = styles.getPropertyValue('--color-accent-success').trim() || '#10B981';

      // Find max value for scaling
      const maxVal = Math.max(
        ...monthlyData.map((d) => Math.max(d.gross, d.tax, d.net)),
        1
      );

      // Draw grid lines
      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 0.5;
      const gridLines = 5;
      for (let i = 0; i <= gridLines; i++) {
        const y = padding.top + (chartHeight / gridLines) * i;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(width - padding.right, y);
        ctx.stroke();

        // Y-axis labels
        const value = maxVal - (maxVal / gridLines) * i;
        ctx.fillStyle = textColor;
        ctx.font = '10px ' + styles.getPropertyValue('--font-mono').trim();
        ctx.textAlign = 'right';
        ctx.fillText(this.formatShortCurrency(value), padding.left - 8, y + 3);
      }

      // Draw bars
      const groupWidth = chartWidth / 12;
      const barWidth = Math.min(groupWidth * 0.22, 20);
      const barGap = 3;

      monthlyData.forEach((data, i) => {
        const groupX = padding.left + groupWidth * i + groupWidth * 0.15;

        // Gross bar
        const grossHeight = (data.gross / maxVal) * chartHeight;
        ctx.fillStyle = grossColor;
        ctx.fillRect(
          groupX,
          padding.top + chartHeight - grossHeight,
          barWidth,
          grossHeight
        );

        // Tax bar
        const taxHeight = (data.tax / maxVal) * chartHeight;
        ctx.fillStyle = taxColor;
        ctx.fillRect(
          groupX + barWidth + barGap,
          padding.top + chartHeight - taxHeight,
          barWidth,
          taxHeight
        );

        // Net bar
        const netHeight = (data.net / maxVal) * chartHeight;
        ctx.fillStyle = netColor;
        ctx.fillRect(
          groupX + (barWidth + barGap) * 2,
          padding.top + chartHeight - netHeight,
          barWidth,
          netHeight
        );

        // X-axis labels
        ctx.fillStyle = textColor;
        ctx.font = '10px ' + styles.getPropertyValue('--font-primary').trim();
        ctx.textAlign = 'center';
        ctx.fillText(
          data.month,
          padding.left + groupWidth * i + groupWidth / 2,
          height - padding.bottom + 16
        );
      });

      // Draw legend
      const legendY = 16;
      const legendItems = [
        { label: 'Gross', color: grossColor },
        { label: 'Tax', color: taxColor },
        { label: 'Net', color: netColor }
      ];

      let legendX = padding.left;
      ctx.font = '11px ' + styles.getPropertyValue('--font-primary').trim();

      legendItems.forEach((item) => {
        // Color swatch
        ctx.fillStyle = item.color;
        ctx.fillRect(legendX, legendY - 8, 12, 12);

        // Label
        ctx.fillStyle = textColor;
        ctx.textAlign = 'left';
        ctx.fillText(item.label, legendX + 16, legendY + 2);

        legendX += ctx.measureText(item.label).width + 36;
      });
    };

    // Initial draw
    draw();

    // Redraw on resize (debounced)
    this.resizeHandler = debounce(draw, 200);
    window.addEventListener('resize', this.resizeHandler);
  },

  /**
   * Formats a currency value in short form for chart axis labels.
   * @param {number} value - The value to format
   * @returns {string} Short formatted string (e.g., "$5K", "$1.2M")
   * @example
   * Dashboard.formatShortCurrency(5000) → "$5K"
   * Dashboard.formatShortCurrency(1200000) → "$1.2M"
   */
  formatShortCurrency(value) {
    if (value >= 1000000) {
      return '$' + (value / 1000000).toFixed(1) + 'M';
    }
    if (value >= 1000) {
      return '$' + (value / 1000).toFixed(0) + 'K';
    }
    return '$' + value.toFixed(0);
  }
};
