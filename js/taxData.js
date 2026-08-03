/**
 * QUARANTIN — Tax Data
 * All hardcoded tax data: federal brackets, state rates,
 * standard deductions, SE tax constants, quarterly deadlines.
 * Source: IRS.gov 2024 tax year publications.
 */

const TAX_DATA = {
  /**
   * Self-Employment Tax rate (Social Security 12.4% + Medicare 2.9%)
   * IRS Schedule SE, line 4
   * Source: IRS.gov/pub/irs-pdf/fse.pdf
   */
  SE_RATE: 0.153,

  /**
   * Net SE income factor: SE tax applies to 92.35% of net earnings
   * IRS Publication 334, Chapter 10
   * Source: IRS.gov/pub/irs-pdf/p334.pdf
   */
  SE_NET_FACTOR: 0.9235,

  /**
   * Deductible portion of SE tax (employer-equivalent)
   * IRS Schedule SE, line 6 deduction flows to 1040 Schedule 1
   * Source: IRS.gov/pub/irs-pdf/f1040s1.pdf
   */
  SE_DEDUCTION_FACTOR: 0.50,

  /**
   * Buffer rate added to quarantine amount for safety
   */
  BUFFER_RATE: 0.05,

  /**
   * 2024 Standard Deduction amounts by filing status
   * IRS Revenue Procedure 2023-34
   * Source: IRS.gov/newsroom/irs-provides-2024-tax-brackets
   */
  STANDARD_DEDUCTIONS: {
    single: 14600,
    marriedFilingJointly: 29200,
    headOfHousehold: 21900
  },

  /**
   * 2024 Federal Income Tax Brackets
   * Marginal rates by filing status
   * Source: IRS.gov/newsroom/irs-provides-2024-tax-brackets
   * Each bracket: { min, max, rate, baseTax }
   * baseTax = cumulative tax from all brackets below this one
   */
  FEDERAL_BRACKETS: {
    single: [
      { min: 0, max: 11600, rate: 0.10, baseTax: 0 },
      { min: 11600, max: 47150, rate: 0.12, baseTax: 1160 },
      { min: 47150, max: 100525, rate: 0.22, baseTax: 5426 },
      { min: 100525, max: 191950, rate: 0.24, baseTax: 17168.50 },
      { min: 191950, max: 243725, rate: 0.32, baseTax: 39110.50 },
      { min: 243725, max: 609350, rate: 0.35, baseTax: 55678.50 },
      { min: 609350, max: Infinity, rate: 0.37, baseTax: 183647.25 }
    ],
    marriedFilingJointly: [
      { min: 0, max: 23200, rate: 0.10, baseTax: 0 },
      { min: 23200, max: 94300, rate: 0.12, baseTax: 2320 },
      { min: 94300, max: 201050, rate: 0.22, baseTax: 10852 },
      { min: 201050, max: 383900, rate: 0.24, baseTax: 34317 },
      { min: 383900, max: 487450, rate: 0.32, baseTax: 78221 },
      { min: 487450, max: 731200, rate: 0.35, baseTax: 111357 },
      { min: 731200, max: Infinity, rate: 0.37, baseTax: 196619.50 }
    ],
    headOfHousehold: [
      { min: 0, max: 16550, rate: 0.10, baseTax: 0 },
      { min: 16550, max: 63100, rate: 0.12, baseTax: 1655 },
      { min: 63100, max: 100500, rate: 0.22, baseTax: 7241 },
      { min: 100500, max: 191950, rate: 0.24, baseTax: 15469 },
      { min: 191950, max: 243700, rate: 0.32, baseTax: 37417 },
      { min: 243700, max: 609350, rate: 0.35, baseTax: 53977 },
      { min: 609350, max: Infinity, rate: 0.37, baseTax: 181954.50 }
    ]
  },

  /**
   * 2024 IRS Quarterly Estimated Tax Payment Deadlines
   * Form 1040-ES due dates
   * Source: IRS.gov/businesses/small-businesses-self-employed/estimated-taxes
   * Note: When a due date falls on weekend/holiday, it moves to next business day.
   * Q1: Jan 1 – Mar 31 → due April 15
   * Q2: Apr 1 – May 31 → due June 17 (June 15 is Saturday in 2024)
   * Q3: Jun 1 – Aug 31 → due Sept 16 (Sept 15 is Sunday in 2024)
   * Q4: Sep 1 – Dec 31 → due Jan 15 (next year)
   */
  QUARTERLY_DEADLINES: [
    { period: 'Q1', due: '2024-04-15', year: 2024 },
    { period: 'Q2', due: '2024-06-17', year: 2024 },
    { period: 'Q3', due: '2024-09-16', year: 2024 },
    { period: 'Q4', due: '2025-01-15', year: 2024 },
    { period: 'Q1', due: '2025-04-15', year: 2025 },
    { period: 'Q2', due: '2025-06-16', year: 2025 },
    { period: 'Q3', due: '2025-09-15', year: 2025 },
    { period: 'Q4', due: '2026-01-15', year: 2025 },
    { period: 'Q1', due: '2026-04-15', year: 2026 },
    { period: 'Q2', due: '2026-06-15', year: 2026 },
    { period: 'Q3', due: '2026-09-15', year: 2026 },
    { period: 'Q4', due: '2027-01-15', year: 2026 },
    { period: 'Q1', due: '2027-04-15', year: 2027 },
    { period: 'Q2', due: '2027-06-15', year: 2027 },
    { period: 'Q3', due: '2027-09-15', year: 2027 },
    { period: 'Q4', due: '2028-01-15', year: 2027 }
  ],

  /**
   * State income tax data for all 50 states + DC.
   * type: 'flat' = single rate applied to all taxable income
   * type: 'progressive' = marginal brackets like federal
   * type: 'none' = no state income tax
   * Sources: Individual state Department of Revenue websites, 2024 rates.
   */
  STATE_TAX_RATES: {
    AL: { name: 'Alabama', code: 'AL', type: 'progressive', brackets: [
      { min: 0, max: 500, rate: 0.02 },
      { min: 500, max: 3000, rate: 0.04 },
      { min: 3000, max: Infinity, rate: 0.05 }
    ]},
    AK: { name: 'Alaska', code: 'AK', type: 'none', rate: 0 },
    AZ: { name: 'Arizona', code: 'AZ', type: 'flat', rate: 0.025 },
    AR: { name: 'Arkansas', code: 'AR', type: 'progressive', brackets: [
      { min: 0, max: 4600, rate: 0.02 },
      { min: 4600, max: 9200, rate: 0.04 },
      { min: 9200, max: Infinity, rate: 0.044 }
    ]},
    CA: { name: 'California', code: 'CA', type: 'progressive', brackets: [
      { min: 0, max: 10412, rate: 0.01 },
      { min: 10412, max: 24684, rate: 0.02 },
      { min: 24684, max: 38959, rate: 0.04 },
      { min: 38959, max: 54081, rate: 0.06 },
      { min: 54081, max: 68350, rate: 0.08 },
      { min: 68350, max: 349137, rate: 0.093 },
      { min: 349137, max: 418961, rate: 0.103 },
      { min: 418961, max: 698271, rate: 0.113 },
      { min: 698271, max: 1000000, rate: 0.123 },
      { min: 1000000, max: Infinity, rate: 0.133 }
    ]},
    CO: { name: 'Colorado', code: 'CO', type: 'flat', rate: 0.044 },
    CT: { name: 'Connecticut', code: 'CT', type: 'progressive', brackets: [
      { min: 0, max: 10000, rate: 0.03 },
      { min: 10000, max: 50000, rate: 0.05 },
      { min: 50000, max: 100000, rate: 0.055 },
      { min: 100000, max: 200000, rate: 0.06 },
      { min: 200000, max: 250000, rate: 0.065 },
      { min: 250000, max: 500000, rate: 0.069 },
      { min: 500000, max: Infinity, rate: 0.0699 }
    ]},
    DE: { name: 'Delaware', code: 'DE', type: 'progressive', brackets: [
      { min: 0, max: 5000, rate: 0.0 },
      { min: 5000, max: 10000, rate: 0.032 },
      { min: 10000, max: 20000, rate: 0.036 },
      { min: 20000, max: 25000, rate: 0.039 },
      { min: 25000, max: 60000, rate: 0.043 },
      { min: 60000, max: Infinity, rate: 0.066 }
    ]},
    DC: { name: 'District of Columbia', code: 'DC', type: 'progressive', brackets: [
      { min: 0, max: 10000, rate: 0.04 },
      { min: 10000, max: 40000, rate: 0.06 },
      { min: 40000, max: 60000, rate: 0.065 },
      { min: 60000, max: 250000, rate: 0.085 },
      { min: 250000, max: 500000, rate: 0.0925 },
      { min: 500000, max: 1000000, rate: 0.0975 },
      { min: 1000000, max: Infinity, rate: 0.1075 }
    ]},
    FL: { name: 'Florida', code: 'FL', type: 'none', rate: 0 },
    GA: { name: 'Georgia', code: 'GA', type: 'flat', rate: 0.0539 },
    HI: { name: 'Hawaii', code: 'HI', type: 'progressive', brackets: [
      { min: 0, max: 2400, rate: 0.014 },
      { min: 2400, max: 4800, rate: 0.032 },
      { min: 4800, max: 9600, rate: 0.055 },
      { min: 9600, max: 19200, rate: 0.064 },
      { min: 19200, max: 48000, rate: 0.068 },
      { min: 48000, max: 200000, rate: 0.072 },
      { min: 200000, max: 300000, rate: 0.076 },
      { min: 300000, max: Infinity, rate: 0.079 }
    ]},
    ID: { name: 'Idaho', code: 'ID', type: 'flat', rate: 0.058 },
    IL: { name: 'Illinois', code: 'IL', type: 'flat', rate: 0.0495 },
    IN: { name: 'Indiana', code: 'IN', type: 'flat', rate: 0.0305 },
    IA: { name: 'Iowa', code: 'IA', type: 'progressive', brackets: [
      { min: 0, max: 6210, rate: 0.044 },
      { min: 6210, max: 31050, rate: 0.0482 },
      { min: 31050, max: Infinity, rate: 0.057 }
    ]},
    KS: { name: 'Kansas', code: 'KS', type: 'progressive', brackets: [
      { min: 0, max: 15000, rate: 0.031 },
      { min: 15000, max: 30000, rate: 0.0525 },
      { min: 30000, max: Infinity, rate: 0.057 }
    ]},
    KY: { name: 'Kentucky', code: 'KY', type: 'flat', rate: 0.04 },
    LA: { name: 'Louisiana', code: 'LA', type: 'progressive', brackets: [
      { min: 0, max: 12500, rate: 0.0185 },
      { min: 12500, max: 50000, rate: 0.035 },
      { min: 50000, max: Infinity, rate: 0.0425 }
    ]},
    ME: { name: 'Maine', code: 'ME', type: 'progressive', brackets: [
      { min: 0, max: 26050, rate: 0.058 },
      { min: 26050, max: 61600, rate: 0.0675 },
      { min: 61600, max: Infinity, rate: 0.0715 }
    ]},
    MD: { name: 'Maryland', code: 'MD', type: 'progressive', brackets: [
      { min: 0, max: 1000, rate: 0.02 },
      { min: 1000, max: 2000, rate: 0.03 },
      { min: 2000, max: 3000, rate: 0.04 },
      { min: 3000, max: 100000, rate: 0.0475 },
      { min: 100000, max: 125000, rate: 0.05 },
      { min: 125000, max: 150000, rate: 0.0525 },
      { min: 150000, max: 250000, rate: 0.055 },
      { min: 250000, max: Infinity, rate: 0.0575 }
    ]},
    MA: { name: 'Massachusetts', code: 'MA', type: 'flat', rate: 0.05 },
    MI: { name: 'Michigan', code: 'MI', type: 'flat', rate: 0.0425 },
    MN: { name: 'Minnesota', code: 'MN', type: 'progressive', brackets: [
      { min: 0, max: 31690, rate: 0.0535 },
      { min: 31690, max: 104090, rate: 0.068 },
      { min: 104090, max: 193240, rate: 0.0785 },
      { min: 193240, max: Infinity, rate: 0.0985 }
    ]},
    MS: { name: 'Mississippi', code: 'MS', type: 'flat', rate: 0.047 },
    MO: { name: 'Missouri', code: 'MO', type: 'progressive', brackets: [
      { min: 0, max: 1273, rate: 0.02 },
      { min: 1273, max: 2546, rate: 0.025 },
      { min: 2546, max: 3819, rate: 0.03 },
      { min: 3819, max: 5092, rate: 0.035 },
      { min: 5092, max: 6365, rate: 0.04 },
      { min: 6365, max: 7638, rate: 0.045 },
      { min: 7638, max: 8911, rate: 0.048 },
      { min: 8911, max: Infinity, rate: 0.0495 }
    ]},
    MT: { name: 'Montana', code: 'MT', type: 'progressive', brackets: [
      { min: 0, max: 20500, rate: 0.047 },
      { min: 20500, max: Infinity, rate: 0.059 }
    ]},
    NE: { name: 'Nebraska', code: 'NE', type: 'progressive', brackets: [
      { min: 0, max: 3700, rate: 0.0246 },
      { min: 3700, max: 22170, rate: 0.0351 },
      { min: 22170, max: 35730, rate: 0.0501 },
      { min: 35730, max: Infinity, rate: 0.0584 }
    ]},
    NV: { name: 'Nevada', code: 'NV', type: 'none', rate: 0 },
    NH: { name: 'New Hampshire', code: 'NH', type: 'none', rate: 0 },
    NJ: { name: 'New Jersey', code: 'NJ', type: 'progressive', brackets: [
      { min: 0, max: 20000, rate: 0.014 },
      { min: 20000, max: 35000, rate: 0.0175 },
      { min: 35000, max: 40000, rate: 0.035 },
      { min: 40000, max: 75000, rate: 0.05525 },
      { min: 75000, max: 500000, rate: 0.0637 },
      { min: 500000, max: 1000000, rate: 0.0897 },
      { min: 1000000, max: Infinity, rate: 0.1075 }
    ]},
    NM: { name: 'New Mexico', code: 'NM', type: 'progressive', brackets: [
      { min: 0, max: 5500, rate: 0.017 },
      { min: 5500, max: 11000, rate: 0.032 },
      { min: 11000, max: 16000, rate: 0.047 },
      { min: 16000, max: 210000, rate: 0.049 },
      { min: 210000, max: Infinity, rate: 0.059 }
    ]},
    NY: { name: 'New York', code: 'NY', type: 'progressive', brackets: [
      { min: 0, max: 8500, rate: 0.04 },
      { min: 8500, max: 11700, rate: 0.045 },
      { min: 11700, max: 13900, rate: 0.0525 },
      { min: 13900, max: 80650, rate: 0.055 },
      { min: 80650, max: 215400, rate: 0.06 },
      { min: 215400, max: 1077550, rate: 0.0685 },
      { min: 1077550, max: 5000000, rate: 0.0965 },
      { min: 5000000, max: 25000000, rate: 0.103 },
      { min: 25000000, max: Infinity, rate: 0.109 }
    ]},
    NC: { name: 'North Carolina', code: 'NC', type: 'flat', rate: 0.045 },
    ND: { name: 'North Dakota', code: 'ND', type: 'progressive', brackets: [
      { min: 0, max: 44725, rate: 0.025 },
      { min: 44725, max: 225975, rate: 0.0285 },
      { min: 225975, max: Infinity, rate: 0.03 }
    ]},
    OH: { name: 'Ohio', code: 'OH', type: 'progressive', brackets: [
      { min: 0, max: 26050, rate: 0.0 },
      { min: 26050, max: 100000, rate: 0.0275 },
      { min: 100000, max: Infinity, rate: 0.035 }
    ]},
    OK: { name: 'Oklahoma', code: 'OK', type: 'progressive', brackets: [
      { min: 0, max: 1000, rate: 0.0025 },
      { min: 1000, max: 2500, rate: 0.0075 },
      { min: 2500, max: 3750, rate: 0.0175 },
      { min: 3750, max: 4900, rate: 0.0275 },
      { min: 4900, max: 7200, rate: 0.0375 },
      { min: 7200, max: Infinity, rate: 0.0475 }
    ]},
    OR: { name: 'Oregon', code: 'OR', type: 'progressive', brackets: [
      { min: 0, max: 4300, rate: 0.0475 },
      { min: 4300, max: 10750, rate: 0.0675 },
      { min: 10750, max: 125000, rate: 0.0875 },
      { min: 125000, max: Infinity, rate: 0.099 }
    ]},
    PA: { name: 'Pennsylvania', code: 'PA', type: 'flat', rate: 0.0307 },
    RI: { name: 'Rhode Island', code: 'RI', type: 'progressive', brackets: [
      { min: 0, max: 77450, rate: 0.0375 },
      { min: 77450, max: 176050, rate: 0.0475 },
      { min: 176050, max: Infinity, rate: 0.0599 }
    ]},
    SC: { name: 'South Carolina', code: 'SC', type: 'progressive', brackets: [
      { min: 0, max: 3460, rate: 0.0 },
      { min: 3460, max: 17330, rate: 0.03 },
      { min: 17330, max: Infinity, rate: 0.065 }
    ]},
    SD: { name: 'South Dakota', code: 'SD', type: 'none', rate: 0 },
    TN: { name: 'Tennessee', code: 'TN', type: 'none', rate: 0 },
    TX: { name: 'Texas', code: 'TX', type: 'none', rate: 0 },
    UT: { name: 'Utah', code: 'UT', type: 'flat', rate: 0.0465 },
    VT: { name: 'Vermont', code: 'VT', type: 'progressive', brackets: [
      { min: 0, max: 45400, rate: 0.0335 },
      { min: 45400, max: 110050, rate: 0.066 },
      { min: 110050, max: 171600, rate: 0.076 },
      { min: 171600, max: Infinity, rate: 0.0875 }
    ]},
    VA: { name: 'Virginia', code: 'VA', type: 'progressive', brackets: [
      { min: 0, max: 3000, rate: 0.02 },
      { min: 3000, max: 5000, rate: 0.03 },
      { min: 5000, max: 17000, rate: 0.05 },
      { min: 17000, max: Infinity, rate: 0.0575 }
    ]},
    WA: { name: 'Washington', code: 'WA', type: 'none', rate: 0 },
    WV: { name: 'West Virginia', code: 'WV', type: 'progressive', brackets: [
      { min: 0, max: 10000, rate: 0.0236 },
      { min: 10000, max: 25000, rate: 0.0288 },
      { min: 25000, max: 40000, rate: 0.0336 },
      { min: 40000, max: 60000, rate: 0.0384 },
      { min: 60000, max: Infinity, rate: 0.048 }
    ]},
    WI: { name: 'Wisconsin', code: 'WI', type: 'progressive', brackets: [
      { min: 0, max: 14320, rate: 0.035 },
      { min: 14320, max: 28640, rate: 0.044 },
      { min: 28640, max: 315310, rate: 0.053 },
      { min: 315310, max: Infinity, rate: 0.0765 }
    ]},
    WY: { name: 'Wyoming', code: 'WY', type: 'none', rate: 0 }
  },

  /**
   * Returns a sorted array of state objects for dropdown rendering.
   * @returns {Array<{name: string, code: string}>} Sorted state list
   */
  getStatesList() {
    return Object.values(this.STATE_TAX_RATES)
      .map(({ name, code }) => ({ name, code }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }
};
