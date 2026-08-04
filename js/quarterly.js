/** QUARANTIN — Quarterly deadline tracker. */
const Quarterly = {
  /**
   * Next upcoming IRS deadline.
   * @returns {Object|null}
   * @example Quarterly.getNextDeadline()
   */
  getNextDeadline(){
    const today=getToday();
    for(const d of TAX_DATA.QUARTERLY_DEADLINES){
      if(new Date(d.due+'T23:59:59')>=today)return d;
    }
    return null;
  },

  /**
   * Days until a deadline.
   * @param {string} dueStr
   * @returns {number}
   * @example Quarterly.getDaysUntilDeadline('2026-09-15') → 43
   */
  getDaysUntilDeadline(dueStr){
    const today=getToday();
    const due=new Date(dueStr+'T23:59:59');
    if(due<today)return 0;
    return daysBetween(today,due);
  },

  /**
   * Urgency level from days.
   * @param {number} days
   * @returns {'safe'|'warning'|'alert'|'critical'}
   * @example Quarterly.getUrgencyLevel(10) → 'critical'
   */
  getUrgencyLevel(days){
    if(days>60)return 'safe';
    if(days>=30)return 'warning';
    if(days>=15)return 'alert';
    return 'critical';
  },

  /**
   * Installment = YTD tax ÷ quarters elapsed.
   * @param {number} ytdTaxOwed
   * @param {number} quartersElapsed
   * @returns {number}
   * @example Quarterly.calculateInstallmentDue(12000,3) → 4000
   */
  calculateInstallmentDue(ytdTaxOwed,quartersElapsed){
    if(typeof ytdTaxOwed!=='number'||isNaN(ytdTaxOwed)||ytdTaxOwed<=0)return 0;
    if(!quartersElapsed||quartersElapsed<=0)return ytdTaxOwed;
    return Math.round((ytdTaxOwed/quartersElapsed)*100)/100;
  },

  /**
   * Quarters elapsed by current month.
   * @returns {number}
   * @example Quarterly.getQuartersElapsed() → 3 (in Aug)
   */
  getQuartersElapsed(){
    const m=new Date().getMonth();
    if(m<=2)return 1;
    if(m<=4)return 2;
    if(m<=7)return 3;
    return 4;
  },

  /**
   * Render tracker UI.
   * @returns {void}
   * @example Quarterly.renderQuarterlyTracker()
   */
  renderQuarterlyTracker(){
    const t=document.getElementById('quarterly-tracker');
    if(!t)return;
    const next=this.getNextDeadline();
    if(!next)return;
    const days=this.getDaysUntilDeadline(next.due);
    const urgency=this.getUrgencyLevel(days);
    const dateEl=t.querySelector('.quarterly-date');
    if(dateEl)dateEl.textContent=formatDate(next.due)+' · '+next.period;
    const num=t.querySelector('.countdown-number');
    if(num){num.textContent=String(days);num.classList.toggle('animate-countdown-pulse',urgency==='critical');}
    t.classList.remove('urgency-safe','urgency-warning','urgency-alert','urgency-critical');
    t.classList.add('urgency-'+urgency);
    Storage.getYTDTotals().then(totals=>{
      const inst=this.calculateInstallmentDue(totals.totalTax,this.getQuartersElapsed());
      const el=t.querySelector('.installment-amount');
      if(el)el.textContent=formatCurrency(inst);
    });
  }
};
