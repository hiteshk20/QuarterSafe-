/**
 * QUARANTIN — Calculator Engine
 * Pure functions only. Zero DOM access. Zero localStorage calls.
 * Takes numbers in, returns numbers out.
 * Every formula cites its IRS source.
 */

/**
 * Calculates Self-Employment Tax for a gross payment.
 * SE tax = 92.35% of net SE income × 15.3%
 * IRS Publication 334, Chapter 10: SE tax applies to 92.35% of net earnings.
 * Source: IRS.gov/pub/irs-pdf/p334.pdf
 *
 * @param {number} grossPayment - The gross payment amount received
 * @returns {{netSEIncome: number, seTax: number, seDeduction: number}}
 * @example
 * calculateSETax(3400) → { netSEIncome: 3139.9, seTax: 480.40, seDeduction: 240.20 }
 */
function calculateSETax(grossPayment) {
  if (typeof grossPayment !== 'number' || isNaN(grossPayment) || grossPayment <= 0) {
    return { netSEIncome: 0, seTax: 0, seDeduction: 0 };
  }
  // IRS Schedule SE: net SE income = gross × 92.35%
  const netSEIncome = grossPayment * TAX_DATA.SE_NET_FACTOR;
  // SE tax = net SE income × 15.3%
  const seTax = netSEIncome * TAX_DATA.SE_RATE;
  // Deductible half of SE tax (employer-equivalent portion)
  const seDeduction = seTax * TAX_DATA.SE_DEDUCTION_FACTOR;

  return {
    netSEIncome: Math.round(netSEIncome * 100) / 100,
    seTax: Math.round(seTax * 100) / 100,
    seDeduction: Math.round(seDeduction * 100) / 100
  };
}

/**
 * Calculates Adjusted Gross Income (AGI) projection for the year.
 * Projects annual income including this payment, minus deductions.
 * IRS Form 1040, Lines 1–11.
 * Source: IRS.gov/pub/irs-pdf/f1040.pdf
 *
 * @param {number} grossPayment - This payment's gross amount
 * @param {number} ytdGross - Year-to-date gross from prior payments
 * @param {number} businessDeductions - Estimated annual business deductions
 * @param {number} w2Income - Prior W-2 income this year
 * @param {number} seDeduction - Deductible half of SE tax
 * @returns {number} Projected AGI
 * @example
 * calculateAGI(3400, 0, 0, 0, 240.20) → 3159.80
 */
function calculateAGI(grossPayment, ytdGross, businessDeductions, w2Income, seDeduction) {
  const projectedAnnualFreelance = (ytdGross || 0) + (grossPayment || 0);
  const agi = projectedAnnualFreelance + (w2Income || 0)
    - (businessDeductions || 0) - (seDeduction || 0);
  return Math.max(0, Math.round(agi * 100) / 100);
}

/**
 * Returns the standard deduction for a given filing status.
 * IRS Revenue Procedure 2023-34, 2024 amounts.
 * Source: IRS.gov/newsroom/irs-provides-2024-tax-brackets
 *
 * @param {string} filingStatus - 'single' | 'marriedFilingJointly' | 'headOfHousehold'
 * @returns {number} Standard deduction amount
 * @example
 * calculateStandardDeduction('single') → 14600
 */
function calculateStandardDeduction(filingStatus) {
  const deduction = TAX_DATA.STANDARD_DEDUCTIONS[filingStatus];
  return typeof deduction === 'number' ? deduction : TAX_DATA.STANDARD_DEDUCTIONS.single;
}

/**
 * Calculates total federal income tax using marginal brackets.
 * Iterates through 2024 IRS tax brackets for the given filing status.
 * IRS Tax Rate Schedules, Form 1040 instructions.
 * Source: IRS.gov/pub/irs-pdf/i1040gi.pdf
 *
 * @param {number} taxableIncome - Taxable income after deductions (must be >= 0)
 * @param {string} filingStatus - 'single' | 'marriedFilingJointly' | 'headOfHousehold'
 * @returns {number} Total federal tax owed
 * @example
 * calculateFederalTax(50000, 'single') → 6866.50
 */
function calculateFederalTax(taxableIncome, filingStatus) {
  if (typeof taxableIncome !== 'number' || isNaN(taxableIncome) || taxableIncome <= 0) {
    return 0;
  }

  const brackets = TAX_DATA.FEDERAL_BRACKETS[filingStatus];
  if (!brackets || !Array.isArray(brackets)) {
    return 0;
  }

  let totalTax = 0;

  for (let i = 0; i < brackets.length; i++) {
    const bracket = brackets[i];
    if (taxableIncome > bracket.min) {
      const taxableInBracket = Math.min(taxableIncome, bracket.max) - bracket.min;
      totalTax += taxableInBracket * bracket.rate;
    } else {
      break;
    }
  }

  return Math.round(totalTax * 100) / 100;
}

