// ========================================
// TAX ENGINE
// Federal + state tax estimation
// Roth vs Pretax recommendation logic
// ========================================

// ----------------------------------------
// 2026 federal brackets (estimated structure)
// single and married filing jointly
// ----------------------------------------

export const FEDERAL_BRACKETS_2026 = {
    single: [
        { upTo: 11925, rate: 0.10 },
        { upTo: 48475, rate: 0.12 },
        { upTo: 103350, rate: 0.22 },
        { upTo: 197300, rate: 0.24 },
        { upTo: 250525, rate: 0.32 },
        { upTo: 626350, rate: 0.35 },
        { upTo: Infinity, rate: 0.37 }
    ],
    married: [
        { upTo: 23850, rate: 0.10 },
        { upTo: 96950, rate: 0.12 },
        { upTo: 206700, rate: 0.22 },
        { upTo: 394600, rate: 0.24 },
        { upTo: 501050, rate: 0.32 },
        { upTo: 751600, rate: 0.35 },
        { upTo: Infinity, rate: 0.37 }
    ]
}

export const STANDARD_DEDUCTION_2026 = {
    single: 15500,
    married: 31000
}

// ----------------------------------------
// State tax profiles
// type:
//  - flat
//  - progressive
//  - none
// ----------------------------------------

