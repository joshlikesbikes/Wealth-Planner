// ================================
// ACCOUNT ENGINE
// Core financial projection logic
// ================================

// Account type library
export const ACCOUNT_TYPES = {

    "401k": {
        name: "401(k)",
        retirement: true,
        employeeContribution: true,
        employerContribution: true
    },

    "401a": {
        name: "401(a)",
        retirement: true,
        employeeContribution: false,
        employerContribution: true
    },

    "403b": {
        name: "403(b)",
        retirement: true,
        employeeContribution: true,
        employerContribution: true
    },

    "457b": {
        name: "457(b)",
        retirement: true,
        employeeContribution: true,
        employerContribution: false
    },

    "rothIRA": {
        name: "Roth IRA",
        retirement: true,
        employeeContribution: true
    },

    "tradIRA": {
        name: "Traditional IRA",
        retirement: true,
        employeeContribution: true
    },

    "hsa": {
        name: "HSA",
        retirement: true,
        employeeContribution: true
    },

    "brokerage": {
        name: "Brokerage",
        retirement: false
    },

    "savings": {
        name: "Savings",
        retirement: false
    },

    "cash": {
        name: "Cash",
        retirement: false
    }

}



// ================================
// FUTURE VALUE CALCULATION
// ================================

export function futureValue(balance, annualContribution, rate, years) {

    rate = rate / 100

    let value = balance

    for (let i = 0; i < years; i++) {

        value = value * (1 + rate)

        value += annualContribution

    }

    return value
}



// ================================
// EMPLOYEE CONTRIBUTION SPLIT
// Pretax vs Roth
// ================================

export function calculateEmployeeContribution(income, contributionPercent, rothSlider) {

    let employeeTotal = income * (contributionPercent / 100)

    let pretax = employeeTotal * ((100 - rothSlider) / 100)

    let roth = employeeTotal * (rothSlider / 100)

    return {

        pretax,
        roth,
        total: employeeTotal

    }

}



// ================================
// EMPLOYER CONTRIBUTION
// always pretax
// ================================

export function calculateEmployerContribution(income, matchPercent, profitSharingPercent) {

    let match = income * (matchPercent / 100)

    let profit = income * (profitSharingPercent / 100)

    return match + profit

}



// ================================
// ACCOUNT PROJECTION
// ================================

export function projectAccount(account, years, growthRate) {

    let future = futureValue(

        account.balance,

        account.annualContribution,

        growthRate,

        years

    )

    return {

        type: account.type,

        futureBalance: future,

        retirement: ACCOUNT_TYPES[account.type].retirement

    }

}



// ================================
// RMD CALCULATION
// starting age 73
// ================================

export function calculateRMD(balance) {

    const divisor = 26.5

    return balance / divisor

}



// ================================
// SAFE WITHDRAWAL
// ================================

export function calculateSafeWithdrawal(balance) {

    return balance * 0.04

}



// ================================
// RETIREMENT READINESS SCORE
// ================================

export function retirementScore(expectedIncome, withdrawalCapacity) {

    let ratio = withdrawalCapacity / expectedIncome

    if (ratio >= 1.2) return {score: ratio, status: "excellent"}

    if (ratio >= .9) return {score: ratio, status: "good"}

    if (ratio >= .7) return {score: ratio, status: "moderate"}

    return {score: ratio, status: "poor"}

}



// ================================
// TOTAL ACCOUNT AGGREGATION
// ================================

export function aggregateAccounts(accounts) {

    let retirementTotal = 0

    let nonRetirementTotal = 0

    accounts.forEach(account => {

        if (ACCOUNT_TYPES[account.type].retirement)

            retirementTotal += account.futureBalance

        else

            nonRetirementTotal += account.futureBalance

    })

    return {

        retirementTotal,

        nonRetirementTotal,

        netWorth: retirementTotal + nonRetirementTotal

    }

}