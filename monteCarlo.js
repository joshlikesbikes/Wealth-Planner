// ========================================
// MONTE CARLO ENGINE
// Projects from today through retirement
// and then through a chosen planning age.
// Supports accumulation + retirement spending.
// ========================================

// ----------------------------------------
// helpers
// ----------------------------------------

export function clampNumber(value) {
    const n = Number(value)
    return Number.isFinite(n) ? n : 0
}

export function roundNumber(value, digits = 2) {
    const factor = Math.pow(10, digits)
    return Math.round((clampNumber(value) + Number.EPSILON) * factor) / factor
}

export function formatCurrency(value) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0
    }).format(clampNumber(value))
}

export function percentile(sortedArray, p) {
    if (!sortedArray.length) return 0
    if (p <= 0) return sortedArray[0]
    if (p >= 1) return sortedArray[sortedArray.length - 1]

    const index = (sortedArray.length - 1) * p
    const lower = Math.floor(index)
    const upper = Math.ceil(index)
    const weight = index - lower

    if (lower === upper) return sortedArray[lower]

    return sortedArray[lower] * (1 - weight) + sortedArray[upper] * weight
}

// ----------------------------------------
// random normal generator
// Box-Muller transform
// ----------------------------------------

export function randomNormal(mean = 0, stdDev = 1) {
    let u = 0
    let v = 0

    while (u === 0) u = Math.random()
    while (v === 0) v = Math.random()

    const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
    return mean + z * stdDev
}

// ----------------------------------------
// inflation adjustment
// ----------------------------------------

export function inflateAmount(amount, inflationRate, years) {
    const amt = clampNumber(amount)
    const rate = clampNumber(inflationRate) / 100
    return amt * Math.pow(1 + rate, Math.max(0, clampNumber(years)))
}

// ----------------------------------------
// series builders
// ----------------------------------------

export function buildAgeLabels(currentAge, planningAge) {
    const start = Math.floor(clampNumber(currentAge))
    const end = Math.floor(clampNumber(planningAge))
    const labels = []

    for (let age = start; age <= end; age++) {
        labels.push(`Age ${age}`)
    }

    return labels
}

export function buildEmptyAgeMap(currentAge, planningAge) {
    const map = {}

    for (let age = Math.floor(clampNumber(currentAge)); age <= Math.floor(clampNumber(planningAge)); age++) {
        map[age] = 0
    }

    return map
}

// ----------------------------------------
// return model
// nominal return sampled each year
// optionally subtract inflation to create
// a real return framework if desired later
// ----------------------------------------

export function sampleAnnualReturn({
    meanReturn = 7,
    volatility = 15
} = {}) {
    return randomNormal(clampNumber(meanReturn), clampNumber(volatility)) / 100
}

// ----------------------------------------
// one-path simulation
// phases:
// 1. accumulation: current age to retirement age - 1
// 2. retirement: retirement age to planning age
// ----------------------------------------

