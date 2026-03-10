// ========================================
// SOCIAL SECURITY ENGINE
// Retirement benefit estimates, FRA logic,
// early / full / delayed claiming analysis,
// spouse planning helpers
// ========================================

// ----------------------------------------
// FRA lookup by birth year
// SSA full retirement age rules
// ----------------------------------------

export function getFullRetirementAge(birthYear) {
    const year = Number(birthYear) || 0

    if (year <= 1937) return { years: 65, months: 0 }
    if (year === 1938) return { years: 65, months: 2 }
    if (year === 1939) return { years: 65, months: 4 }
    if (year === 1940) return { years: 65, months: 6 }
    if (year === 1941) return { years: 65, months: 8 }
    if (year === 1942) return { years: 65, months: 10 }
    if (year >= 1943 && year <= 1954) return { years: 66, months: 0 }
    if (year === 1955) return { years: 66, months: 2 }
    if (year === 1956) return { years: 66, months: 4 }
    if (year === 1957) return { years: 66, months: 6 }
    if (year === 1958) return { years: 66, months: 8 }
    if (year === 1959) return { years: 66, months: 10 }

    return { years: 67, months: 0 }
}

export function formatFRA(fra) {
    if (!fra) return "Unknown"

    if (!fra.months) {
        return `${fra.years}`
    }

    return `${fra.years} years, ${fra.months} months`
}

export function fraToMonths(fra) {
    return ((fra?.years || 0) * 12) + (fra?.months || 0)
}

// ----------------------------------------
// Basic numeric helpers
// ----------------------------------------

export function clampNumber(value) {
    const n = Number(value)
    return Number.isFinite(n) ? n : 0
}

export function roundCurrency(value) {
    return Math.round(clampNumber(value))
}

export function formatCurrency(value) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0
    }).format(clampNumber(value))
}

export function formatPercent(value, digits = 1) {
    return `${(clampNumber(value) * 100).toFixed(digits)}%`
}

// ----------------------------------------
// Age helpers
// ----------------------------------------

export function ageToMonths(ageYears = 0, ageMonths = 0) {
    return (Math.max(0, Number(ageYears) || 0) * 12) + Math.max(0, Number(ageMonths) || 0)
}

export function normalizedClaimingAge(age) {
    const a = clampNumber(age)

    if (a < 62) return 62
    if (a > 70) return 70

    return a
}

export function claimingAgeToMonths(age) {
    const normalized = normalizedClaimingAge(age)
    const wholeYears = Math.floor(normalized)
    const fractional = normalized - wholeYears
    const months = Math.round(fractional * 12)

    return (wholeYears * 12) + months
}

// ----------------------------------------
// Early retirement reduction
// SSA-style month reduction formula
// first 36 months: 5/9 of 1% per month
// beyond 36 months: 5/12 of 1% per month
// ----------------------------------------

export function calculateEarlyReductionFactor(monthsEarly) {
    const months = Math.max(0, Math.round(clampNumber(monthsEarly)))

    if (months <= 0) {
        return 1
    }

    const first36 = Math.min(months, 36)
    const beyond36 = Math.max(0, months - 36)

    const reduction =
        (first36 * (5 / 9) / 100) +
        (beyond36 * (5 / 12) / 100)

    return Math.max(0, 1 - reduction)
}

// ----------------------------------------
// Delayed retirement credits
// using 2/3 of 1% per month after FRA,
// stopping at age 70
// ----------------------------------------

export function calculateDelayedCreditFactor(monthsDelayed) {
    const months = Math.max(0, Math.round(clampNumber(monthsDelayed)))
    const cappedMonths = Math.min(months, 36 + 11) // safe upper cap for mixed FRA cases, claim age capped elsewhere
    const credit = cappedMonths * ((2 / 3) / 100)

    return 1 + credit
}

// ----------------------------------------
// Compute retirement benefit factor
// relative to PIA / FRA benefit
// ----------------------------------------

