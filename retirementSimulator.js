// ========================================
// RETIREMENT SIMULATOR
// Main orchestration layer for the planner
// Connects account engine, tax engine,
// Social Security engine, and Monte Carlo.
// ========================================

import {
    ACCOUNT_TYPES,
    futureValue,
    calculateEmployeeContribution,
    calculateEmployerContribution,
    calculateRMD,
    calculateSafeWithdrawal,
    retirementScore,
    aggregateAccounts
} from "./accountEngine.js"

import {
    calculateCombinedIncomeTax,
    estimateAfterTaxIncome,
    estimateRetirementTax,
    recommendRothVsPretax,
    compareRothVsPretaxContribution,
    buildTaxSummary
} from "./taxEngine.js"

import {
    estimateRetirementBenefit,
    estimateHouseholdSocialSecurity,
    buildSocialSecuritySummary
} from "./socialSecurity.js"

import {
    runMonteCarloSimulation,
    buildMonteCarloSummary,
    buildMonteCarloChartSeries,
    buildRetirementPhaseSeries,
    buildAccumulationPhaseSeries
} from "./monteCarlo.js"

// ----------------------------------------
// helpers
// ----------------------------------------

export function clampNumber(value) {
    const n = Number(value)
    return Number.isFinite(n) ? n : 0
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

export function yearsUntil(currentAge, futureAge) {
    return Math.max(0, Math.floor(clampNumber(futureAge)) - Math.floor(clampNumber(currentAge)))
}

export function buildAgeRange(startAge, endAge) {
    const start = Math.floor(clampNumber(startAge))
    const end = Math.floor(clampNumber(endAge))
    const list = []

    for (let age = start; age <= end; age++) {
        list.push(age)
    }

    return list
}

// ----------------------------------------
// normalized account builder
// expected raw account shape examples:
// {
//   type: "401k",
//   label: "401(k)",
//   balance: 50000,
//   annualContribution: 12000,
//   growthRate: 7
// }
//
// for employer/employee plans:
// {
//   type: "401k",
//   balance: 50000,
//   income: 120000,
//   employeeContributionPercent: 10,
//   rothSliderPercent: 40,
//   employerMatchPercent: 4,
//   employerProfitSharingPercent: 3,
//   growthRate: 7
// }
// ----------------------------------------

export function normalizeAccount(account = {}, householdIncome = 0) {
    const type = account.type || "brokerage"
    const typeMeta = ACCOUNT_TYPES[type] || { retirement: false }

    const balance = clampNumber(account.balance)
    const growthRate = clampNumber(account.growthRate || account.rate || 7)
    const income = clampNumber(account.income || householdIncome)

    let annualContribution = clampNumber(account.annualContribution)
    let pretaxContribution = 0
    let rothContribution = 0
    let taxableContribution = 0
    let employerContribution = 0

    if (["401k", "403b", "457b"].includes(type)) {
        const employeeContributionPercent = clampNumber(account.employeeContributionPercent)
        const rothSliderPercent = clampNumber(account.rothSliderPercent)
        const employerMatchPercent = clampNumber(account.employerMatchPercent)
        const employerProfitSharingPercent = clampNumber(account.employerProfitSharingPercent)

        const employee = calculateEmployeeContribution(
            income,
            employeeContributionPercent,
            rothSliderPercent
        )

        employerContribution = calculateEmployerContribution(
            income,
            employerMatchPercent,
            employerProfitSharingPercent
        )

        pretaxContribution = employee.pretax + employerContribution
        rothContribution = employee.roth
        annualContribution = pretaxContribution + rothContribution
    } else if (type === "401a") {
        employerContribution = calculateEmployerContribution(
            income,
            clampNumber(account.employerContributionPercent),
            clampNumber(account.employerProfitSharingPercent)
        )

        pretaxContribution = employerContribution
        annualContribution = pretaxContribution
    } else if (type === "tradIRA") {
        pretaxContribution = annualContribution
    } else if (type === "rothIRA" || type === "hsa") {
        rothContribution = annualContribution
    } else {
        taxableContribution = annualContribution
    }

    return {
        ...account,
        type,
        label: account.label || ACCOUNT_TYPES[type]?.name || type,
        balance,
        income,
        growthRate,
        annualContribution,
        pretaxContribution,
        rothContribution,
        taxableContribution,
        employerContribution,
        retirement: !!typeMeta.retirement
    }
}

// ----------------------------------------
// project a single account through retirement
// also returns year-by-year series
// ----------------------------------------

export function projectNormalizedAccountToRetirement({
    account,
    currentAge = 30,
    retirementAge = 65
} = {}) {
    const normalized = normalizeAccount(account)
    const years = yearsUntil(currentAge, retirementAge)
    const ageSeries = []
    const balanceSeries = []

    let runningBalance = normalized.balance

    for (let i = 0; i <= years; i++) {
        const age = Math.floor(clampNumber(currentAge)) + i

        if (i === 0) {
            ageSeries.push(age)
            balanceSeries.push(runningBalance)
            continue
        }

        runningBalance = runningBalance * (1 + normalized.growthRate / 100)
        runningBalance += normalized.annualContribution

        ageSeries.push(age)
        balanceSeries.push(runningBalance)
    }

    return {
        ...normalized,
        futureBalance: futureValue(
            normalized.balance,
            normalized.annualContribution,
            normalized.growthRate,
            years
        ),
        ageSeries,
        balanceSeries
    }
}

// ----------------------------------------
// project all accounts to retirement
// ----------------------------------------

export function projectAccountsToRetirement({
    accounts = [],
    currentAge = 30,
    retirementAge = 65,
    defaultIncome = 0
} = {}) {
    const projected = accounts.map(account =>
        projectNormalizedAccountToRetirement({
            account: normalizeAccount(account, defaultIncome),
            currentAge,
            retirementAge
        })
    )

    const totals = aggregateAccounts(projected.map(account => ({
        type: account.type,
        futureBalance: account.futureBalance
    })))

    return {
        projectedAccounts: projected,
        totals
    }
}

// ----------------------------------------
// year-by-year combined projection
// for charts from current age to retirement
// ----------------------------------------

export function buildAccumulationProjectionSeries({
    accounts = [],
    currentAge = 30,
    retirementAge = 65,
    defaultIncome = 0
} = {}) {
    const ages = buildAgeRange(currentAge, retirementAge)
    const normalizedAccounts = accounts.map(account => normalizeAccount(account, defaultIncome))

    const retirementSeries = []
    const nonRetirementSeries = []

    for (const age of ages) {
        const years = yearsUntil(currentAge, age)

        let retirementTotal = 0
        let nonRetirementTotal = 0

        normalizedAccounts.forEach(account => {
            const future = futureValue(
                account.balance,
                account.annualContribution,
                account.growthRate,
                years
            )

            if (account.retirement) {
                retirementTotal += future
            } else {
                nonRetirementTotal += future
            }
        })

        retirementSeries.push(retirementTotal)
        nonRetirementSeries.push(nonRetirementTotal)
    }

    const totalSeries = ages.map((_, i) => retirementSeries[i] + nonRetirementSeries[i])

    return {
        ages,
        labels: ages.map(age => `Age ${age}`),
        retirementSeries,
        nonRetirementSeries,
        totalSeries
    }
}

// ----------------------------------------
// classify retirement assets by tax bucket
// ----------------------------------------

export function classifyTaxBuckets(projectedAccounts = []) {
    let roth = 0
    let pretax = 0
    let taxable = 0

    projectedAccounts.forEach(account => {
        const type = account.type
        const value = clampNumber(account.futureBalance)

        if (["rothIRA", "hsa"].includes(type)) {
            roth += value
        } else if (["401k", "401a", "403b", "457b", "tradIRA"].includes(type)) {
            const rothComponent = clampNumber(account.rothContribution) > 0 && clampNumber(account.pretaxContribution) === 0
                ? value
                : 0

            if (type === "401k" || type === "403b" || type === "457b") {
                const totalContribution = clampNumber(account.pretaxContribution) + clampNumber(account.rothContribution)

                if (totalContribution > 0) {
                    const rothRatio = clampNumber(account.rothContribution) / totalContribution
                    const pretaxRatio = clampNumber(account.pretaxContribution) / totalContribution

                    roth += value * rothRatio
                    pretax += value * pretaxRatio
                } else {
                    pretax += value
                }
            } else if (rothComponent > 0) {
                roth += rothComponent
            } else {
                pretax += value
            }
        } else {
            taxable += value
        }
    })

    return {
        roth,
        pretax,
        taxable,
        total: roth + pretax + taxable
    }
}

// ----------------------------------------
// retirement income model
// ----------------------------------------

export function buildRetirementIncomePlan({
    retirementAssets = 0,
    retirementAge = 65,
    planningAge = 90,
    annualSpendingGoal = 80000,
    socialSecurityAnnualIncome = 0,
    pensionAnnualIncome = 0
} = {}) {
    const safeWithdrawal = calculateSafeWithdrawal(retirementAssets)
    const totalGuaranteedIncome = clampNumber(socialSecurityAnnualIncome) + clampNumber(pensionAnnualIncome)
    const estimatedAvailableIncome = safeWithdrawal + totalGuaranteedIncome
    const gap = Math.max(0, clampNumber(annualSpendingGoal) - estimatedAvailableIncome)

    const score = retirementScore(
        annualSpendingGoal,
        estimatedAvailableIncome
    )

    const ageRange = buildAgeRange(retirementAge, planningAge)
    const labels = ageRange.map(age => `Age ${age}`)

    const withdrawals = ageRange.map(() => safeWithdrawal)
    const socialSecurity = ageRange.map(() => socialSecurityAnnualIncome)
    const pension = ageRange.map(() => pensionAnnualIncome)
    const expenses = ageRange.map(() => annualSpendingGoal)

    return {
        safeWithdrawal,
        totalGuaranteedIncome,
        estimatedAvailableIncome,
        spendingGoal: annualSpendingGoal,
        spendingGap: gap,
        readiness: score,
        chartData: {
            labels,
            withdrawals,
            socialSecurity,
            pension,
            expenses
        }
    }
}

// ----------------------------------------
// household Social Security wrapper
// ----------------------------------------

export function buildHouseholdSocialSecurityPlan({
    currentYear = new Date().getFullYear(),
    person1 = null,
    person2 = null
} = {}) {
    const worker1 = person1 ? {
        birthYear: clampNumber(person1.birthYear || (currentYear - clampNumber(person1.currentAge || 30))),
        claimingAge: clampNumber(person1.claimingAge || 67),
        piaMonthly: clampNumber(person1.piaMonthly || 0)
    } : null

    const worker2 = person2 ? {
        birthYear: clampNumber(person2.birthYear || (currentYear - clampNumber(person2.currentAge || 30))),
        claimingAge: clampNumber(person2.claimingAge || 67),
        piaMonthly: clampNumber(person2.piaMonthly || 0)
    } : null

    const household = estimateHouseholdSocialSecurity({
        worker1,
        worker2
    })

    return {
        household,
        worker1Summary: worker1 ? buildSocialSecuritySummary(worker1) : null,
        worker2Summary: worker2 ? buildSocialSecuritySummary(worker2) : null
    }
}

// ----------------------------------------
// tax analysis wrapper
// ----------------------------------------

export function buildTaxAnalysis({
    currentIncome = 0,
    retirementIncome = 0,
    filingStatus = "single",
    currentState = "UT",
    retirementState = "UT"
} = {}) {
    const currentTax = estimateAfterTaxIncome({
        grossIncome: currentIncome,
        filingStatus,
        state: currentState
    })

    const retirementTax = estimateRetirementTax({
        retirementIncome,
        filingStatus,
        retirementState
    })

    const summary = buildTaxSummary({
        grossIncome: currentIncome,
        filingStatus,
        state: currentState,
        retirementIncome,
        retirementState
    })

    return {
        currentTax,
        retirementTax,
        summary
    }
}

// ----------------------------------------
// Roth vs pretax recommendation wrapper
// ----------------------------------------

export function buildContributionRecommendation({
    annualContribution = 0,
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
    const recommendation = recommendRothVsPretax({
        currentIncome,
        retirementIncome,
        filingStatus,
        currentState,
        retirementState,
        age,
        retirementAge,
        wantsEarlyRetirement,
        hasLargePretaxBalances,
        expectsPension,
        expectsSocialSecurity,
        valuesTaxDiversification
    })

    const comparison = compareRothVsPretaxContribution({
        annualContribution,
        currentIncome,
        retirementIncome,
        filingStatus,
        currentState,
        retirementState
    })

    return {
        recommendation,
        comparison
    }
}

// ----------------------------------------
// Monte Carlo wrapper
// ----------------------------------------

export function buildMonteCarloPlan({
    currentAge = 30,
    retirementAge = 65,
    planningAge = 90,
    startingPortfolio = 0,
    annualContribution = 0,
    annualSpendingNeed = 80000,
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
    const monteCarlo = runMonteCarloSimulation({
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
        simulationCount,
        spendingGrowthMode,
        contributionStopsAtRetirement,
        taxableFirstWithdrawal
    })

    return {
        raw: monteCarlo,
        summary: buildMonteCarloSummary(monteCarlo),
        chartSeries: buildMonteCarloChartSeries(monteCarlo),
        accumulationSeries: buildAccumulationPhaseSeries(monteCarlo, retirementAge),
        retirementSeries: buildRetirementPhaseSeries(monteCarlo, retirementAge)
    }
}

// ----------------------------------------
// master plan builder
// this is the main function your UI can call
// ----------------------------------------

export function buildRetirementPlan({
    personal = {},
    spouse = {},
    household = {},
    accounts = [],
    spouseAccounts = []
} = {}) {
    const currentAge = clampNumber(personal.currentAge || 30)
    const retirementAge = clampNumber(personal.retirementAge || 65)
    const planningAge = clampNumber(personal.planningAge || 90)

    const spouseCurrentAge = clampNumber(spouse.currentAge || 0)
    const spouseRetirementAge = clampNumber(spouse.retirementAge || retirementAge)
    const spousePlanningAge = clampNumber(spouse.planningAge || planningAge)

    const filingStatus = household.filingStatus || "single"
    const currentState = household.currentState || "UT"
    const retirementState = household.retirementState || currentState

    const currentIncome = clampNumber(personal.currentIncome || 0)
    const spouseIncome = clampNumber(spouse.currentIncome || 0)
    const combinedIncome = currentIncome + spouseIncome

    const myProjection = projectAccountsToRetirement({
        accounts,
        currentAge,
        retirementAge,
        defaultIncome: currentIncome
    })

    const spouseProjection = projectAccountsToRetirement({
        accounts: spouseAccounts,
        currentAge: spouseCurrentAge || currentAge,
        retirementAge: spouseRetirementAge,
        defaultIncome: spouseIncome
    })

    const combinedProjectedAccounts = [
        ...myProjection.projectedAccounts,
        ...spouseProjection.projectedAccounts
    ]

    const combinedRetirementAssets =
        clampNumber(myProjection.totals.retirementTotal) +
        clampNumber(spouseProjection.totals.retirementTotal)

    const combinedNonRetirementAssets =
        clampNumber(myProjection.totals.nonRetirementTotal) +
        clampNumber(spouseProjection.totals.nonRetirementTotal)

    const combinedNetWorthAtRetirement =
        combinedRetirementAssets + combinedNonRetirementAssets

    const taxBuckets = classifyTaxBuckets(combinedProjectedAccounts)

    const socialSecurityPlan = buildHouseholdSocialSecurityPlan({
        person1: personal.socialSecurity || null,
        person2: spouse.socialSecurity || null
    })

    const socialSecurityAnnualIncome =
        clampNumber(socialSecurityPlan.household?.annualTotal || 0)

    const pensionAnnualIncome =
        clampNumber(personal.annualPensionIncome || 0) +
        clampNumber(spouse.annualPensionIncome || 0)

    const annualSpendingGoal =
        clampNumber(household.annualSpendingGoal || personal.annualSpendingGoal || 80000)

    const retirementIncomePlan = buildRetirementIncomePlan({
        retirementAssets: combinedRetirementAssets,
        retirementAge,
        planningAge,
        annualSpendingGoal,
        socialSecurityAnnualIncome,
        pensionAnnualIncome
    })

    const taxAnalysis = buildTaxAnalysis({
        currentIncome: combinedIncome,
        retirementIncome: retirementIncomePlan.estimatedAvailableIncome,
        filingStatus,
        currentState,
        retirementState
    })

    const contributionRecommendation = buildContributionRecommendation({
        annualContribution: clampNumber(household.totalAnnualRetirementContribution || 0),
        currentIncome: combinedIncome,
        retirementIncome: retirementIncomePlan.estimatedAvailableIncome,
        filingStatus,
        currentState,
        retirementState,
        age: currentAge,
        retirementAge,
        wantsEarlyRetirement: !!household.wantsEarlyRetirement,
        hasLargePretaxBalances: taxBuckets.pretax > taxBuckets.roth,
        expectsPension: pensionAnnualIncome > 0,
        expectsSocialSecurity: socialSecurityAnnualIncome > 0,
        valuesTaxDiversification: true
    })

    const monteCarloPlan = buildMonteCarloPlan({
        currentAge,
        retirementAge,
        planningAge,
        startingPortfolio: combinedNetWorthAtRetirement > 0
            ? clampNumber(household.currentTotalInvestedAssets || 0)
            : 0,
        annualContribution: clampNumber(household.totalAnnualSavings || household.totalAnnualRetirementContribution || 0),
        annualSpendingNeed: annualSpendingGoal,
        guaranteedIncomeAtRetirement: pensionAnnualIncome,
        meanReturn: clampNumber(household.expectedReturn || 7),
        volatility: clampNumber(household.expectedVolatility || 15),
        inflationRate: clampNumber(household.expectedInflation || 2.5),
        contributionGrowthRate: clampNumber(household.annualContributionGrowthRate || 0),
        socialSecurityStartAge: clampNumber(personal.socialSecurity?.claimingAge || 67),
        socialSecurityAnnualIncome,
        pensionStartAge: retirementAge,
        pensionAnnualIncome,
        simulationCount: clampNumber(household.simulationCount || 1000),
        spendingGrowthMode: household.spendingGrowthMode || "inflation",
        contributionStopsAtRetirement: true,
        taxableFirstWithdrawal: false
    })

    const accumulationSeries = buildAccumulationProjectionSeries({
        accounts: [...accounts, ...spouseAccounts],
        currentAge,
        retirementAge,
        defaultIncome: combinedIncome
    })

    const rmdEstimate = calculateRMD(combinedRetirementAssets)

    return {
        inputs: {
            personal,
            spouse,
            household,
            accounts,
            spouseAccounts
        },

        householdSummary: {
            currentIncome: combinedIncome,
            currentAge,
            retirementAge,
            planningAge,
            annualSpendingGoal,
            combinedRetirementAssets,
            combinedNonRetirementAssets,
            combinedNetWorthAtRetirement,
            rmdEstimate,
            taxBuckets
        },

        projections: {
            yours: myProjection,
            spouse: spouseProjection,
            combinedProjectedAccounts,
            accumulationSeries
        },

        taxes: taxAnalysis,

        socialSecurity: socialSecurityPlan,

        retirementIncome: retirementIncomePlan,

        contributionRecommendation,

        monteCarlo: monteCarloPlan
    }
}

// ----------------------------------------
// UI card helpers
// ----------------------------------------

export function buildTopLevelCards(plan) {
    const summary = plan?.householdSummary || {}
    const retirementIncome = plan?.retirementIncome || {}
    const monteCarlo = plan?.monteCarlo?.summary || {}
    const recommendation = plan?.contributionRecommendation?.recommendation || {}

    return [
        {
            key: "retirementAssets",
            title: "Retirement Assets at Retirement",
            value: formatCurrency(summary.combinedRetirementAssets || 0),
            sub: "Projected retirement-only balances"
        },
        {
            key: "netWorthAtRetirement",
            title: "Total Net Worth at Retirement",
            value: formatCurrency(summary.combinedNetWorthAtRetirement || 0),
            sub: "Retirement + non-retirement assets"
        },
        {
            key: "safeIncome",
            title: "Estimated Annual Retirement Income",
            value: formatCurrency(retirementIncome.estimatedAvailableIncome || 0),
            sub: "Safe withdrawal + guaranteed income"
        },
        {
            key: "rmd",
            title: "Estimated First RMD",
            value: formatCurrency(summary.rmdEstimate || 0),
            sub: "Approximate first required minimum distribution"
        },
        {
            key: "successRate",
            title: "Monte Carlo Success Rate",
            value: formatPercent(monteCarlo.successRate || 0, 0),
            sub: monteCarlo.interpretation?.message || "Probability assets last through planning age"
        },
        {
            key: "rothPretax",
            title: "Contribution Recommendation",
            value: recommendation.title || "Blend Roth and Pretax",
            sub: recommendation.explanation || ""
        }
    ]
}

// ----------------------------------------
// chart data builders for UI wiring
// ----------------------------------------

export function buildPlannerChartData(plan) {
    const projectedAccounts = plan?.projections?.combinedProjectedAccounts || []
    const summary = plan?.householdSummary || {}
    const accumulation = plan?.projections?.accumulationSeries || {}
    const retirementIncome = plan?.retirementIncome?.chartData || {}
    const monteCarlo = plan?.monteCarlo || {}

    const retirementBreakdown = projectedAccounts
        .filter(account => account.retirement)
        .map(account => ({
            label: account.label,
            value: account.futureBalance
        }))

    const nonRetirementBreakdown = projectedAccounts
        .filter(account => !account.retirement)
        .map(account => ({
            label: account.label,
            value: account.futureBalance
        }))

    const rothPretax = {
        labels: ["At Retirement"],
        roth: [summary.taxBuckets?.roth || 0],
        pretax: [summary.taxBuckets?.pretax || 0],
        taxable: [summary.taxBuckets?.taxable || 0]
    }

    const householdNetWorth = {
        labels: ["Retirement"],
        yours: [plan?.projections?.yours?.totals?.netWorth || 0],
        spouse: [plan?.projections?.spouse?.totals?.netWorth || 0],
        combined: [summary.combinedNetWorthAtRetirement || 0]
    }

    const growthProjection = {
        labels: accumulation.labels || [],
        total: accumulation.totalSeries || [],
        retirement: accumulation.retirementSeries || [],
        nonRetirement: accumulation.nonRetirementSeries || []
    }

    return {
        retirementBreakdown,
        nonRetirementBreakdown,
        rothPretax,
        householdNetWorth,
        growthProjection,
        retirementIncome,
        monteCarlo: monteCarlo.chartSeries || null,
        monteCarloAccumulation: monteCarlo.accumulationSeries || null,
        monteCarloRetirement: monteCarlo.retirementSeries || null
    }
}

// ----------------------------------------
// validation helpers
// ----------------------------------------

export function validatePlannerInputs({
    personal = {},
    household = {}
} = {}) {
    const errors = []
    const warnings = []

    const currentAge = clampNumber(personal.currentAge)
    const retirementAge = clampNumber(personal.retirementAge)
    const planningAge = clampNumber(personal.planningAge)

    if (currentAge <= 0) {
        errors.push("Current age must be greater than 0.")
    }

    if (retirementAge <= currentAge) {
        errors.push("Retirement age must be greater than current age.")
    }

    if (planningAge <= retirementAge) {
        errors.push("Planning age must be greater than retirement age.")
    }

    if (clampNumber(personal.currentIncome) <= 0) {
        warnings.push("Current income is blank or zero.")
    }

    if (clampNumber(household.annualSpendingGoal) <= 0) {
        warnings.push("Annual retirement spending goal is blank or zero.")
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings
    }
}