export const STATE_TAX_DATA = {
    "AL": {
        name: "Alabama",
        type: "progressive",
        bracketsSingle: [
            { upTo: 500, rate: 0.02 },
            { upTo: 3000, rate: 0.04 },
            { upTo: Infinity, rate: 0.05 }
        ],
        bracketsMarried: [
            { upTo: 1000, rate: 0.02 },
            { upTo: 6000, rate: 0.04 },
            { upTo: Infinity, rate: 0.05 }
        ]
    },
    "AK": { name: "Alaska", type: "none" },
    "AZ": { name: "Arizona", type: "flat", rate: 0.025 },
    "AR": {
        name: "Arkansas",
        type: "progressive",
        bracketsSingle: [
            { upTo: 4300, rate: 0.02 },
            { upTo: 8500, rate: 0.04 },
            { upTo: Infinity, rate: 0.049 }
        ],
        bracketsMarried: [
            { upTo: 4300, rate: 0.02 },
            { upTo: 8500, rate: 0.04 },
            { upTo: Infinity, rate: 0.049 }
        ]
    },
    "CA": {
        name: "California",
        type: "progressive",
        bracketsSingle: [
            { upTo: 10756, rate: 0.01 },
            { upTo: 25499, rate: 0.02 },
            { upTo: 40245, rate: 0.04 },
            { upTo: 55866, rate: 0.06 },
            { upTo: 70606, rate: 0.08 },
            { upTo: 360659, rate: 0.093 },
            { upTo: 432787, rate: 0.103 },
            { upTo: 721314, rate: 0.113 },
            { upTo: Infinity, rate: 0.123 }
        ],
        bracketsMarried: [
            { upTo: 21512, rate: 0.01 },
            { upTo: 50998, rate: 0.02 },
            { upTo: 80490, rate: 0.04 },
            { upTo: 111732, rate: 0.06 },
            { upTo: 141212, rate: 0.08 },
            { upTo: 721318, rate: 0.093 },
            { upTo: 865574, rate: 0.103 },
            { upTo: 1442628, rate: 0.113 },
            { upTo: Infinity, rate: 0.123 }
        ]
    },
    "CO": { name: "Colorado", type: "flat", rate: 0.044 },
    "CT": {
        name: "Connecticut",
        type: "progressive",
        bracketsSingle: [
            { upTo: 10000, rate: 0.02 },
            { upTo: 50000, rate: 0.045 },
            { upTo: 100000, rate: 0.055 },
            { upTo: 200000, rate: 0.06 },
            { upTo: 250000, rate: 0.065 },
            { upTo: 500000, rate: 0.069 },
            { upTo: Infinity, rate: 0.0699 }
        ],
        bracketsMarried: [
            { upTo: 20000, rate: 0.02 },
            { upTo: 100000, rate: 0.045 },
            { upTo: 200000, rate: 0.055 },
            { upTo: 400000, rate: 0.06 },
            { upTo: 500000, rate: 0.065 },
            { upTo: 1000000, rate: 0.069 },
            { upTo: Infinity, rate: 0.0699 }
        ]
    },
    "DE": {
        name: "Delaware",
        type: "progressive",
        bracketsSingle: [
            { upTo: 2000, rate: 0.022 },
            { upTo: 5000, rate: 0.039 },
            { upTo: 10000, rate: 0.048 },
            { upTo: 20000, rate: 0.052 },
            { upTo: 25000, rate: 0.0555 },
            { upTo: 60000, rate: 0.066 },
            { upTo: Infinity, rate: 0.066 }
        ],
        bracketsMarried: [
            { upTo: 2000, rate: 0.022 },
            { upTo: 5000, rate: 0.039 },
            { upTo: 10000, rate: 0.048 },
            { upTo: 20000, rate: 0.052 },
            { upTo: 25000, rate: 0.0555 },
            { upTo: 60000, rate: 0.066 },
            { upTo: Infinity, rate: 0.066 }
        ]
    },
    "FL": { name: "Florida", type: "none" },
    "GA": { name: "Georgia", type: "flat", rate: 0.0539 },
    "HI": {
        name: "Hawaii",
        type: "progressive",
        bracketsSingle: [
            { upTo: 2400, rate: 0.014 },
            { upTo: 4800, rate: 0.032 },
            { upTo: 9600, rate: 0.055 },
            { upTo: 14400, rate: 0.064 },
            { upTo: 19200, rate: 0.068 },
            { upTo: 24000, rate: 0.072 },
            { upTo: 36000, rate: 0.076 },
            { upTo: 48000, rate: 0.079 },
            { upTo: 150000, rate: 0.0825 },
            { upTo: 175000, rate: 0.09 },
            { upTo: 200000, rate: 0.10 },
            { upTo: Infinity, rate: 0.11 }
        ],
        bracketsMarried: [
            { upTo: 4800, rate: 0.014 },
            { upTo: 9600, rate: 0.032 },
            { upTo: 19200, rate: 0.055 },
            { upTo: 28800, rate: 0.064 },
            { upTo: 38400, rate: 0.068 },
            { upTo: 48000, rate: 0.072 },
            { upTo: 72000, rate: 0.076 },
            { upTo: 96000, rate: 0.079 },
            { upTo: 300000, rate: 0.0825 },
            { upTo: 350000, rate: 0.09 },
            { upTo: 400000, rate: 0.10 },
            { upTo: Infinity, rate: 0.11 }
        ]
    },
    "ID": { name: "Idaho", type: "flat", rate: 0.058 },
    "IL": { name: "Illinois", type: "flat", rate: 0.0495 },
    "IN": { name: "Indiana", type: "flat", rate: 0.0305 },
    "IA": { name: "Iowa", type: "flat", rate: 0.039 },
    "KS": {
        name: "Kansas",
        type: "progressive",
        bracketsSingle: [
            { upTo: 15000, rate: 0.031 },
            { upTo: 30000, rate: 0.0525 },
            { upTo: Infinity, rate: 0.057 }
        ],
        bracketsMarried: [
            { upTo: 30000, rate: 0.031 },
            { upTo: 60000, rate: 0.0525 },
            { upTo: Infinity, rate: 0.057 }
        ]
    },
    "KY": { name: "Kentucky", type: "flat", rate: 0.04 },
    "LA": { name: "Louisiana", type: "flat", rate: 0.03 },
    "ME": {
        name: "Maine",
        type: "progressive",
        bracketsSingle: [
            { upTo: 26050, rate: 0.058 },
            { upTo: 61600, rate: 0.0675 },
            { upTo: Infinity, rate: 0.0715 }
        ],
        bracketsMarried: [
            { upTo: 52100, rate: 0.058 },
            { upTo: 123250, rate: 0.0675 },
            { upTo: Infinity, rate: 0.0715 }
        ]
    },
    "MD": { name: "Maryland", type: "flat", rate: 0.0475 },
    "MA": { name: "Massachusetts", type: "flat", rate: 0.05 },
    "MI": { name: "Michigan", type: "flat", rate: 0.0425 },
    "MN": {
        name: "Minnesota",
        type: "progressive",
        bracketsSingle: [
            { upTo: 31960, rate: 0.0535 },
            { upTo: 104090, rate: 0.068 },
            { upTo: 193240, rate: 0.0785 },
            { upTo: Infinity, rate: 0.0985 }
        ],
        bracketsMarried: [
            { upTo: 46770, rate: 0.0535 },
            { upTo: 186040, rate: 0.068 },
            { upTo: 321450, rate: 0.0785 },
            { upTo: Infinity, rate: 0.0985 }
        ]
    },
    "MS": { name: "Mississippi", type: "flat", rate: 0.047 },
    "MO": { name: "Missouri", type: "flat", rate: 0.047 },
    "MT": {
        name: "Montana",
        type: "progressive",
        bracketsSingle: [
            { upTo: 20500, rate: 0.047 },
            { upTo: Infinity, rate: 0.059 }
        ],
        bracketsMarried: [
            { upTo: 41000, rate: 0.047 },
            { upTo: Infinity, rate: 0.059 }
        ]
    },
    "NE": {
        name: "Nebraska",
        type: "progressive",
        bracketsSingle: [
            { upTo: 3920, rate: 0.0246 },
            { upTo: 23410, rate: 0.0351 },
            { upTo: 37780, rate: 0.0501 },
            { upTo: Infinity, rate: 0.0584 }
        ],
        bracketsMarried: [
            { upTo: 7840, rate: 0.0246 },
            { upTo: 46820, rate: 0.0351 },
            { upTo: 75560, rate: 0.0501 },
            { upTo: Infinity, rate: 0.0584 }
        ]
    },
    "NV": { name: "Nevada", type: "none" },
    "NH": { name: "New Hampshire", type: "none" },
    "NJ": {
        name: "New Jersey",
        type: "progressive",
        bracketsSingle: [
            { upTo: 20000, rate: 0.014 },
            { upTo: 35000, rate: 0.0175 },
            { upTo: 40000, rate: 0.035 },
            { upTo: 75000, rate: 0.05525 },
            { upTo: 500000, rate: 0.0637 },
            { upTo: 1000000, rate: 0.0897 },
            { upTo: Infinity, rate: 0.1075 }
        ],
        bracketsMarried: [
            { upTo: 20000, rate: 0.014 },
            { upTo: 50000, rate: 0.0175 },
            { upTo: 70000, rate: 0.0245 },
            { upTo: 80000, rate: 0.035 },
            { upTo: 150000, rate: 0.05525 },
            { upTo: 500000, rate: 0.0637 },
            { upTo: 1000000, rate: 0.0897 },
            { upTo: Infinity, rate: 0.1075 }
        ]
    },
    "NM": {
        name: "New Mexico",
        type: "progressive",
        bracketsSingle: [
            { upTo: 5500, rate: 0.017 },
            { upTo: 11000, rate: 0.032 },
            { upTo: 16000, rate: 0.047 },
            { upTo: 210000, rate: 0.049 },
            { upTo: Infinity, rate: 0.059 }
        ],
        bracketsMarried: [
            { upTo: 8000, rate: 0.017 },
            { upTo: 16000, rate: 0.032 },
            { upTo: 24000, rate: 0.047 },
            { upTo: 315000, rate: 0.049 },
            { upTo: Infinity, rate: 0.059 }
        ]
    },
    "NY": {
        name: "New York",
        type: "progressive",
        bracketsSingle: [
            { upTo: 8500, rate: 0.04 },
            { upTo: 11700, rate: 0.045 },
            { upTo: 13900, rate: 0.0525 },
            { upTo: 80650, rate: 0.055 },
            { upTo: 215400, rate: 0.06 },
            { upTo: 1077550, rate: 0.0685 },
            { upTo: 5000000, rate: 0.0965 },
            { upTo: 25000000, rate: 0.103 },
            { upTo: Infinity, rate: 0.109 }
        ],
        bracketsMarried: [
            { upTo: 17150, rate: 0.04 },
            { upTo: 23600, rate: 0.045 },
            { upTo: 27900, rate: 0.0525 },
            { upTo: 161550, rate: 0.055 },
            { upTo: 323200, rate: 0.06 },
            { upTo: 2155350, rate: 0.0685 },
            { upTo: 5000000, rate: 0.0965 },
            { upTo: 25000000, rate: 0.103 },
            { upTo: Infinity, rate: 0.109 }
        ]
    },
    "NC": { name: "North Carolina", type: "flat", rate: 0.0425 },
    "ND": {
        name: "North Dakota",
        type: "progressive",
        bracketsSingle: [
            { upTo: 47925, rate: 0.0 },
            { upTo: 116775, rate: 0.011 },
            { upTo: 243725, rate: 0.0204 },
            { upTo: Infinity, rate: 0.025 }
        ],
        bracketsMarried: [
            { upTo: 79800, rate: 0.0 },
            { upTo: 194275, rate: 0.011 },
            { upTo: 296425, rate: 0.0204 },
            { upTo: Infinity, rate: 0.025 }
        ]
    },
    "OH": {
        name: "Ohio",
        type: "progressive",
        bracketsSingle: [
            { upTo: 26050, rate: 0.0 },
            { upTo: 100000, rate: 0.0275 },
            { upTo: Infinity, rate: 0.035 }
        ],
        bracketsMarried: [
            { upTo: 26050, rate: 0.0 },
            { upTo: 100000, rate: 0.0275 },
            { upTo: Infinity, rate: 0.035 }
        ]
    },
    "OK": {
        name: "Oklahoma",
        type: "progressive",
        bracketsSingle: [
            { upTo: 1000, rate: 0.0025 },
            { upTo: 2500, rate: 0.0075 },
            { upTo: 3750, rate: 0.0175 },
            { upTo: 4900, rate: 0.0275 },
            { upTo: 7200, rate: 0.0375 },
            { upTo: Infinity, rate: 0.0475 }
        ],
        bracketsMarried: [
            { upTo: 2000, rate: 0.0025 },
            { upTo: 5000, rate: 0.0075 },
            { upTo: 7500, rate: 0.0175 },
            { upTo: 9800, rate: 0.0275 },
            { upTo: 12200, rate: 0.0375 },
            { upTo: Infinity, rate: 0.0475 }
        ]
    },
    "OR": {
        name: "Oregon",
        type: "progressive",
        bracketsSingle: [
            { upTo: 4300, rate: 0.0475 },
            { upTo: 10750, rate: 0.0675 },
            { upTo: 125000, rate: 0.0875 },
            { upTo: Infinity, rate: 0.099 }
        ],
        bracketsMarried: [
            { upTo: 8600, rate: 0.0475 },
            { upTo: 21500, rate: 0.0675 },
            { upTo: 250000, rate: 0.0875 },
            { upTo: Infinity, rate: 0.099 }
        ]
    },
    "PA": { name: "Pennsylvania", type: "flat", rate: 0.0307 },
    "RI": {
        name: "Rhode Island",
        type: "progressive",
        bracketsSingle: [
            { upTo: 77450, rate: 0.0375 },
            { upTo: 176050, rate: 0.0475 },
            { upTo: Infinity, rate: 0.0599 }
        ],
        bracketsMarried: [
            { upTo: 77450, rate: 0.0375 },
            { upTo: 176050, rate: 0.0475 },
            { upTo: Infinity, rate: 0.0599 }
        ]
    },
    "SC": {
        name: "South Carolina",
        type: "flat",
        rate: 0.062
    },
    "SD": { name: "South Dakota", type: "none" },
    "TN": { name: "Tennessee", type: "none" },
    "TX": { name: "Texas", type: "none" },
    "UT": { name: "Utah", type: "flat", rate: 0.0485 },
    "VT": {
        name: "Vermont",
        type: "progressive",
        bracketsSingle: [
            { upTo: 45400, rate: 0.0335 },
            { upTo: 110050, rate: 0.066 },
            { upTo: 229550, rate: 0.076 },
            { upTo: Infinity, rate: 0.0875 }
        ],
        bracketsMarried: [
            { upTo: 75850, rate: 0.0335 },
            { upTo: 184700, rate: 0.066 },
            { upTo: 280350, rate: 0.076 },
            { upTo: Infinity, rate: 0.0875 }
        ]
    },
    "VA": {
        name: "Virginia",
        type: "progressive",
        bracketsSingle: [
            { upTo: 3000, rate: 0.02 },
            { upTo: 5000, rate: 0.03 },
            { upTo: 17000, rate: 0.05 },
            { upTo: Infinity, rate: 0.0575 }
        ],
        bracketsMarried: [
            { upTo: 3000, rate: 0.02 },
            { upTo: 5000, rate: 0.03 },
            { upTo: 17000, rate: 0.05 },
            { upTo: Infinity, rate: 0.0575 }
        ]
    },
    "WA": { name: "Washington", type: "none" },
    "WV": {
        name: "West Virginia",
        type: "progressive",
        bracketsSingle: [
            { upTo: 10000, rate: 0.0236 },
            { upTo: 25000, rate: 0.0315 },
            { upTo: 40000, rate: 0.0354 },
            { upTo: 60000, rate: 0.0472 },
            { upTo: Infinity, rate: 0.0512 }
        ],
        bracketsMarried: [
            { upTo: 10000, rate: 0.0236 },
            { upTo: 25000, rate: 0.0315 },
            { upTo: 40000, rate: 0.0354 },
            { upTo: 60000, rate: 0.0472 },
            { upTo: Infinity, rate: 0.0512 }
        ]
    },
    "WI": {
        name: "Wisconsin",
        type: "progressive",
        bracketsSingle: [
            { upTo: 14320, rate: 0.035 },
            { upTo: 28640, rate: 0.044 },
            { upTo: 315310, rate: 0.053 },
            { upTo: Infinity, rate: 0.0765 }
        ],
        bracketsMarried: [
            { upTo: 19090, rate: 0.035 },
            { upTo: 38190, rate: 0.044 },
            { upTo: 420420, rate: 0.053 },
            { upTo: Infinity, rate: 0.0765 }
        ]
    },
    "WY": { name: "Wyoming", type: "none" },
    "DC": {
        name: "District of Columbia",
        type: "progressive",
        bracketsSingle: [
            { upTo: 10000, rate: 0.04 },
            { upTo: 40000, rate: 0.06 },
            { upTo: 60000, rate: 0.065 },
            { upTo: 250000, rate: 0.085 },
            { upTo: 500000, rate: 0.0925 },
            { upTo: 1000000, rate: 0.0975 },
            { upTo: Infinity, rate: 0.1075 }
        ],
        bracketsMarried: [
            { upTo: 10000, rate: 0.04 },
            { upTo: 40000, rate: 0.06 },
            { upTo: 60000, rate: 0.065 },
            { upTo: 250000, rate: 0.085 },
            { upTo: 500000, rate: 0.0925 },
            { upTo: 1000000, rate: 0.0975 },
            { upTo: Infinity, rate: 0.1075 }
        ]
    }
}