export function getRetirementBenefitFactor({
    birthYear,
    claimingAge
}) {
    const fra = getFullRetirementAge(birthYear)
    const fraMonths = fraToMonths(fra)
    const claimMonths = claimingAgeToMonths(claimingAge)

    if (claimMonths === fraMonths) {
        return {
            factor: 1,
            fra,
            monthsEarly: 0,
            monthsDelayed: 0,
            claimType: "full"
        }
    }

    if (claimMonths < fraMonths) {
        const monthsEarly = fraMonths - claimMonths
        return {
            factor: calculateEarlyReductionFactor(monthsEarly),
            fra,
            monthsEarly,
            monthsDelayed: 0,
            claimType: "early"
        }
    }

    const maxDelayedClaimMonths = claimingAgeToMonths(70)
    const adjustedClaimMonths = Math.min(claimMonths, maxDelayedClaimMonths)
    const monthsDelayed = adjustedClaimMonths - fraMonths

    return {
        factor: calculateDelayedCreditFactor(monthsDelayed),
        fra,
        monthsEarly: 0,
        monthsDelayed,
        claimType: "delayed"
    }
}

// ----------------------------------------
// Main benefit estimate
// PIA = Primary Insurance Amount
// This is the monthly benefit at FRA
// ----------------------------------------

export function estimateRetirementBenefit({
    birthYear,
    claimingAge,
    piaMonthly = 0
}) {
    const pia = Math.max(0, clampNumber(piaMonthly))
    const factorInfo = getRetirementBenefitFactor({
        birthYear,
        claimingAge
    })

    const monthlyBenefit = pia * factorInfo.factor
    const annualBenefit = monthlyBenefit * 12

    return {
        birthYear: Number(birthYear) || 0,
        claimingAge: normalizedClaimingAge(claimingAge),
        piaMonthly: pia,
        factor: factorInfo.factor,
        monthlyBenefit,
        annualBenefit,
        fra: factorInfo.fra,
        monthsEarly: factorInfo.monthsEarly,
        monthsDelayed: factorInfo.monthsDelayed,
        claimType: factorInfo.claimType
    }
}

// ----------------------------------------
// Quick claiming scenarios for UI cards
// ----------------------------------------

export function buildClaimingScenarios({
    birthYear,
    piaMonthly = 0
}) {
    const ages = [62, 63, 64, 65, 66, 67, 68, 69, 70]

    return ages.map(age => estimateRetirementBenefit({
        birthYear,
        claimingAge: age,
        piaMonthly
    }))
}

// ----------------------------------------
// Spousal benefit estimate (simple)
// Max spouse retirement benefit is generally
// up to 50% of worker PIA at spouse FRA.
// Starting early reduces it.
// No delayed credits on spouse benefit itself.
// ----------------------------------------

export function estimateSpousalBenefit({
    workerPIAMonthly = 0,
    spouseBirthYear,
    spouseClaimingAge
}) {
    const workerPIA = Math.max(0, clampNumber(workerPIAMonthly))
    const spouseFRA = getFullRetirementAge(spouseBirthYear)
    const spouseFRAMonths = fraToMonths(spouseFRA)
    const spouseClaimMonths = claimingAgeToMonths(spouseClaimingAge)

    const fullSpousalBenefit = workerPIA * 0.5

    if (spouseClaimMonths >= spouseFRAMonths) {
        return {
            fullSpousalBenefit,
            monthlyBenefit: fullSpousalBenefit,
            annualBenefit: fullSpousalBenefit * 12,
            reductionFactor: 1,
            claimType: spouseClaimMonths === spouseFRAMonths ? "full" : "after_fra_no_extra_spousal_credit",
            spouseFRA
        }
    }

    const monthsEarly = spouseFRAMonths - spouseClaimMonths

    // Simplified spouse early-claim reduction approximation:
    // first 36 months: 25/36 of 1% per month
    // beyond 36 months: 5/12 of 1% per month
    const first36 = Math.min(monthsEarly, 36)
    const beyond36 = Math.max(0, monthsEarly - 36)
    const reduction =
        (first36 * (25 / 36) / 100) +
        (beyond36 * (5 / 12) / 100)

    const factor = Math.max(0, 1 - reduction)
    const monthlyBenefit = fullSpousalBenefit * factor

    return {
        fullSpousalBenefit,
        monthlyBenefit,
        annualBenefit: monthlyBenefit * 12,
        reductionFactor: factor,
        claimType: "early",
        spouseFRA,
        monthsEarly
    }
}