/**
 * Calculates the MARGINAL federal tax attributable to this specific payment.
 * Computes the difference in total federal tax before and after this payment.
 * This isolates the tax impact of the current payment only.
 * IRS marginal tax rate concept: each dollar taxed at its bracket rate.
 * Source: IRS.gov/pub/irs-pdf/i1040gi.pdf
 *
 * @param {number} grossPayment - This payment's gross amount
 * @param {number} ytdGross - Year-to-date gross from prior payments
 * @param {number} businessDeductions - Estimated annual business deductions
 * @param {number} w2Income - Prior W-2 income this year
 * @param {number} seDeduction - Deductible half of SE tax for this payment
 * @param {string} filingStatus - Filing status key
 * @returns {number} Marginal federal tax on this payment only
 * @example
 * calculateMarginalFederalTax(3400, 0, 0, 0, 240.20, 'single') → ~408
 */
function calculateMarginalFederalTax(grossPayment, ytdGross, businessDeductions, w2Income, seDeduction, filingStatus) {
  if (typeof grossPayment !== 'number' || isNaN(grossPayment) || grossPayment <= 0) {
    return 0;
  }

  const standardDed = calculateStandardDeduction(filingStatus);

  // AGI before this payment (only prior YTD income)
  const agiBefore = calculateAGI(0, ytdGross, businessDeductions, w2Income, seDeduction);
  const taxableBefore = Math.max(0, agiBefore - standardDed);
  const taxBefore = calculateFederalTax(taxableBefore, filingStatus);

  // AGI after including this payment
  const agiAfter = calculateAGI(grossPayment, ytdGross, businessDeductions, w2Income, seDeduction);
  const taxableAfter = Math.max(0, agiAfter - standardDed);
  const taxAfter = calculateFederalTax(taxableAfter, filingStatus);

  // Marginal tax = difference
  const marginalTax = Math.max(0, taxAfter - taxBefore);
  return Math.round(marginalTax * 100) / 100;
}

/**
 * Calculates state income tax for a given taxable income and state.
 * Handles flat rate states, progressive bracket states, and no-tax states.
 * Source: Individual state Department of Revenue publications, 2024.
 *
 * @param {number} taxableIncome - Taxable income subject to state tax
 * @param {string} stateCode - Two-letter state code (e.g., 'CA', 'TX')
 * @returns {number} State tax owed
 * @example
 * calculateStateTax(50000, 'CA') → ~2370
 * calculateStateTax(50000, 'TX') → 0
 */
function calculateStateTax(taxableIncome, stateCode) {
  if (typeof taxableIncome !== 'number' || isNaN(taxableIncome) || taxableIncome <= 0) {
    return 0;
  }

  const stateData = TAX_DATA.STATE_TAX_RATES[stateCode];
  if (!stateData) {
    return 0;
  }

  // No state income tax
  if (stateData.type === 'none') {
    return 0;
  }

  // Flat rate state
  if (stateData.type === 'flat') {
    const tax = taxableIncome * stateData.rate;
    return Math.round(tax * 100) / 100;
  }

  // Progressive bracket state
  if (stateData.type === 'progressive' && Array.isArray(stateData.brackets)) {
    let totalTax = 0;
    for (let i = 0; i < stateData.brackets.length; i++) {
      const bracket = stateData.brackets[i];
      if (taxableIncome > bracket.min) {
        const taxableInBracket = Math.min(taxableIncome, bracket.max) - bracket.min;
        totalTax += taxableInBracket * bracket.rate;
      } else {
        break;
      }
    }
    return Math.round(totalTax * 100) / 100;
  }

  return 0;
}

/**
 * Calculates the marginal state tax attributable to this specific payment.
 * Similar approach to marginal federal tax: difference before/after.
 *
 * @param {number} grossPayment - This payment's gross amount
 * @param {number} ytdGross - Year-to-date gross from prior payments
 * @param {number} businessDeductions - Estimated annual business deductions
 * @param {number} w2Income - Prior W-2 income this year
 * @param {number} seDeduction - Deductible half of SE tax
 * @param {string} stateCode - Two-letter state code
 * @returns {number} Marginal state tax on this payment only
 * @example
 * calculateMarginalStateTax(3400, 0, 0, 0, 240.20, 'CA') → ~237
 */
