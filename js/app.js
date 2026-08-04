/** QUARANTIN — Entry point & router. */
const App = {
  profile:null, currentResults:null,

  /**
   * Initialize app.
   * @returns {void}
   */
  init(){
    PWA.init();
    UI.setTheme(Storage.getTheme());
    this.profile=Storage.loadProfile();
    this.showCaution();
    if(!this.profile){this.populateStateDropdown('onboarding-state');UI.showModal('modal-onboarding');}
    else UI.showScreen('screen-calculator');
    this.bindNav();this.bindInput();this.bindTheme();this.bindSave();this.bindOnboarding();this.bindModals();this.bindExports();
    Quarterly.renderQuarterlyTracker();
  },

  /**
   * Show data-loss caution banner once.
   * @returns {void}
   */
  showCaution(){
    if(Storage.getCautionDismissed())return;
    const b=document.getElementById('caution-banner');
    if(b)b.classList.remove('hidden');
    const d=document.getElementById('caution-dismiss');
    if(d)d.onclick=()=>{b.classList.add('hidden');Storage.setCautionDismissed();};
  },

  /**
   * Fill a state select with all states.
   * @param {string} selectId
   * @returns {void}
   * @example App.populateStateDropdown('setting-state')
   */
  populateStateDropdown(selectId){
    const sel=document.getElementById(selectId);if(!sel)return;
    sel.innerHTML='';
    TAX_DATA.getStatesList().forEach(s=>{
      const o=document.createElement('option');o.value=s.code;o.textContent=s.name;sel.appendChild(o);
    });
  },

  /**
   * Bind nav tabs.
   * @returns {void}
   */
  bindNav(){
    document.querySelectorAll('.nav-tab').forEach(tab=>{
      tab.addEventListener('click',()=>{
        const id=tab.dataset.screen;
        UI.showScreen(id);
        if(id==='screen-history'){History.renderHistoryTable();History.renderYTDCards();}
        else if(id==='screen-dashboard')Dashboard.renderDashboard();
        else if(id==='screen-settings')Settings.loadSettingsForm();
      });
    });
  },

  /**
   * Bind payment input (debounced, with typing glow).
   * @returns {void}
   */
  bindInput