// ----------------------------------------
// Household Social Security estimate
// ----------------------------------------

export function estimateHouseholdSocialSecurity({
    worker1 = null,
    worker2 = null
}) {
    const w1 = worker1 ? estimateRetirementBenefit(worker1) : null
    const w2 = worker2 ? estimateRetirementBenefit(worker2) : null

    const monthlyTotal = (w1?.monthlyBenefit || 0) + (w2?.monthlyBenefit || 0)
    const annualTotal = monthlyTotal * 12

    return {
        worker1: w1,
        worker2: w2,
        monthlyTotal,
        annualTotal
    }
}

// ----------------------------------------
// Lifetime cumulative estimate
// This is a simple nominal model and does
// not include COLA, taxes, or survivor rules
// unless added later.
// ----------------------------------------

export function estimateLifetimeBenefits({
    annualBenefit = 0,
    startAge = 67,
    lifeExpectancy = 90,
    annualCOLA = 0
}) {
    const start = clampNumber(startAge)
    const end = clampNumber(lifeExpectancy)
    const cola = clampNumber(annualCOLA) / 100

    if (end <= start) {
        return {
            totalLifetimeBenefits: 0,
            yearlySeries: []
        }
    }

    let currentAnnual = clampNumber(annualBenefit)
    let total = 0
    const yearlySeries = []

    for (let age = Math.floor(start); age < Math.floor(end); age++) {
        yearlySeries.push({
            age,
            annualBenefit: currentAnnual
        })

        total += currentAnnual
        currentAnnual *= (1 + cola)
    }

    return {
        totalLifetimeBenefits: total,
        yearlySeries
    }
}

// ----------------------------------------
// Break-even comparison between two claim ages
// compares cumulative nominal benefits
// ----------------------------------------

export function estimateBreakEvenAge({
    birthYear,
    piaMonthly = 0,
    ageA = 62,
    ageB = 70,
    annualCOLA = 0,
    maxAge = 100
}) {
    const benefitA = estimateRetirementBenefit({
        birthYear,
        claimingAge: ageA,
        piaMonthly
    })

    const benefitB = estimateRetirementBenefit({
        birthYear,
        claimingAge: ageB,
        piaMonthly
    })

    const cola = clampNumber(annualCOLA) / 100
    let cumulativeA = 0
    let cumulativeB = 0
    let annualA = benefitA.annualBenefit
    let annualB = benefitB.annualBenefit
    const comparison = []

    for (let age = 62; age <= maxAge; age++) {
        if (age >= ageA) {
            cumulativeA += annualA
            annualA *= (1 + cola)
        }

        if (age >= ageB) {
            cumulativeB += annualB
            annualB *= (1 + cola)
        }

        comparison.push({
            age,
            cumulativeA,
            cumulativeB
        })
    }

    const breakEven = comparison.find(row => row.age >= ageB && row.cumulativeB >= row.cumulativeA)

    return {
        scenarioA: benefitA,
        scenarioB: benefitB,
        breakEvenAge: breakEven?.age || null,
        comparison
    }
}

// ----------------------------------------
// Simple income timeline builder
// For retirement chart integration
// ----------------------------------------