// ----------------------------------------
// helpers
// ----------------------------------------

export function clampNumber(value) {
    const n = Number(value)
    return Number.isFinite(n) ? n : 0
}

export function normalizeFilingStatus(filingStatus) {
    return filingStatus === "married" ? "married" : "single"
}

export function getStateName(code) {
    return STATE_TAX_DATA[code]?.name || code || "Unknown"
}

export function listStateOptions() {
    return Object.keys(STATE_TAX_DATA)
        .sort((a, b) => STATE_TAX_DATA[a].name.localeCompare(STATE_TAX_DATA[b].name))
        .map(code => ({
            code,
            name: STATE_TAX_DATA[code].name
        }))
}

// ----------------------------------------
// generic progressive tax calculator
// ----------------------------------------

export function calculateProgressiveTax(income, brackets) {
    let remaining = Math.max(0, clampNumber(income))
    let previousLimit = 0
    let tax = 0

    for (const bracket of brackets) {
        const currentLimit = bracket.upTo
        const taxableInBracket = Math.min(remaining, currentLimit - previousLimit)

        if (taxableInBracket > 0) {
            tax += taxableInBracket * bracket.rate
            remaining -= taxableInBracket
        }

        previousLimit = currentLimit

        if (remaining <= 0) break
    }

    return Math.max(0, tax)
}