export function simulateSinglePath({
    currentAge = 30,
    retirementAge = 65,
    planningAge = 90,

    startingPortfolio = 0,
    annualContribution = 0,

    annualSpendingNeed = 0,
    guaranteedIncomeAtRetirement = 0,

    meanReturn = 7,
    volatility = 15,
    inflationRate = 2.5,

    contributionGrowthRate = 0,
    spendingGrowthMode = "inflation", // "inflation" or "flat"
    contributionStopsAtRetirement = true,

    socialSecurityStartAge = null,
    socialSecurityAnnualIncome = 0,

    pensionStartAge = null,
    pensionAnnualIncome = 0,

    taxableFirstWithdrawal = false
} = {}) {
    const startAge = Math.floor(clampNumber(currentAge))
    const retireAge = Math.floor(clampNumber(retirementAge))
    const endAge = Math.floor(clampNumber(planningAge))

    let portfolio = clampNumber(startingPortfolio)
    let baseContribution = clampNumber(annualContribution)
    let baseSpending = clampNumber(annualSpendingNeed)
    const guaranteedIncomeBase = clampNumber(guaranteedIncomeAtRetirement)

    const contributionGrowth = clampNumber(contributionGrowthRate) / 100
    const inflation = clampNumber(inflationRate) / 100

    let failed = false
    let failureAge = null

    const yearlyResults = []

    for (let age = startAge; age <= endAge; age++) {
        const yearIndex = age - startAge
        const annualReturn = sampleAnnualReturn({ meanReturn, volatility })

        const isRetired = age >= retireAge

        let contribution = 0
        let spending = 0
        let guaranteedIncome = 0
        let withdrawal = 0

        if (!isRetired) {
            contribution = contributionStopsAtRetirement
                ? baseContribution * Math.pow(1 + contributionGrowth, yearIndex)
                : baseContribution

            portfolio += contribution
            portfolio *= (1 + annualReturn)
        } else {
            if (spendingGrowthMode === "inflation") {
                spending = baseSpending * Math.pow(1 + inflation, age - retireAge)
            } else {
                spending = baseSpending
            }

            guaranteedIncome = guaranteedIncomeBase

            if (socialSecurityStartAge !== null && age >= socialSecurityStartAge) {
                const yearsSinceSS = age - socialSecurityStartAge
                guaranteedIncome += clampNumber(socialSecurityAnnualIncome) * Math.pow(1 + inflation, Math.max(0, yearsSinceSS))
            }

            if (pensionStartAge !== null && age >= pensionStartAge) {
                const yearsSincePension = age - pensionStartAge
                guaranteedIncome += clampNumber(pensionAnnualIncome) * Math.pow(1 + inflation, Math.max(0, yearsSincePension))
            }

            withdrawal = Math.max(0, spending - guaranteedIncome)

            if (taxableFirstWithdrawal) {
                portfolio -= withdrawal
                portfolio *= (1 + annualReturn)
            } else {
                portfolio *= (1 + annualReturn)
                portfolio -= withdrawal
            }
        }

        if (portfolio < 0 && !failed) {
            failed = true
            failureAge = age
            portfolio = 0
        }

        yearlyResults.push({
            age,
            isRetired,
            annualReturn,
            contribution,
            spending,
            guaranteedIncome,
            withdrawal,
            endPortfolio: Math.max(0, portfolio)
        })
    }

    return {
        failed,
        failureAge,
        endingPortfolio: Math.max(0, portfolio),
        yearlyResults
    }
}

// ----------------------------------------
// aggregate multiple simulations
// ----------------------------------------