export function buildSocialSecurityIncomeTimeline({
    currentAge = 30,
    endAge = 95,
    birthYear,
    claimingAge = 67,
    piaMonthly = 0,
    annualCOLA = 0
}) {
    const now = Math.floor(clampNumber(currentAge))
    const end = Math.floor(clampNumber(endAge))
    const cola = clampNumber(annualCOLA) / 100

    const estimate = estimateRetirementBenefit({
        birthYear,
        claimingAge,
        piaMonthly
    })

    let annualBenefit = estimate.annualBenefit
    const labels = []
    const series = []

    for (let age = now; age <= end; age++) {
        labels.push(`Age ${age}`)

        if (age < claimingAge) {
            series.push(0)
        } else {
            series.push(annualBenefit)
            annualBenefit *= (1 + cola)
        }
    }

    return {
        labels,
        annualSeries: series,
        monthlyStartingBenefit: estimate.monthlyBenefit,
        annualStartingBenefit: estimate.annualBenefit,
        estimate
    }
}

// ----------------------------------------
// High-level recommendation helper
// ----------------------------------------

export function recommendClaimingAge({
    birthYear,
    piaMonthly = 0,
    retirementAssets = 0,
    wantsEarlyIncome = false,
    hasLongevityExpectation = true,
    stillWorkingPastFRA = false,
    worriedAboutSequenceRisk = true
}) {
    let earlyScore = 0
    let delayScore = 0
    const reasons = []

    if (wantsEarlyIncome) {
        earlyScore += 3
        reasons.push("You want income earlier, which can support claiming sooner.")
    }

    if (hasLongevityExpectation) {
        delayScore += 3
        reasons.push("A longer life expectancy can improve the value of delaying benefits.")
    }

    if (retirementAssets > 1000000) {
        delayScore += 2
        reasons.push("Higher portfolio assets can make it easier to delay Social Security and lock in a larger later benefit.")
    } else if (retirementAssets < 250000) {
        earlyScore += 2
        reasons.push("Lower retirement assets can strengthen the case for starting benefits earlier if cash flow is tight.")
    }

    if (stillWorkingPastFRA) {
        delayScore += 2
        reasons.push("Continuing to work past full retirement age can support delaying benefits.")
    }

    if (worriedAboutSequenceRisk) {
        delayScore += 1
        reasons.push("A larger guaranteed income floor later can reduce pressure on portfolio withdrawals.")
    }

    let recommendation = "consider_delay"
    let title = "Consider Delaying"
    let explanation = "Delaying may improve lifetime protection and guaranteed income."

    if (earlyScore >= delayScore + 2) {
        recommendation = "consider_earlier_claiming"
        title = "Consider Earlier Claiming"
        explanation = "Claiming earlier may fit better if near-term cash flow matters more than maximizing the later monthly benefit."
    } else if (Math.abs(delayScore - earlyScore) <= 1) {
        recommendation = "depends"
        title = "Close Call"
        explanation = "This is a close decision and depends on cash flow needs, health, taxes, and portfolio flexibility."
    }

    return {
        recommendation,
        title,
        explanation,
        earlyScore,
        delayScore,
        reasons,
        scenarios: buildClaimingScenarios({
            birthYear,
            piaMonthly
        })
    }
}

// ----------------------------------------
// UI summary builder
// ----------------------------------------

export function buildSocialSecuritySummary({
    birthYear,
    piaMonthly = 0,
    claimingAge = 67,
    lifeExpectancy = 90,
    annualCOLA = 0
}) {
    const estimate = estimateRetirementBenefit({
        birthYear,
        claimingAge,
        piaMonthly
    })

    const lifetime = estimateLifetimeBenefits({
        annualBenefit: estimate.annualBenefit,
        startAge: claimingAge,
        lifeExpectancy,
        annualCOLA
    })

    const breakEvenVs62 = estimateBreakEvenAge({
        birthYear,
        piaMonthly,
        ageA: 62,
        ageB: claimingAge,
        annualCOLA
    })

    return {
        fra: estimate.fra,
        fraLabel: formatFRA(estimate.fra),
        claimingAge: estimate.claimingAge,
        monthlyBenefit: estimate.monthlyBenefit,
        annualBenefit: estimate.annualBenefit,
        claimType: estimate.claimType,
        factor: estimate.factor,
        lifetimeBenefits: lifetime.totalLifetimeBenefits,
        breakEvenVs62Age: breakEvenVs62.breakEvenAge
    }
}