// ----------------------------------------
// federal tax calculation
// ----------------------------------------

export function calculateFederalTax({
    grossIncome = 0,
    filingStatus = "single",
    deductions = 0,
    useStandardDeduction = true
} = {}) {
    const status = normalizeFilingStatus(filingStatus)
    const standardDeduction = STANDARD_DEDUCTION_2026[status]
    const chosenDeductions = useStandardDeduction
        ? standardDeduction
        : clampNumber(deductions)

    const taxableIncome = Math.max(0, clampNumber(grossIncome) - chosenDeductions)
    const brackets = FEDERAL_BRACKETS_2026[status]
    const tax = calculateProgressiveTax(taxableIncome, brackets)
    const effectiveRate = grossIncome > 0 ? tax / grossIncome : 0
    const marginalRate = getFederalMarginalRate(taxableIncome, status)

    return {
        grossIncome: clampNumber(grossIncome),
        taxableIncome,
        standardDeduction,
        deductionsUsed: chosenDeductions,
        tax,
        effectiveRate,
        marginalRate,
        filingStatus: status
    }
}

export function getFederalMarginalRate(taxableIncome, filingStatus = "single") {
    const status = normalizeFilingStatus(filingStatus)
    const brackets = FEDERAL_BRACKETS_2026[status]
    const income = Math.max(0, clampNumber(taxableIncome))

    for (const bracket of brackets) {
        if (income <= bracket.upTo) {
            return bracket.rate
        }
    }

    return brackets[brackets.length - 1].rate
}