export function runMonteCarloSimulation({
    currentAge = 30,
    retirementAge = 65,
    planningAge = 90,

    startingPortfolio = 0,
    annualContribution = 0,

    annualSpendingNeed = 0,
    guaranteedIncomeAtRetirement = 0,

    meanReturn = 7,
    volatility = 15,
    inflationRate = 2.5,
    contributionGrowthRate = 0,

    socialSecurityStartAge = null,
    socialSecurityAnnualIncome = 0,

    pensionStartAge = null,
    pensionAnnualIncome = 0,

    simulationCount = 1000,
    spendingGrowthMode = "inflation",
    contributionStopsAtRetirement = true,
    taxableFirstWithdrawal = false
} = {}) {
    const sims = Math.max(1, Math.floor(clampNumber(simulationCount)))
    const endingValues = []
    const failureAges = []
    const pathResults = []

    const ageLabels = buildAgeLabels(currentAge, planningAge)
    const yearlyPortfolioBuckets = buildEmptyAgeMap(currentAge, planningAge)

    for (let i = 0; i < sims; i++) {
        const result = simulateSinglePath({
            currentAge,
            retirementAge,
            planningAge,
            startingPortfolio,
            annualContribution,
            annualSpendingNeed,
            guaranteedIncomeAtRetirement,
            meanReturn,
            volatility,
            inflationRate,
            contributionGrowthRate,
            socialSecurityStartAge,
            socialSecurityAnnualIncome,
            pensionStartAge,
            pensionAnnualIncome,
            spendingGrowthMode,
            contributionStopsAtRetirement,
            taxableFirstWithdrawal
        })

        endingValues.push(result.endingPortfolio)

        if (result.failed && result.failureAge !== null) {
            failureAges.push(result.failureAge)
        }

        pathResults.push(result)

        result.yearlyResults.forEach(row => {
            if (!yearlyPortfolioBuckets[row.age]) {
                yearlyPortfolioBuckets[row.age] = []
            }

            if (!Array.isArray(yearlyPortfolioBuckets[row.age])) {
                yearlyPortfolioBuckets[row.age] = []
            }

            yearlyPortfolioBuckets[row.age].push(row.endPortfolio)
        })
    }

    const sortedEndingValues = [...endingValues].sort((a, b) => a - b)

    const successCount = pathResults.filter(r => !r.failed).length
    const successRate = successCount / sims

    const yearlyPercentiles = []
    for (let age = Math.floor(clampNumber(currentAge)); age <= Math.floor(clampNumber(planningAge)); age++) {
        const values = Array.isArray(yearlyPortfolioBuckets[age])
            ? [...yearlyPortfolioBuckets[age]].sort((a, b) => a - b)
            : [0]

        yearlyPercentiles.push({
            age,
            p10: percentile(values, 0.10),
            p25: percentile(values, 0.25),
            p50: percentile(values, 0.50),
            p75: percentile(values, 0.75),
            p90: percentile(values, 0.90)
        })
    }

    const medianFailureAge = failureAges.length
        ? percentile([...failureAges].sort((a, b) => a - b), 0.5)
        : null

    return {
        inputs: {
            currentAge,
            retirementAge,
            planningAge,
            startingPortfolio,
            annualContribution,
            annualSpendingNeed,
            guaranteedIncomeAtRetirement,
            meanReturn,
            volatility,
            inflationRate,
            contributionGrowthRate,
            socialSecurityStartAge,
            socialSecurityAnnualIncome,
            pensionStartAge,
            pensionAnnualIncome,
            simulationCount: sims,
            spendingGrowthMode,
            contributionStopsAtRetirement,
            taxableFirstWithdrawal
        },
        successRate,
        successCount,
        failureCount: sims - successCount,
        medianEndingValue: percentile(sortedEndingValues, 0.50),
        p10EndingValue: percentile(sortedEndingValues, 0.10),
        p25EndingValue: percentile(sortedEndingValues, 0.25),
        p75EndingValue: percentile(sortedEndingValues, 0.75),
        p90EndingValue: percentile(sortedEndingValues, 0.90),
        bestEndingValue: sortedEndingValues[sortedEndingValues.length - 1] || 0,
        worstEndingValue: sortedEndingValues[0] || 0,
        medianFailureAge,
        yearlyPercentiles,
        ageLabels,
        pathResults
    }
}

// ----------------------------------------
// quick interpretation helper
// ----------------------------------------

export function interpretSuccessRate(successRate) {
    const rate = clampNumber(successRate)

    if (rate >= 0.9) {
        return {
            label: "Very Strong",
            tone: "good",
            message: "Your plan appears very resilient across the full timeline through your planning age."
        }
    }

    if (rate >= 0.75) {
        return {
            label: "Solid",
            tone: "good",
            message: "Your plan looks fairly strong, though it still has some risk in weaker market paths."
        }
    }

    if (rate >= 0.6) {
        return {
            label: "Moderate",
            tone: "mid",
            message: "Your plan may work, but it could benefit from higher savings, lower spending, or a later retirement age."
        }
    }

    if (rate >= 0.4) {
        return {
            label: "Weak",
            tone: "bad",
            message: "Your current assumptions create meaningful retirement risk before your planning age."
        }
    }

    return {
        label: "Very Weak",
        tone: "bad",
        message: "Your current plan has a high probability of depleting assets before your planning age."
    }
}

// ----------------------------------------
// build chart-ready percentile series
// for the main UI
// ----------------------------------------

export function buildMonteCarloChartSeries(simulationResult) {
    const rows = simulationResult?.yearlyPercentiles || []

    return {
        labels: rows.map(r => `Age ${r.age}`),
        p10: rows.map(r => r.p10),
        p25: rows.map(r => r.p25),
        p50: rows.map(r => r.p50),
        p75: rows.map(r => r.p75),
        p90: rows.map(r => r.p90)
    }
}

// ----------------------------------------
// build retirement phase subset only
// useful if you want a separate chart from
// retirement age through planning age
// ----------------------------------------