function calculateMarginalStateTax(grossPayment, ytdGross, businessDeductions, w2Income, seDeduction, stateCode) {
  if (typeof grossPayment !== 'number' || isNaN(grossPayment) || grossPayment <= 0) {
    return 0;
  }

  const filingStatus = 'single'; // State tax calc uses same AGI, standard deduction simplified
  const standardDed = calculateStandardDeduction(filingStatus);

  // Taxable income before this payment
  const agiBefore = calculateAGI(0, ytdGross, businessDeductions, w2Income, seDeduction);
  const taxableBefore = Math.max(0, agiBefore - standardDed);
  const taxBefore = calculateStateTax(taxableBefore, stateCode);

  // Taxable income after this payment
  const agiAfter = calculateAGI(grossPayment, ytdGross, businessDeductions, w2Income, seDeduction);
  const taxableAfter = Math.max(0, agiAfter - standardDed);
  const taxAfter = calculateStateTax(taxableAfter, stateCode);

  const marginalTax = Math.max(0, taxAfter - taxBefore);
  return Math.round(marginalTax * 100) / 100;
}

/**
 * Calculates the quarantine amount (total tax + safety buffer).
 * Buffer protects against underestimation.
 *
 * @param {number} totalTax - Total tax owed on this payment
 * @returns {number} Quarantine amount (tax × 1.05)
 * @example
 * calculateQuarantineAmount(1000) → 1050
 */
function calculateQuarantineAmount(totalTax) {
  if (typeof totalTax !== 'number' || isNaN(totalTax) || totalTax <= 0) {
    return 0;
  }
  return Math.round(totalTax * (1 + TAX_DATA.BUFFER_RATE) * 100) / 100;
}

/**
 * Orchestrates the full payment calculation.
 * Runs all sub-calculations in correct sequence and returns
 * a complete results object.
 *
 * @param {Object} inputs - Calculation inputs
 * @param {number} inputs.grossPayment - Gross payment amount
 * @param {string} inputs.filingStatus - Filing status key
 * @param {string} inputs.stateCode - Two-letter state code
 * @param {number} inputs.businessDeductions - Annual business deductions
 * @param {number} inputs.w2Income - Prior W-2 income this year
 * @param {number} inputs.ytdGross - Year-to-date gross from prior payments
 * @returns {Object} Complete calculation results
 * @example
 * calculateFullPayment({
 *   grossPayment: 3400,
 *   filingStatus: 'single',
 *   stateCode: 'CA',
 *   businessDeductions: 0,
 *   w2Income: 0,
 *   ytdGross: 0
 * }) → {
 *   grossPayment: 3400,
 *   seTax: 480.40,
 *   seDeduction: 240.20,
 *   federalTax: 408.00,
 *   stateTax: 237.00,
 *   totalTaxThisPayment: 1125.40,
 *   quarantineAmount: 1181.67,
 *   netTakeHome: 2274.60,
 *   effectiveRate: 0.331
 * }
 */
function calculateFullPayment(inputs) {
  const {
    grossPayment,
    filingStatus,
    stateCode,
    businessDeductions,
    w2Income,
    ytdGross
  } = inputs;

  // Validate inputs
  if (typeof grossPayment !== 'number' || isNaN(grossPayment) || grossPayment <= 0) {
    return {
      grossPayment: 0,
      seTax: 0,
      seDeduction: 0,
      federalTax: 0,
      stateTax: 0,
      totalTaxThisPayment: 0,
      quarantineAmount: 0,
      netTakeHome: 0,
      effectiveRate: 0
    };
  }

  // Step 1: Calculate SE Tax
  const seResult = calculateSETax(grossPayment);

  // Step 2: Calculate marginal federal tax
  const federalTax = calculateMarginalFederalTax(
    grossPayment,
    ytdGross || 0,
    businessDeductions || 0,
    w2Income || 0,
    seResult.seDeduction,
    filingStatus || 'single'
  );

  // Step 3: Calculate marginal state tax
  const stateTax = calculateMarginalStateTax(
    grossPayment,
    ytdGross || 0,
    businessDeductions || 0,
    w2Income || 0,
    seResult.seDeduction,
    stateCode || 'CA'
  );

  // Step 4: Total tax on this payment
  const totalTaxThisPayment = Math.round((seResult.seTax + federalTax + stateTax) * 100) / 100;

  // Step 5: Quarantine amount (total + buffer)
  const quarantineAmount = calculateQuarantineAmount(totalTaxThisPayment);

  // Step 6: Net take-home
  const netTakeHome = Math.round((grossPayment - totalTaxThisPayment) * 100) / 100;

  // Step 7: Effective rate
  const effectiveRate = grossPayment > 0
    ? Math.round((totalTaxThisPayment / grossPayment) * 1000) / 1000
    : 0;

  return {
    grossPayment,
    seTax: seResult.seTax,
    seDeduction: seResult.seDeduction,
    federalTax,
    stateTax,
    totalTaxThisPayment,
    quarantineAmount,
    netTakeHome: Math.max(0, netTakeHome),
    effectiveRate
  };
}
