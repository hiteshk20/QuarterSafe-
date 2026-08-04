/** QUARANTIN — Ledger CRUD + rendering. */
const History = {
  /**
   * Render history table + totals.
   * @returns {void}
   * @example History.renderHistoryTable()
   */
  renderHistoryTable(){
    Storage.getAllPayments().then(ps=>{
      const tbody=document.getElementById('history-tbody');
      const empty=document.getElementById('history-empty');
      const scroll=document.querySelector('.table-scroll');
      if(!tbody)return;
      tbody.innerHTML='';
      if(ps.length===0){
        empty&&empty.classList.remove('hidden');
        scroll&&scroll.classList.add('hidden');
      }else{
        empty&&empty.classList.add('hidden');
        scroll&&scroll.classList.remove('hidden');
        ps.forEach(p=>tbody.appendChild(this.row(p)));
      }
      Storage.getYTDTotals().then(t=>this.tfoot(t));
    });
  },

  /**
   * Build a table row.
   * @param {Object} p - payment
   * @returns {HTMLTableRowElement}
   * @example History.row(payment)
   */
  row(p){
    const tr=document.createElement('tr');
    const cells=[formatDate(p.date),formatCurrency(p.gross),formatCurrency(p.seTax),formatCurrency(p.federalTax),formatCurrency(p.stateTax),formatCurrency(p.totalTax),formatCurrency(p.netTakeHome)];
    cells.forEach(txt=>{const td=document.createElement('td');td.textContent=txt;tr.appendChild(td);});
    const td=document.createElement('td');
    const btn=document.createElement('button');
    btn.className='btn-delete';
    btn.setAttribute('aria-label','Delete payment '+formatDate(p.date));
    btn.textContent='🗑';
    btn.addEventListener('click',()=>this.deleteEntry(p.id));
    td.appendChild(btn);tr.appendChild(td);
    return tr;
  },

  /**
   * Update tfoot totals.
   * @param {Object} t - totals
   * @returns {void}
   */
  tfoot(t){
    const set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=formatCurrency(v);};
    set('tfoot-gross',t.totalGross);set('tfoot-se',t.totalSETax);set('tfoot-fed',t.totalFedTax);
    set('tfoot-state',t.totalStateTax);set('tfoot-total',t.totalTax);set('tfoot-net',t.totalNet);
  },

  /**
   * Render YTD summary cards.
   * @returns {void}
   * @example History.renderYTDCards()
   */
  renderYTDCards(){
    Storage.getYTDTotals().then(t=>{
      const set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=formatCurrency(v);};
      set('ytd-gross',t.totalGross);set('ytd-tax',t.totalTax);set('ytd-net',t.totalNet);
      const c=document.getElementById('ytd-count');if(c)c.textContent=String(t.paymentCount);
    });
  },

  /**
   * Delete an entry + re-render.
   * @param {string} id
   * @returns {void}
   * @example History.deleteEntry('abc')
   */
  deleteEntry(id){
    Storage.deletePayment(id).then(()=>{
      this.renderHistoryTable();this.renderYTDCards();Quarterly.renderQuarterlyTracker();
      UI.showToast('Payment deleted','success');
    }).catch(()=>UI.showToast('Delete failed','error'));
  },

  /**
   * Save current calculation to ledger.
   * @returns {void}
   * @example History.saveCurrentCalculation()
   */
  saveCurrentCalculation(){
    const r=App.currentResults;
    if(!r||r.grossPayment<=0){UI.showToast('Enter a payment first','error');return;}
    const entry={id:generateId(),date:nowISO(),gross:r.grossPayment,seTax:r.seTax,federalTax:r.federalTax,
      stateTax:r.stateTax,totalTax:r.totalTaxThisPayment,netTakeHome:r.netTakeHome,quarantineAmount:r.quarantineAmount,effectiveRate:r.effectiveRate};
    Storage.savePayment(entry).then(()=>{
      UI.showToast('✅ Saved to ledger','success');
      this.renderHistoryTable();this.renderYTDCards();Quarterly.renderQuarterlyTracker();
    }).catch(()=>UI.showToast('Save failed','error'));
  }
};
