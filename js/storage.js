/** QUARANTIN — Storage layer (localStorage + IndexedDB). Only file touching storage. */
const Storage = {
  DB_NAME:'quarantin_db', DB_VERSION:1, STORE_NAME:'payments', db:null,

  /**
   * Save profile.
   * @param {Object} p - {filingStatus,stateCode,w2Income,businessDeductions,taxYear}
   * @returns {boolean}
   * @example Storage.saveProfile({filingStatus:'single',stateCode:'CA',w2Income:0,businessDeductions:0,taxYear:2024})
   */
  saveProfile(p){try{localStorage.setItem('quarantin_profile',JSON.stringify(p));return true;}catch(e){UI.showToast('Storage unavailable. Data may not be saved.','error');return false;}},

  /**
   * Load profile.
   * @returns {Object|null}
   * @example Storage.loadProfile()
   */
  loadProfile(){try{const r=localStorage.getItem('quarantin_profile');if(!r)return null;const p=JSON.parse(r);return (p&&typeof p==='object')?p:null;}catch(e){return null;}},

  /**
   * Clear profile.
   * @returns {void}
   */
  clearProfile(){try{localStorage.removeItem('quarantin_profile');}catch(e){}},

  /**
   * Caution banner dismissed flag.
   * @returns {boolean}
   * @example Storage.getCautionDismissed()
   */
  getCautionDismissed(){try{return localStorage.getItem('quarantin_caution_dismissed')==='1';}catch(e){return false;}},

  /**
   * Set caution dismissed.
   * @returns {void}
   */
  setCautionDismissed(){try{localStorage.setItem('quarantin_caution_dismissed','1');}catch(e){}},

  /**
   * Open IndexedDB.
   * @returns {Promise<IDBDatabase>}
   * @example await Storage.initDB()
   */
  initDB(){
    return new Promise((resolve,reject)=>{
      if(this.db)return resolve(this.db);
      try{
        const req=indexedDB.open(this.DB_NAME,this.DB_VERSION);
        req.onupgradeneeded=(e)=>{const db=e.target.result;if(!db.objectStoreNames.contains(this.STORE_NAME)){db.createObjectStore(this.STORE_NAME,{keyPath:'id'});}};
        req.onsuccess=(e)=>{this.db=e.target.result;resolve(this.db);};
        req.onerror=(e)=>reject(e.target.error);
      }catch(e){reject(e);}
    });
  },

  /**
   * Save a payment entry.
   * @param {Object} entry
   * @returns {Promise<void>}
   * @example await Storage.savePayment({id:'x',date:'...',gross:3400,...})
   */
  savePayment(entry){
    return this.initDB().then(db=>new Promise((res,rej)=>{
      try{const t=db.transaction([this.STORE_NAME],'readwrite');const r=t.objectStore(this.STORE_NAME).put(entry);r.onsuccess=()=>res();r.onerror=e=>rej(e.target.error);}catch(e){rej(e);}
    }));
  },

  /**
   * All payments sorted date desc.
   * @returns {Promise<Array>}
   * @example const p = await Storage.getAllPayments()
   */
  getAllPayments(){
    return this.initDB().then(db=>new Promise(resolve=>{
      try{const t=db.transaction([this.STORE_NAME],'readonly');const r=t.objectStore(this.STORE_NAME).getAll();
        r.onsuccess=()=>{const a=r.result||[];a.sort((x,y)=>new Date(y.date)-new Date(x.date));resolve(a);};
        r.onerror=()=>resolve([]);}catch(e){resolve([]);}
    }));
  },

  /**
   * Delete a payment by id.
   * @param {string} id
   * @returns {Promise<void>}
   * @example await Storage.deletePayment('abc')
   */
  deletePayment(id){
    return this.initDB().then(db=>new Promise((res,rej)=>{
      try{const t=db.transaction([this.STORE_NAME],'readwrite');const r=t.objectStore(this.STORE_NAME).delete(id);r.onsuccess=()=>res();r.onerror=e=>rej(e.target.error);}catch(e){rej(e);}
    }));
  },

  /**
   * Clear all payments.
   * @returns {Promise<void>}
   * @example await Storage.clearAllPayments()
   */
  clearAllPayments(){
    return this.initDB().then(db=>new Promise((res,rej)=>{
      try{const t=db.transaction([this.STORE_NAME],'readwrite');const r=t.objectStore(this.STORE_NAME).clear();r.onsuccess=()=>res();r.onerror=e=>rej(e.target.error);}catch(e){rej(e);}
    }));
  },

  /**
   * YTD totals.
   * @returns {Promise<Object>}
   * @example const t = await Storage.getYTDTotals()
   */
  getYTDTotals(){
    return this.getAllPayments().then(ps=>{
      const t={totalGross:0,totalSETax:0,totalFedTax:0,totalStateTax:0,totalTax:0,totalNet:0,paymentCount:ps.length};
      ps.forEach(p=>{t.totalGross+=p.gross||0;t.totalSETax+=p.seTax||0;t.totalFedTax+=p.federalTax||0;t.totalStateTax+=p.stateTax||0;t.totalTax+=p.totalTax||0;t.totalNet+=p.netTakeHome||0;});
      return t;
    });
  },

  /**
   * Save theme.
   * @param {string} mode - 'dark'|'light'
   * @returns {void}
   */
  saveTheme(mode){try{localStorage.setItem('quarantin_theme',mode);}catch(e){}},

  /**
   * Get theme (defaults to system).
   * @returns {string}
   * @example Storage.getTheme() → 'dark'
   */
  getTheme(){
    try{const s=localStorage.getItem('quarantin_theme');if(s==='dark'||s==='light')return s;}catch(e){}
    return (window.matchMedia&&window.matchMedia('(prefers-color-scheme: light)').matches)?'light':'dark';
  },

  /**
   * Wipe everything.
   * @returns {Promise<void>}
   * @example await Storage.resetAllData()
   */
  resetAllData(){
    return new Promise(resolve=>{
      try{const keys=[];for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&k.startsWith('quarantin_'))keys.push(k);}keys.forEach(k=>localStorage.removeItem(k));}catch(e){}
      this.clearAllPayments().then(()=>{if(this.db){this.db.close();this.db=null;}resolve();}).catch(()=>resolve());
    });
  }
};
