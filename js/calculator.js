/** QUARANTIN — Pure tax math. No DOM, no storage. */

/**
 * SE tax for a gross payment. IRS Pub 334 / Schedule SE.
 * @param {number} grossPayment
 * @returns {{netSEIncome:number, seTax:number, seDeduction:number}}
 * @example calculateSETax(3400) → {netSEIncome:3139.9, seTax:480.4, seDeduction:240.2}
 */
function calculateSETax(grossPayment){
  if(typeof grossPayment!=='number'||isNaN(grossPayment)||grossPayment<=0)return{netSEIncome:0,seTax:0,seDeduction:0};
  const netSEIncome=grossPayment*TAX_DATA.SE_NET_FACTOR;
  const seTax=netSEIncome*TAX_DATA.SE_RATE;
  const seDeduction=seTax*TAX_DATA.SE_DEDUCTION_FACTOR;
  return{netSEIncome:Math.round(netSEIncome*100)/100,seTax:Math.round(seTax*100)/100,seDeduction:Math.round(seDeduction*100)/100};
}

/**
 * Projected annual AGI. IRS Form 1040 lines 1-11.
 * @param {number} grossPayment
 * @param {number} ytdGross
 * @param {number} businessDeductions
 * @param {number} w2Income
 * @param {number} seDeduction
 * @returns {number}
 * @example calculateAGI(3400,0,0,0,240.2) → 3159.8
 */
function calculateAGI(grossPayment,ytdGross,businessDeductions,w2Income,seDeduction){
  const agi=(ytdGross||0)+(grossPayment||0)+(w2Income||0)-(businessDeductions||0)-(seDeduction||0);
  return Math.max(0,Math.round(agi*100)/100);
}

/**
 * Standard deduction by filing status (2024).
 * @param {string} filingStatus
 * @returns {number}
 * @example calculateStandardDeduction('single') → 14600
 */
function calculateStandardDeduction(filingStatus){
  return TAX_DATA.STANDARD_DEDUCTIONS[filingStatus]||TAX_DATA.STANDARD_DEDUCTIONS.single;
}

/**
 * Total federal tax via marginal brackets.
 * @param {number} taxableIncome
 * @param {string} filingStatus
 * @returns {number}
 * @example calculateFederalTax(50000,'single') → 6617
 */
function calculateFederalTax(taxableIncome,filingStatus){
  if(typeof taxableIncome!=='number'||isNaN(taxableIncome)||taxableIncome<=0)return 0;
  const brackets=TAX_DATA.FEDERAL_BRACKETS[filingStatus];
  if(!brackets)return 0;
  let total=0;
  for(const b of brackets){
    if(taxableIncome>b.min){total+=(Math.min(taxableIncome,b.max)-b.min)*b.rate;}else break;
  }
  return Math.round(total*100)/100;
}

/**
 * Marginal federal tax attributable to this payment only.
 * @param {number} grossPayment
 * @param {number} ytdGross
 * @param {number} businessDeductions
 * @param {number} w2Income
 * @param {number} seDeduction
 * @param {string} filingStatus
 * @returns {number}
 * @example calculateMarginalFederalTax(3400,0,0,0,240.2,'single') → ~0 (below standard deduction)
 */
function calculateMarginalFederalTax(grossPayment,ytdGross,businessDeductions,w2Income,seDeduction,filingStatus){
  if(typeof grossPayment!=='number'||isNaN(grossPayment)||grossPayment<=0)return 0;
  const std=calculateStandardDeduction(filingStatus);
  const before=calculateFederalTax(Math.max(0,calculateAGI(0,ytdGross,businessDeductions,w2Income,seDeduction)-std),filingStatus);
  const after=calculateFederalTax(Math.max(0,calculateAGI(grossPayment,ytdGross,businessDeductions,w2Income,seDeduction)-std),filingStatus);
  return Math.round(Math.max(0,after-before)*100)/100;
}

/**
 * State tax for a taxable income.
 * @param {number} taxableIncome
 * @param {string} stateCode
 * @returns {number}
 * @example calculateStateTax(50000,'CA') → ~2370
 */