// ----------------------------------------
// state tax calculation
// ----------------------------------------

export function calculateStateTax({
    state = "UT",
    taxableIncome = 0,
    filingStatus = "single"
} = {}) {
    const stateProfile = STATE_TAX_DATA[state]

    if (!stateProfile) {
        return {
            state,
            stateName: state,
            tax: 0,
            effectiveRate: 0,
            marginalRate: 0,
            type: "unknown"
        }
    }

    const income = Math.max(0, clampNumber(taxableIncome))
    const status = normalizeFilingStatus(filingStatus)

    if (stateProfile.type === "none") {
        return {
            state,
            stateName: stateProfile.name,
            tax: 0,
            effectiveRate: 0,
            marginalRate: 0,
            type: "none"
        }
    }

    if (stateProfile.type === "flat") {
        const tax = income * stateProfile.rate
        return {
            state,
            stateName: stateProfile.name,
            tax,
            effectiveRate: income > 0 ? tax / income : 0,
            marginalRate: stateProfile.rate,
            type: "flat"
        }
    }

    const brackets = status === "married"
        ? stateProfile.bracketsMarried
        : stateProfile.bracketsSingle

    const tax = calculateProgressiveTax(income, brackets)
    const marginalRate = getProgressiveMarginalRate(income, brackets)

    return {
        state,
        stateName: stateProfile.name,
        tax,
        effectiveRate: income > 0 ? tax / income : 0,
        marginalRate,
        type: "progressive"
    }
}