export function buildRetirementPhaseSeries(simulationResult, retirementAge) {
    const rows = (simulationResult?.yearlyPercentiles || []).filter(
        row => row.age >= Math.floor(clampNumber(retirementAge))
    )

    return {
        labels: rows.map(r => `Age ${r.age}`),
        p10: rows.map(r => r.p10),
        p25: rows.map(r => r.p25),
        p50: rows.map(r => r.p50),
        p75: rows.map(r => r.p75),
        p90: rows.map(r => r.p90)
    }
}

// ----------------------------------------
// build accumulation phase subset only
// useful if you want a separate pre-retirement
// growth chart
// ----------------------------------------

export function buildAccumulationPhaseSeries(simulationResult, retirementAge) {
    const rows = (simulationResult?.yearlyPercentiles || []).filter(
        row => row.age < Math.floor(clampNumber(retirementAge))
    )

    return {
        labels: rows.map(r => `Age ${r.age}`),
        p10: rows.map(r => r.p10),
        p25: rows.map(r => r.p25),
        p50: rows.map(r => r.p50),
        p75: rows.map(r => r.p75),
        p90: rows.map(r => r.p90)
    }
}

// ----------------------------------------
// simple spending stress test helper
// tries several spending levels and returns
// their success rates
// ----------------------------------------

export function runSpendingSensitivityTest({
    currentAge = 30,
    retirementAge = 65,
    planningAge = 90,
    startingPortfolio = 0,
    annualContribution = 0,
    baseAnnualSpendingNeed = 80000,
    guaranteedIncomeAtRetirement = 0,
    meanReturn = 7,
    volatility = 15,
    inflationRate = 2.5,
    simulationCount = 500,
    spendingLevels = [0.8, 0.9, 1.0, 1.1, 1.2]
} = {}) {
    return spendingLevels.map(multiplier => {
        const spending = clampNumber(baseAnnualSpendingNeed) * clampNumber(multiplier)

        const result = runMonteCarloSimulation({
            currentAge,
            retirementAge,
            planningAge,
            startingPortfolio,
            annualContribution,
            annualSpendingNeed: spending,
            guaranteedIncomeAtRetirement,
            meanReturn,
            volatility,
            inflationRate,
            simulationCount
        })

        return {
            spending,
            multiplier,
            successRate: result.successRate,
            medianEndingValue: result.medianEndingValue
        }
    })
}

// ----------------------------------------
// simple retirement age sensitivity test
// ----------------------------------------

export function runRetirementAgeSensitivityTest({
    currentAge = 30,
    planningAge = 90,
    retirementAgeOptions = [55, 57, 60, 62, 65],
    startingPortfolio = 0,
    annualContribution = 0,
    annualSpendingNeed = 80000,
    guaranteedIncomeAtRetirement = 0,
    meanReturn = 7,
    volatility = 15,
    inflationRate = 2.5,
    simulationCount = 500
} = {}) {
    return retirementAgeOptions.map(retirementAge => {
        const result = runMonteCarloSimulation({
            currentAge,
            retirementAge,
            planningAge,
            startingPortfolio,
            annualContribution,
            annualSpendingNeed,
            guaranteedIncomeAtRetirement,
            meanReturn,
            volatility,
            inflationRate,
            simulationCount
        })

        return {
            retirementAge,
            successRate: result.successRate,
            medianEndingValue: result.medianEndingValue,
            medianFailureAge: result.medianFailureAge
        }
    })
}

// ----------------------------------------
// UI summary builder
// ----------------------------------------

export function buildMonteCarloSummary(simulationResult) {
    if (!simulationResult) {
        return {
            successRate: 0,
            interpretation: interpretSuccessRate(0),
            medianEndingValue: 0,
            p10EndingValue: 0,
            p90EndingValue: 0,
            medianFailureAge: null
        }
    }

    return {
        successRate: simulationResult.successRate,
        interpretation: interpretSuccessRate(simulationResult.successRate),
        medianEndingValue: simulationResult.medianEndingValue,
        p10EndingValue: simulationResult.p10EndingValue,
        p90EndingValue: simulationResult.p90EndingValue,
        medianFailureAge: simulationResult.medianFailureAge
    }
}