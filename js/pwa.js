/** QUARANTIN — Service worker, install prompt, online/offline. */
const PWA = {
  deferredPrompt:null,

  /**
   * Init PWA features.
   * @returns {void}
   */
  init(){this.registerSW();this.setupInstall();this.setupOnlineOffline();},

  /**
   * Register service worker.
   * @returns {void}
   */
  registerSW(){
    if('serviceWorker' in navigator){
      window.addEventListener('load',()=>{
        navigator.serviceWorker.register('sw.js').catch(e=>console.error('SW failed',e));
      });
    }
  },

  /**
   * Install prompt + banner.
   * @returns {void}
   */
  setupInstall(){
    window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();this.deferredPrompt=e;this.showInstall();});
    const b=document.getElementById('install-btn');
    if(b)b.addEventListener('click',()=>this.triggerInstall());
    const d=document.getElementById('install-dismiss');
    if(d)d.addEventListener('click',()=>this.hideInstall());
    window.addEventListener('appinstalled',()=>{this.hideInstall();UI.showToast('Installed!','success');});
  },

  /**
   * Show install banner.
   * @returns {void}
   */
  showInstall(){const el=document.getElementById('install-banner');if(el)el.classList.remove('hidden');},

  /**
   * Hide install banner.
   * @returns {void}
   */
  hideInstall(){const el=document.getElementById('install-banner');if(el)el.classList.add('hidden');},

  /**
   * Trigger native install.
   * @returns {Promise<void>}
   */
  async triggerInstall(){
    if(!this.deferredPrompt)return;
    this.deferredPrompt.prompt();
    await this.deferredPrompt.userChoice;
    this.deferredPrompt=null;
    this.hideInstall();
  },

  /**
   * Online/offline listeners + banner.
   * @returns {void}
   */
  setupOnlineOffline(){
    window.addEventListener('online',()=>this.banner('Back online','online'));
    window.addEventListener('offline',()=>this.banner('Offline — everything still works','offline'));
  },

  /**
   * Show status banner.
   * @param {string} msg
   * @param {string} type
   * @returns {void}
   */
  banner(msg,type){
    const b=document.getElementById('status-banner'),t=document.getElementById('status-banner-text');
    if(!b||!t)return;
    t.textContent=msg;
    b.className='status-banner '+type;
    setTimeout(()=>b.classList.add('hidden'),4000);
  }
};