export function getProgressiveMarginalRate(income, brackets) {
    const amount = Math.max(0, clampNumber(income))

    for (const bracket of brackets) {
        if (amount <= bracket.upTo) {
            return bracket.rate
        }
    }

    return brackets[brackets.length - 1]?.rate || 0
}

// ----------------------------------------
// combined income tax
// ----------------------------------------

export function calculateCombinedIncomeTax({
    grossIncome = 0,
    filingStatus = "single",
    state = "UT",
    deductions = 0,
    useStandardDeduction = true
} = {}) {
    const federal = calculateFederalTax({
        grossIncome,
        filingStatus,
        deductions,
        useStandardDeduction
    })

    const stateTax = calculateStateTax({
        state,
        taxableIncome: federal.taxableIncome,
        filingStatus
    })

    const totalTax = federal.tax + stateTax.tax
    const effectiveRate = grossIncome > 0 ? totalTax / grossIncome : 0

    return {
        grossIncome: clampNumber(grossIncome),
        taxableIncome: federal.taxableIncome,
        federalTax: federal.tax,
        stateTax: stateTax.tax,
        totalTax,
        federalEffectiveRate: federal.effectiveRate,
        stateEffectiveRate: stateTax.effectiveRate,
        effectiveRate,
        federalMarginalRate: federal.marginalRate,
        stateMarginalRate: stateTax.marginalRate,
        combinedMarginalRate: federal.marginalRate + stateTax.marginalRate,
        federal,
        state: stateTax
    }
}

// ----------------------------------------
// after-tax income estimate
// ----------------------------------------

export function estimateAfterTaxIncome({
    grossIncome = 0,
    filingStatus = "single",
    state = "UT",
    deductions = 0,
    useStandardDeduction = true
} = {}) {
    const taxResult = calculateCombinedIncomeTax({
        grossIncome,
        filingStatus,
        state,
        deductions,
        useStandardDeduction
    })

    return {
        ...taxResult,
        afterTaxIncome: Math.max(0, taxResult.grossIncome - taxResult.totalTax),
        monthlyAfterTaxIncome: Math.max(0, taxResult.grossIncome - taxResult.totalTax) / 12
    }
}