function calculateStateTax(taxableIncome,stateCode){
  if(typeof taxableIncome!=='number'||isNaN(taxableIncome)||taxableIncome<=0)return 0;
  const s=TAX_DATA.STATE_TAX_RATES[stateCode];
  if(!s||s.type==='none')return 0;
  if(s.type==='flat')return Math.round(taxableIncome*s.rate*100)/100;
  let total=0;
  for(const b of s.brackets){
    if(taxableIncome>b.min){total+=(Math.min(taxableIncome,b.max)-b.min)*b.rate;}else break;
  }
  return Math.round(total*100)/100;
}

/**
 * Marginal state tax attributable to this payment only.
 * @param {number} grossPayment
 * @param {number} ytdGross
 * @param {number} businessDeductions
 * @param {number} w2Income
 * @param {number} seDeduction
 * @param {string} stateCode
 * @returns {number}
 * @example calculateMarginalStateTax(3400,0,0,0,240.2,'CA') → ~0..small
 */
function calculateMarginalStateTax(grossPayment,ytdGross,businessDeductions,w2Income,seDeduction,stateCode){
  if(typeof grossPayment!=='number'||isNaN(grossPayment)||grossPayment<=0)return 0;
  const std=calculateStandardDeduction('single');
  const before=calculateStateTax(Math.max(0,calculateAGI(0,ytdGross,businessDeductions,w2Income,seDeduction)-std),stateCode);
  const after=calculateStateTax(Math.max(0,calculateAGI(grossPayment,ytdGross,businessDeductions,w2Income,seDeduction)-std),stateCode);
  return Math.round(Math.max(0,after-before)*100)/100;
}

/**
 * Quarantine amount = total tax + buffer.
 * @param {number} totalTax
 * @returns {number}
 * @example calculateQuarantineAmount(1000) → 1050
 */
function calculateQuarantineAmount(totalTax){
  if(typeof totalTax!=='number'||isNaN(totalTax)||totalTax<=0)return 0;
  return Math.round(totalTax*(1+TAX_DATA.BUFFER_RATE)*100)/100;
}

/**
 * Full payment calculation orchestrator.
 * @param {Object} inputs
 * @param {number} inputs.grossPayment
 * @param {string} inputs.filingStatus
 * @param {string} inputs.stateCode
 * @param {number} inputs.businessDeductions
 * @param {number} inputs.w2Income
 * @param {number} inputs.ytdGross
 * @returns {Object} results
 * @example calculateFullPayment({grossPayment:3400,filingStatus:'single',stateCode:'CA',businessDeductions:0,w2Income:0,ytdGross:0})
 */
function calculateFullPayment(inputs){
  const{grossPayment,filingStatus,stateCode,businessDeductions,w2Income,ytdGross}=inputs;
  if(typeof grossPayment!=='number'||isNaN(grossPayment)||grossPayment<=0){
    return{grossPayment:0,seTax:0,seDeduction:0,federalTax:0,stateTax:0,totalTaxThisPayment:0,quarantineAmount:0,netTakeHome:0,effectiveRate:0};
  }
  const se=calculateSETax(grossPayment);
  const federalTax=calculateMarginalFederalTax(grossPayment,ytdGross||0,businessDeductions||0,w2Income||0,se.seDeduction,filingStatus||'single');
  const stateTax=calculateMarginalStateTax(grossPayment,ytdGross||0,businessDeductions||0,w2Income||0,se.seDeduction,stateCode||'CA');
  const totalTaxThisPayment=Math.round((se.seTax+federalTax+stateTax)*100)/100;
  const quarantineAmount=calculateQuarantineAmount(totalTaxThisPayment);
  const netTakeHome=Math.max(0,Math.round((grossPayment-totalTaxThisPayment)*100)/100);
  const effectiveRate=grossPayment>0?Math.round((totalTaxThisPayment/grossPayment)*1000)/1000:0;
  return{grossPayment,seTax:se.seTax,seDeduction:se.seDeduction,federalTax,stateTax,totalTaxThisPayment,quarantineAmount,netTakeHome,effectiveRate};
}
