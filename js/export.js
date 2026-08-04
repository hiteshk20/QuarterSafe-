/** QUARANTIN — CSV + PDF export (no libraries). */
const Export = {
  /**
   * Export payments as CSV download.
   * @returns {void}
   * @example Export.exportCSV()
   */
  exportCSV(){
    Storage.getAllPayments().then(ps=>{
      if(!ps.length){UI.showToast('Nothing to export','error');return;}
      const head=['Date','Gross','SE Tax','Federal Tax','State Tax','Total Tax','Net','Quarantine','Effective Rate'];
      const rows=ps.map(p=>[p.date,p.gross.toFixed(2),p.seTax.toFixed(2),p.federalTax.toFixed(2),p.stateTax.toFixed(2),p.totalTax.toFixed(2),p.netTakeHome.toFixed(2),p.quarantineAmount.toFixed(2),(p.effectiveRate*100).toFixed(1)+'%']
        .map(f=>'"'+String(f).replace(/"/g,'""')+'"').join(','));
      const csv=[head.join(','),...rows].join('\n');
      const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'});
      const url=URL.createObjectURL(blob);
      const a=document.createElement('a');
      a.href=url;a.download='quarantin-export-'+getCurrentYear()+'.csv';
      document.body.appendChild(a);a.click();a.remove();
      setTimeout(()=>URL.revokeObjectURL(url),100);
      UI.showToast('CSV exported','success');
    });
  },

  /**
   * Export as PDF via print dialog.
   * @returns {void}
   * @example Export.exportPDF()
   */
  exportPDF(){
    Storage.getAllPayments().then(ps=>{
      if(!ps.length){UI.showToast('Nothing to export','error');return;}
      UI.showScreen('screen-history');
      this.addHeader();
      document.body.classList.add('printing');
      window.print();
      const done=()=>{document.body.classList.remove('printing');this.removeHeader();window.removeEventListener('afterprint',done);};
      window.addEventListener('afterprint',done);
      setTimeout(done,2000);
    });
  },

  /**
   * Insert print header.
   * @returns {void}
   */
  addHeader(){
    this.removeHeader();
    const screen=document.getElementById('screen-history');if(!screen)return;
    const h=document.createElement('div');h.className='print-header';h.id='print-header';
    const t=document.createElement('div');t.className='print-header-title';t.textContent='QUARANTIN — Tax Report '+getCurrentYear();
    const d=document.createElement('div');d.className='print-header-date';d.textContent='Generated: '+formatDateTime(new Date());
    h.appendChild(t);h.appendChild(d);
    screen.insertBefore(h,screen.firstChild);
  },

  /**
   * Remove print header.
   * @returns {void}
   */
  removeHeader(){const h=document.getElementById('print-header');if(h)h.remove();}
};