// ----------------------------------------
// pretax contribution tax savings
// ----------------------------------------

export function estimatePretaxContributionSavings({
    contributionAmount = 0,
    grossIncome = 0,
    filingStatus = "single",
    state = "UT",
    deductions = 0,
    useStandardDeduction = true
} = {}) {
    const currentTax = calculateCombinedIncomeTax({
        grossIncome,
        filingStatus,
        state,
        deductions,
        useStandardDeduction
    })

    const reducedTax = calculateCombinedIncomeTax({
        grossIncome: Math.max(0, grossIncome - contributionAmount),
        filingStatus,
        state,
        deductions,
        useStandardDeduction
    })

    const taxSavings = Math.max(0, currentTax.totalTax - reducedTax.totalTax)

    return {
        contributionAmount: clampNumber(contributionAmount),
        beforeTax: currentTax.totalTax,
        afterTax: reducedTax.totalTax,
        taxSavings,
        netOutOfPocketCost: Math.max(0, contributionAmount - taxSavings),
        marginalSavingsRate: contributionAmount > 0 ? taxSavings / contributionAmount : 0
    }
}

// ----------------------------------------
// retirement income tax estimate
// assumes retirement income is largely taxable ordinary income
// can be improved later with SS and Roth mix
// ----------------------------------------

export function estimateRetirementTax({
    retirementIncome = 0,
    filingStatus = "single",
    retirementState = "UT",
    deductions = 0,
    useStandardDeduction = true
} = {}) {
    const tax = calculateCombinedIncomeTax({
        grossIncome: retirementIncome,
        filingStatus,
        state: retirementState,
        deductions,
        useStandardDeduction
    })

    return {
        ...tax,
        netRetirementIncome: Math.max(0, retirementIncome - tax.totalTax)
    }
}

// ----------------------------------------
// simple bracket labels
// ----------------------------------------

export function describeTaxBracket(rate) {
    if (rate <= 0.10) return "very low bracket"
    if (rate <= 0.12) return "low bracket"
    if (rate <= 0.22) return "moderate bracket"
    if (rate <= 0.24) return "upper-moderate bracket"
    if (rate <= 0.32) return "high bracket"
    if (rate <= 0.35) return "very high bracket"
    return "top bracket"
}

// ----------------------------------------
// Roth vs Pretax recommendation engine
// ----------------------------------------

export function recommendRothVsPretax({
    currentIncome = 0,
    retirementIncome = 0,
    filingStatus = "single",
    currentState = "UT",
    retirementState = "UT",
    age = 30,
    retirementAge = 65,
    wantsEarlyRetirement = false,
    hasLargePretaxBalances = false,
    expectsPension = false,
    expectsSocialSecurity = true,
    valuesTaxDiversification = true
} = {}) {
    const nowTax = calculateCombinedIncomeTax({
        grossIncome: currentIncome,
        filingStatus,
        state: currentState
    })

    const futureTax = estimateRetirementTax({
        retirementIncome,
        filingStatus,
        retirementState
    })

    let rothScore = 0
    let pretaxScore = 0
    const reasons = []

    if (nowTax.combinedMarginalRate > futureTax.combinedMarginalRate + 0.03) {
        pretaxScore += 3
        reasons.push("Your current marginal tax rate appears meaningfully higher than your estimated retirement tax rate.")
    } else if (futureTax.combinedMarginalRate > nowTax.combinedMarginalRate + 0.03) {
        rothScore += 3
        reasons.push("Your estimated retirement tax rate appears higher than your current marginal tax rate.")
    } else {
        rothScore += 1
        pretaxScore += 1
        reasons.push("Your current and future tax rates look relatively similar, so tax diversification matters more.")
    }

    if (wantsEarlyRetirement) {
        rothScore += 2
        reasons.push("Roth assets can improve flexibility for early retirement and help manage taxable income in bridge years.")
    }

    if (hasLargePretaxBalances) {
        rothScore += 2
        reasons.push("You already expect a meaningful pretax balance, so adding Roth can reduce future RMD pressure.")
    }

    if (expectsPension) {
        rothScore += 2
        reasons.push("A pension can fill part of your future tax bracket, making Roth contributions more attractive.")
    }

    if (expectsSocialSecurity) {
        rothScore += 1
        reasons.push("Social Security can add taxable income later, which can strengthen the case for more Roth money.")
    }

    if (valuesTaxDiversification) {
        rothScore += 1
        pretaxScore += 1
        reasons.push("Maintaining both Roth and pretax balances creates flexibility for future withdrawal planning.")
    }

    const yearsToRetirement = Math.max(0, clampNumber(retirementAge) - clampNumber(age))
    if (yearsToRetirement >= 20) {
        rothScore += 1
        reasons.push("A longer time horizon can make Roth contributions more attractive because of long-term tax-free growth.")
    }

    let recommendation = "blend"
    let title = "Blend Roth and Pretax"
    let explanation = "A blended approach may fit best."

    if (rothScore >= pretaxScore + 2) {
        recommendation = "roth"
        title = "Lean Roth"
        explanation = "Roth contributions look more attractive based on your projected tax profile and planning flexibility."
    } else if (pretaxScore >= rothScore + 2) {
        recommendation = "pretax"
        title = "Lean Pretax"
        explanation = "Pretax contributions look more attractive because they may create stronger tax savings today."
    }

    return {
        recommendation,
        title,
        explanation,
        rothScore,
        pretaxScore,
        reasons,
        currentCombinedMarginalRate: nowTax.combinedMarginalRate,
        retirementCombinedMarginalRate: futureTax.combinedMarginalRate,
        currentEffectiveRate: nowTax.effectiveRate,
        retirementEffectiveRate: futureTax.effectiveRate,
        currentTax: nowTax,
        retirementTax: futureTax
    }
}

