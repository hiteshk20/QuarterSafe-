/** QUARANTIN — UI rendering & modals & toasts. */
const UI = {
  activeModal:null, lastFocused:null, raf:null,

  /**
   * Show one screen, hide others, sync nav.
   * @param {string} screenId
   * @returns {void}
   * @example UI.showScreen('screen-history')
   */
  showScreen(screenId){
    document.querySelectorAll('.screen').forEach(s=>{
      const on=s.id===screenId;
      s.classList.toggle('active',on);
      s.classList.toggle('hidden',!on);
    });
    document.querySelectorAll('.nav-tab').forEach(t=>{
      const on=t.dataset.screen===screenId;
      t.classList.toggle('active',on);
      if(on)t.setAttribute('aria-current','page');else t.removeAttribute('aria-current');
    });
  },

  /**
   * Render calculator outputs with count-up.
   * @param {Object} r - results
   * @returns {void}
   * @example UI.renderCalculatorOutput(results)
   */
  renderCalculatorOutput(r){
    if(this.raf)cancelAnimationFrame(this.raf);
    this.raf=requestAnimationFrame(()=>{
      this.setVal('out-se-tax',formatCurrency(r.seTax));
      this.setVal('out-fed-tax',formatCurrency(r.federalTax));
      this.setVal('out-state-tax',formatCurrency(r.stateTax));
      this.setVal('out-total-tax',formatCurrency(r.totalTaxThisPayment));
      this.setVal('out-quarantine',formatCurrency(r.quarantineAmount));
      this.setVal('out-net',formatCurrency(r.netTakeHome));
      this.setVal('out-rate',formatPercentage(r.effectiveRate));
    });
  },

  /**
   * Set a value with animation.
   * @param {string} id
   * @param {string} text
   * @returns {void}
   */
  setVal(id,text){
    const el=document.getElementById(id);
    if(!el)return;
    el.textContent=text;
    el.classList.add('animate-count-up');
    setTimeout(()=>el.classList.remove('animate-count-up'),500);
  },

  /**
   * Show modal with focus trap.
   * @param {string} modalId
   * @returns {void}
   * @example UI.showModal('modal-onboarding')
   */
  showModal(modalId){
    const m=document.getElementById(modalId);
    if(!m)return;
    this.lastFocused=document.activeElement;
    m.classList.remove('hidden');
    this.activeModal=m;
    const f=m.querySelector('button,input,select,[tabindex]');
    if(f)f.focus();
    m.addEventListener('keydown',this._trap);
    document.body.style.overflow='hidden';
  },

  /**
   * Hide modal.
   * @param {string} [modalId]
   * @returns {void}
   */
  hideModal(modalId){
    const m=modalId?document.getElementById(modalId):this.activeModal;
    if(!m)return;
    m.classList.add('hidden');
    m.removeEventListener('keydown',this._trap);
    this.activeModal=null;
    document.body.style.overflow='';
    if(this.lastFocused)this.lastFocused.focus();
  },

  /**
   * Focus trap + Escape handler.
   * @param {KeyboardEvent} e
   * @returns {void}
   */
  _trap(e){
    if(e.key==='Escape'){UI.hideModal();return;}
    if(e.key!=='Tab'||!UI.activeModal)return;
    const f=[...UI.activeModal.querySelectorAll('button,input,select,[tabindex]:not([tabindex="-1"])')];
    const first=f[0],last=f[f.length-1];
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
    else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
  },

  /**
   * Show toast.
   * @param {string} message
   * @param {string} [type='info']
   * @returns {void}
   * @example UI.showToast('Saved','success')
   */
  showToast(message,type='info'){
    const c=document.getElementById('toast-container');
    if(!c)return;
    const t=document.createElement('div');
    t.className='toast '+type;
    t.setAttribute('role','status');
    const icon=type==='success'?'✅':type==='error'?'❌':'ℹ️';
    t.textContent=icon+' '+message;
    c.appendChild(t);
    setTimeout(()=>{t.style.opacity='0';setTimeout(()=>t.remove(),300);},3000);
  },

  /**
   * Apply theme.
   * @param {string} mode
   * @returns {void}
   * @example UI.setTheme('light')
   */
  setTheme(mode){
    document.documentElement.setAttribute('data-theme',mode);
    const sun=document.querySelector('.icon-sun'),moon=document.querySelector('.icon-moon'),sw=document.getElementById('setting-theme');
    if(mode==='dark'){sun&&sun.classList.add('hidden');moon&&moon.classList.remove('hidden');sw&&sw.setAttribute('aria-checked','true');}
    else{sun&&sun.classList.remove('hidden');moon&&moon.classList.add('hidden');sw&&sw.setAttribute('aria-checked','false');}
  },

  /**
   * Toggle theme and persist.
   * @returns {void}
   */
  toggleTheme(){
    const cur=document.documentElement.getAttribute('data-theme');
    const next=cur==='dark'?'light':'dark';
    this.setTheme(next);
    Storage.saveTheme(next);
  },

  /**
   * Show/clear inline input error.
   * @param {string} inputId
   * @param {string} errorId
   * @param {string|null} message
   * @returns {void}
   * @example UI.showInputError('payment-input','payment-input-error','Invalid')
   */
  showInputError(inputId,errorId,message){
    const input=document.getElementById(inputId),err=document.getElementById(errorId);
    if(message){if(err){err.textContent=message;err.classList.remove('hidden');}if(input)input.setAttribute('aria-invalid','true');}
    else{if(err){err.textContent='';err.classList.add('hidden');}if(input)input.removeAttribute('aria-invalid');}
  }
};
