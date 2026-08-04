/** QUARANTIN — Shared helpers. */

/**
 * Formats a number as USD currency.
 * @param {number} amount - Amount to format
 * @returns {string} e.g. "$3,400.00"
 * @example formatCurrency(3400) → "$3,400.00"
 */
function formatCurrency(amount){
  if(typeof amount!=='number'||isNaN(amount)||!isFinite(amount))return '$0.00';
  return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',minimumFractionDigits:2,maximumFractionDigits:2}).format(amount);
}

/**
 * Formats a decimal as a percent string.
 * @param {number} value - Decimal (0.25 = 25%)
 * @param {number} [decimals=1]
 * @returns {string} e.g. "25.0%"
 * @example formatPercentage(0.2534) → "25.3%"
 */
function formatPercentage(value,decimals=1){
  if(typeof value!=='number'||isNaN(value)||!isFinite(value))return '0.0%';
  return (value*100).toFixed(decimals)+'%';
}

/**
 * Formats a date to "Jan 15, 2024".
 * @param {string|Date} dateInput
 * @returns {string}
 * @example formatDate('2024-01-15') → "Jan 15, 2024"
 */
function formatDate(dateInput){
  try{
    const d=dateInput instanceof Date?dateInput:new Date(dateInput);
    if(isNaN(d.getTime()))return '—';
    return d.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
  }catch(e){return '—';}
}

/**
 * Formats date with time.
 * @param {string|Date} dateInput
 * @returns {string}
 * @example formatDateTime(new Date()) → "Aug 3, 2026, 10:30 AM"
 */
function formatDateTime(dateInput){
  try{
    const d=dateInput instanceof Date?dateInput:new Date(dateInput);
    if(isNaN(d.getTime()))return '—';
    return d.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'});
  }catch(e){return '—';}
}

/**
 * Sanitizes input to a number (strips $ , letters).
 * @param {string|number} input
 * @returns {number} 0 if invalid
 * @example sanitizeNumber("$3,400.50") → 3400.5
 */
function sanitizeNumber(input){
  if(typeof input==='number')return isFinite(input)?input:0;
  if(typeof input!=='string')return 0;
  const cleaned=input.replace(/[^0-9.]/g,'');
  if(cleaned===''||cleaned==='.')return 0;
  const p=parseFloat(cleaned);
  return isFinite(p)?p:0;
}

/**
 * Formats number with commas for input fields.
 * @param {number} amount
 * @returns {string} e.g. "3,400.50"
 * @example formatInputNumber(3400.5) → "3,400.50"
 */
function formatInputNumber(amount){
  if(typeof amount!=='number'||isNaN(amount))return '0.00';
  return amount.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
}

/**
 * Generates a unique ID (Web Crypto, with fallback).
 * @returns {string} UUID
 * @example generateId() → "550e8400-..."
 */
function generateId(){
  try{if(typeof crypto!=='undefined'&&crypto.randomUUID)return crypto.randomUUID();}catch(e){}
  return Date.now().toString(36)+'-'+Math.random().toString(36).substring(2,11);
}

/**
 * Debounces a function.
 * @param {Function} func
 * @param {number} wait - ms
 * @returns {Function}
 * @example const d = debounce(fn, 150);
 */
function debounce(func,wait){
  let t=null;
  return function(...args){clearTimeout(t);t=setTimeout(()=>func(...args),wait);};
}

/**
 * Returns current year.
 * @returns {number}
 * @example getCurrentYear() → 2026
 */
function getCurrentYear(){return new Date().getFullYear();}

/**
 * Returns today at midnight.
 * @returns {Date}
 * @example getToday()
 */
function getToday(){const n=new Date();return new Date(n.getFullYear(),n.getMonth(),n.getDate());}

/**
 * Days between two dates.
 * @param {Date} a
 * @param {Date} b
 * @returns {number}
 * @example daysBetween(new Date('2024-01-01'), new Date('2024-01-15')) → 14
 */
function daysBetween(a,b){
  const ms=86400000;
  const u1=Date.UTC(a.getFullYear(),a.getMonth(),a.getDate());
  const u2=Date.UTC(b.getFullYear(),b.getMonth(),b.getDate());
  return Math.round(Math.abs(u2-u1)/ms);
}

/**
 * Current ISO timestamp.
 * @returns {string}
 * @example nowISO()
 */
function nowISO(){return new Date().toISOString();}