// ----------------------------------------
// side-by-side analysis
// useful for UI cards later
// ----------------------------------------

export function compareRothVsPretaxContribution({
    annualContribution = 0,
    currentIncome = 0,
    retirementIncome = 0,
    filingStatus = "single",
    currentState = "UT",
    retirementState = "UT"
} = {}) {
    const pretaxSavings = estimatePretaxContributionSavings({
        contributionAmount: annualContribution,
        grossIncome: currentIncome,
        filingStatus,
        state: currentState
    })

    const currentTax = calculateCombinedIncomeTax({
        grossIncome: currentIncome,
        filingStatus,
        state: currentState
    })

    const retirementTax = estimateRetirementTax({
        retirementIncome,
        filingStatus,
        retirementState
    })

    const rothContributionOutOfPocket = annualContribution
    const pretaxContributionOutOfPocket = pretaxSavings.netOutOfPocketCost

    return {
        annualContribution: clampNumber(annualContribution),
        rothContributionOutOfPocket,
        pretaxContributionOutOfPocket,
        immediatePretaxTaxSavings: pretaxSavings.taxSavings,
        currentMarginalRate: currentTax.combinedMarginalRate,
        retirementMarginalRate: retirementTax.combinedMarginalRate,
        currentEffectiveRate: currentTax.effectiveRate,
        retirementEffectiveRate: retirementTax.effectiveRate
    }
}

// ----------------------------------------
// formatter helpers
// ----------------------------------------

export function formatPercent(value, digits = 1) {
    return `${(clampNumber(value) * 100).toFixed(digits)}%`
}

export function formatCurrency(value) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0
    }).format(clampNumber(value))
}

// ----------------------------------------
// UI-ready summary builder
// ----------------------------------------

export function buildTaxSummary({
    grossIncome = 0,
    filingStatus = "single",
    state = "UT",
    retirementIncome = 0,
    retirementState = "UT"
} = {}) {
    const current = calculateCombinedIncomeTax({
        grossIncome,
        filingStatus,
        state
    })

    const retirement = estimateRetirementTax({
        retirementIncome,
        filingStatus,
        retirementState
    })

    return {
        current: {
            grossIncome: current.grossIncome,
            taxableIncome: current.taxableIncome,
            federalTax: current.federalTax,
            stateTax: current.stateTax,
            totalTax: current.totalTax,
            effectiveRate: current.effectiveRate,
            marginalRate: current.combinedMarginalRate
        },
        retirement: {
            grossIncome: retirement.grossIncome,
            taxableIncome: retirement.taxableIncome,
            federalTax: retirement.federalTax,
            stateTax: retirement.stateTax,
            totalTax: retirement.totalTax,
            effectiveRate: retirement.effectiveRate,
            marginalRate: retirement.combinedMarginalRate
        }
    }
}