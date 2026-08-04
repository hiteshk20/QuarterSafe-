/** QUARANTIN — Settings panel logic. */
const Settings = {
  /**
   * Populate settings form from profile.
   * @returns {void}
   * @example Settings.loadSettingsForm()
   */
  loadSettingsForm(){
    const p=Storage.loadProfile();if(!p)return;
    const f=document.getElementById('setting-filing-status');if(f&&p.filingStatus)f.value=p.filingStatus;
    const s=document.getElementById('setting-state');
    if(s){if(s.options.length===0)App.populateStateDropdown('setting-state');if(p.stateCode)s.value=p.stateCode;}
    const w=document.getElementById('setting-w2-income');if(w)w.value=p.w2Income>0?formatInputNumber(p.w2Income):'';
    const d=document.getElementById('setting-deductions');if(d)d.value=p.businessDeductions>0?formatInputNumber(p.businessDeductions):'';
    const y=document.getElementById('setting-tax-year');if(y&&p.taxYear)y.value=String(p.taxYear);
    const t=document.getElementById('setting-theme');
    if(t)t.setAttribute('aria-checked',document.documentElement.getAttribute('data-theme')==='dark'?'true':'false');
    this.bind();
  },

  /**
   * Bind settings events.
   * @returns {void}
   */
  bind(){
    const save=document.getElementById('btn-save-settings');
    if(save)save.onclick=()=>this.save();
    const theme=document.getElementById('setting-theme');
    if(theme)theme.onclick=()=>{UI.toggleTheme();theme.setAttribute('aria-checked',document.documentElement.getAttribute('data-theme')==='dark'?'true':'false');};
    const exp=document.getElementById('btn-export-json');
    if(exp)exp.onclick=()=>this.exportAll();
    const reset=document.getElementById('btn-reset-data');
    if(reset)reset.onclick=()=>{UI.showModal('modal-reset');this.bindReset();};
  },

  /**
   * Bind reset confirmation.
   * @returns {void}
   */
  bindReset(){
    const input=document.getElementById('reset-confirm-input');
    const btn=document.getElementById('btn-confirm-reset');
    if(!input||!btn)return;
    input.value='';btn.disabled=true;
    input.oninput=()=>{btn.disabled=input.value.trim()!=='DELETE';};
    btn.onclick=()=>this.resetAll();
  },

  /**
   * Validate + save settings, re-run calc.
   * @returns {void}
   * @example Settings.save()
   */
  save(){
    const f=document.getElementById('setting-filing-status').value;
    const s=document.getElementById('setting-state').value;
    const w=sanitizeNumber(document.getElementById('setting-w2-income').value);
    const d=sanitizeNumber(document.getElementById('setting-deductions').value);
    const y=parseInt(document.getElementById('setting-tax-year').value,10)||getCurrentYear();
    if(y<2024||y>2030){UI.showToast('Tax year must be 2024–2030','error');return;}
    const profile={filingStatus:f,stateCode:s,w2Income:w,businessDeductions:d,taxYear:y};
    Storage.saveProfile(profile);App.profile=profile;
    UI.showToast('Settings saved ✅','success');
    App.runCalculation();
  },

  /**
   * Export all data as JSON backup.
   * @returns {void}
   * @example Settings.exportAll()
   */
  exportAll(){
    Storage.getAllPayments().then(ps=>{
      const data={app:'QUARANTIN',version:'2.0.0',exportDate:nowISO(),profile:Storage.loadProfile(),payments:ps};
      const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
      const url=URL.createObjectURL(blob);
      const a=document.createElement('a');
      a.href=url;a.download='quarantin-backup-'+new Date().toISOString().split('T')[0]+'.json';
      document.body.appendChild(a);a.click();a.remove();
      setTimeout(()=>URL.revokeObjectURL(url),100);
      UI.showToast('Backup exported','success');
    });
  },

  /**
   * Wipe all data + reload.
   * @returns {void}
   * @example Settings.resetAll()
   */
  resetAll(){
    UI.hideModal('modal-reset');
    Storage.resetAllData().then(()=>{UI.showToast('All data deleted. Reloading...','info');setTimeout(()=>location.reload(),1000);});
  }
};
