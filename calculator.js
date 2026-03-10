// ========================================
// CALCULATOR APP CONTROLLER
// Reads UI inputs, builds planner inputs,
// runs the simulator, and renders output.
// ========================================

import { buildRetirementPlan, buildTopLevelCards, buildPlannerChartData, validatePlannerInputs } from "./retirementSimulator.js"
import {
    renderRetirementBreakdownChart,
    renderNonRetirementBreakdownChart,
    renderGrowthProjectionChart,
    renderRothPretaxChart,
    renderHouseholdNetWorthChart,
    renderRetirementIncomeChart,
    renderEmptyDoughnutChart,
    renderEmptyLineChart,
    destroyAllCharts,
    resizeAllCharts
} from "./chartsEngine.js"

import { listStateOptions, formatCurrency as formatTaxCurrency, formatPercent as formatTaxPercent } from "./taxEngine.js"

// ----------------------------------------
// local helpers
// ----------------------------------------

function clampNumber(value) {
    const n = Number(value)
    return Number.isFinite(n) ? n : 0
}

function textValue(id) {
    const el = document.getElementById(id)
    return el ? String(el.value || "").trim() : ""
}

function numberValue(id) {
    const el = document.getElementById(id)
    if (!el) return 0
    const raw = String(el.value || "").replace(/,/g, "").trim()
    const n = Number(raw)
    return Number.isFinite(n) ? n : 0
}

function checkedValue(id) {
    const el = document.getElementById(id)
    return !!(el && el.checked)
}

function setHTML(id, html) {
    const el = document.getElementById(id)
    if (el) el.innerHTML = html
}

function showElement(id, display = "block") {
    const el = document.getElementById(id)
    if (el) el.style.display = display
}

function hideElement(id) {
    const el = document.getElementById(id)
    if (el) el.style.display = "none"
}

function formatCurrency(value) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0
    }).format(clampNumber(value))
}

function formatPercent(value, digits = 1) {
    return `${(clampNumber(value) * 100).toFixed(digits)}%`
}

function formatSimpleNumber(value) {
    return new Intl.NumberFormat("en-US", {
        maximumFractionDigits: 0
    }).format(clampNumber(value))
}

// ----------------------------------------
// DOM cache
// ----------------------------------------

const DOM = {
    form: null,
    runButton: null,
    resetButton: null,

    topCards: null,
    validationArea: null,
    recommendationArea: null,
    taxArea: null,
    socialSecurityArea: null,
    monteCarloArea: null,
    accountBreakdownArea: null,
    incomePlanArea: null,

    retirementBreakdownChartId: "retirementBreakdownChart",
    nonRetirementBreakdownChartId: "nonRetirementBreakdownChart",
    growthProjectionChartId: "growthProjectionChart",
    rothPretaxChartId: "rothPretaxChart",
    householdNetWorthChartId: "householdNetWorthChart",
    retirementIncomeChartId: "retirementIncomeChart"
}

// ----------------------------------------
// account row management
// Expected HTML containers:
// #accountsContainer
// #spouseAccountsContainer
// ----------------------------------------

let accountRowIdCounter = 0

const ACCOUNT_OPTIONS = [
    { value: "401k", label: "401(k)" },
    { value: "401a", label: "401(a)" },
    { value: "403b", label: "403(b)" },
    { value: "457b", label: "457(b)" },
    { value: "tradIRA", label: "Traditional IRA" },
    { value: "rothIRA", label: "Roth IRA" },
    { value: "hsa", label: "HSA" },
    { value: "brokerage", label: "Brokerage" },
    { value: "savings", label: "Savings" },
    { value: "cash", label: "Cash" }
]

function buildAccountTypeOptions() {
    return ACCOUNT_OPTIONS.map(option => {
        return `<option value="${option.value}">${option.label}</option>`
    }).join("")
}

function buildAccountRowHTML(rowId, isSpouse = false) {
    const prefix = isSpouse ? "spouse-" : "person-"

    return `
        <div class="planner-account-row" data-row-id="${rowId}" data-owner="${prefix}">
            <div class="planner-account-grid">
                <div>
                    <label>Account Type</label>
                    <select class="account-type">
                        ${buildAccountTypeOptions()}
                    </select>
                </div>

                <div>
                    <label>Label</label>
                    <input class="account-label" placeholder="My 401(k)" />
                </div>

                <div>
                    <label>Current Balance</label>
                    <input class="account-balance" type="number" placeholder="50000" />
                </div>

                <div>
                    <label>Growth Rate %</label>
                    <input class="account-growth-rate" type="number" step="0.1" placeholder="7" value="7" />
                </div>

                <div>
                    <label>Annual Contribution</label>
                    <input class="account-annual-contribution" type="number" placeholder="12000" />
                </div>

                <div>
                    <label>Income for % Calculations</label>
                    <input class="account-income" type="number" placeholder="120000" />
                </div>

                <div>
                    <label>Employee Contribution %</label>
                    <input class="account-employee-contribution-percent" type="number" step="0.1" placeholder="10" />
                </div>

                <div>
                    <label>Roth Slider %</label>
                    <input class="account-roth-slider-percent" type="number" step="1" min="0" max="100" placeholder="40" />
                </div>

                <div>
                    <label>Employer Match %</label>
                    <input class="account-employer-match-percent" type="number" step="0.1" placeholder="4" />
                </div>

                <div>
                    <label>Employer Profit Sharing %</label>
                    <input class="account-employer-profit-sharing-percent" type="number" step="0.1" placeholder="3" />
                </div>

                <div>
                    <label>Employer Contribution %</label>
                    <input class="account-employer-contribution-percent" type="number" step="0.1" placeholder="5" />
                </div>

                <div>
                    <label>Employer 401(a) Profit %</label>
                    <input class="account-employer-401a-profit-percent" type="number" step="0.1" placeholder="0" />
                </div>
            </div>

            <div class="planner-account-actions">
                <button type="button" class="remove-account-btn">Remove Account</button>
            </div>
        </div>
    `
}

function addAccountRow(containerId, isSpouse = false) {
    const container = document.getElementById(containerId)
    if (!container) return

    accountRowIdCounter += 1
    container.insertAdjacentHTML("beforeend", buildAccountRowHTML(accountRowIdCounter, isSpouse))

    const row = container.querySelector(`[data-row-id="${accountRowIdCounter}"]`)
    const removeBtn = row?.querySelector(".remove-account-btn")

    if (removeBtn) {
        removeBtn.addEventListener("click", () => {
            row.remove()
        })
    }
}

function getAccountsFromContainer(containerId, defaultIncome = 0) {
    const container = document.getElementById(containerId)
    if (!container) return []

    const rows = [...container.querySelectorAll(".planner-account-row")]

    return rows.map(row => {
        const get = selector => row.querySelector(selector)

        return {
            type: get(".account-type")?.value || "brokerage",
            label: get(".account-label")?.value || "",
            balance: clampNumber(get(".account-balance")?.value),
            growthRate: clampNumber(get(".account-growth-rate")?.value || 7),
            annualContribution: clampNumber(get(".account-annual-contribution")?.value),
            income: clampNumber(get(".account-income")?.value || defaultIncome),
            employeeContributionPercent: clampNumber(get(".account-employee-contribution-percent")?.value),
            rothSliderPercent: clampNumber(get(".account-roth-slider-percent")?.value),
            employerMatchPercent: clampNumber(get(".account-employer-match-percent")?.value),
            employerProfitSharingPercent: clampNumber(get(".account-employer-profit-sharing-percent")?.value),
            employerContributionPercent: clampNumber(get(".account-employer-contribution-percent")?.value),
            employerProfitSharingPercent401a: clampNumber(get(".account-employer-401a-profit-percent")?.value),
            employerProfitSharingPercent: clampNumber(
                get(".account-employer-profit-sharing-percent")?.value ||
                get(".account-employer-401a-profit-percent")?.value
            )
        }
    })
}

// ----------------------------------------
// state dropdowns
// Expected:
// #currentState
// #retirementState
// ----------------------------------------

function populateStateDropdown(selectId) {
    const select = document.getElementById(selectId)
    if (!select) return

    const states = listStateOptions()

    select.innerHTML = states.map(state => {
        return `<option value="${state.code}">${state.name}</option>`
    }).join("")
}

function populateAllStateDropdowns() {
    populateStateDropdown("currentState")
    populateStateDropdown("retirementState")

    const currentState = document.getElementById("currentState")
    const retirementState = document.getElementById("retirementState")

    if (currentState) currentState.value = "UT"
    if (retirementState) retirementState.value = "UT"
}

// ----------------------------------------
// collect planner inputs from DOM
// Expected input ids listed below
// ----------------------------------------

function collectPlannerInputs() {
    const personal = {
        currentAge: numberValue("currentAge"),
        retirementAge: numberValue("retirementAge"),
        planningAge: numberValue("planningAge"),
        currentIncome: numberValue("currentIncome"),
        annualSpendingGoal: numberValue("annualSpendingGoal"),
        annualPensionIncome: numberValue("personalPensionIncome"),
        socialSecurity: {
            currentAge: numberValue("currentAge"),
            birthYear: numberValue("birthYear"),
            claimingAge: numberValue("ssClaimAge"),
            piaMonthly: numberValue("ssPIAMonthly")
        }
    }

    const spouse = {
        currentAge: numberValue("spouseCurrentAge"),
        retirementAge: numberValue("spouseRetirementAge") || numberValue("retirementAge"),
        planningAge: numberValue("spousePlanningAge") || numberValue("planningAge"),
        currentIncome: numberValue("spouseCurrentIncome"),
        annualPensionIncome: numberValue("spousePensionIncome"),
        socialSecurity: {
            currentAge: numberValue("spouseCurrentAge"),
            birthYear: numberValue("spouseBirthYear"),
            claimingAge: numberValue("spouseSSClaimAge"),
            piaMonthly: numberValue("spouseSSPIAMonthly")
        }
    }

    const household = {
        filingStatus: textValue("filingStatus") || "single",
        currentState: textValue("currentState") || "UT",
        retirementState: textValue("retirementState") || textValue("currentState") || "UT",
        annualSpendingGoal: numberValue("annualSpendingGoal"),
        totalAnnualRetirementContribution: numberValue("totalAnnualRetirementContribution"),
        totalAnnualSavings: numberValue("totalAnnualSavings"),
        currentTotalInvestedAssets: numberValue("currentTotalInvestedAssets"),
        expectedReturn: numberValue("expectedReturn") || 7,
        expectedVolatility: numberValue("expectedVolatility") || 15,
        expectedInflation: numberValue("expectedInflation") || 2.5,
        annualContributionGrowthRate: numberValue("annualContributionGrowthRate"),
        simulationCount: numberValue("simulationCount") || 1000,
        spendingGrowthMode: textValue("spendingGrowthMode") || "inflation",
        wantsEarlyRetirement: checkedValue("wantsEarlyRetirement")
    }

    const accounts = getAccountsFromContainer("accountsContainer", personal.currentIncome)
    const spouseAccounts = getAccountsFromContainer("spouseAccountsContainer", spouse.currentIncome)

    return {
        personal,
        spouse,
        household,
        accounts,
        spouseAccounts
    }
}

// ----------------------------------------
// render validation
// ----------------------------------------

function renderValidation(validation) {
    if (!DOM.validationArea) return

    const errors = validation?.errors || []
    const warnings = validation?.warnings || []

    if (!errors.length && !warnings.length) {
        DOM.validationArea.innerHTML = ""
        hideElement("validationArea")
        return
    }

    showElement("validationArea")

    DOM.validationArea.innerHTML = `
        <div class="planner-validation-card">
            ${errors.length ? `
                <div class="planner-validation-block planner-error-block">
                    <div class="planner-section-heading">Please fix these first</div>
                    <ul>
                        ${errors.map(error => `<li>${error}</li>`).join("")}
                    </ul>
                </div>
            ` : ""}
            ${warnings.length ? `
                <div class="planner-validation-block planner-warning-block">
                    <div class="planner-section-heading">Warnings</div>
                    <ul>
                        ${warnings.map(warning => `<li>${warning}</li>`).join("")}
                    </ul>
                </div>
            ` : ""}
        </div>
    `
}

// ----------------------------------------
// render top cards
// ----------------------------------------

function renderTopCards(cards = []) {
    if (!DOM.topCards) return

    DOM.topCards.innerHTML = cards.map(card => `
        <div class="planner-top-card">
            <div class="planner-top-card-title">${card.title}</div>
            <div class="planner-top-card-value">${card.value}</div>
            <div class="planner-top-card-sub">${card.sub}</div>
        </div>
    `).join("")
}

// ----------------------------------------
// render recommendation
// ----------------------------------------

function renderRecommendation(plan) {
    if (!DOM.recommendationArea) return

    const rec = plan?.contributionRecommendation?.recommendation
    const comparison = plan?.contributionRecommendation?.comparison

    if (!rec) {
        DOM.recommendationArea.innerHTML = ""
        return
    }

    DOM.recommendationArea.innerHTML = `
        <div class="planner-detail-card">
            <div class="planner-section-heading">Roth vs Pretax Recommendation</div>
            <div class="planner-big-callout">${rec.title || "Recommendation"}</div>
            <p>${rec.explanation || ""}</p>

            <div class="planner-two-col">
                <div class="planner-mini-stat">
                    <div class="planner-mini-stat-label">Current marginal tax rate</div>
                    <div class="planner-mini-stat-value">${formatPercent(rec.currentCombinedMarginalRate || 0)}</div>
                </div>
                <div class="planner-mini-stat">
                    <div class="planner-mini-stat-label">Estimated retirement marginal rate</div>
                    <div class="planner-mini-stat-value">${formatPercent(rec.retirementCombinedMarginalRate || 0)}</div>
                </div>
                <div class="planner-mini-stat">
                    <div class="planner-mini-stat-label">Pretax immediate tax savings</div>
                    <div class="planner-mini-stat-value">${formatCurrency(comparison?.immediatePretaxTaxSavings || 0)}</div>
                </div>
                <div class="planner-mini-stat">
                    <div class="planner-mini-stat-label">Pretax out-of-pocket cost</div>
                    <div class="planner-mini-stat-value">${formatCurrency(comparison?.pretaxContributionOutOfPocket || 0)}</div>
                </div>
            </div>

            <div class="planner-reason-list">
                ${(rec.reasons || []).map(reason => `<div class="planner-reason-item">• ${reason}</div>`).join("")}
            </div>
        </div>
    `
}

// ----------------------------------------
// render tax section
// ----------------------------------------

function renderTaxAnalysis(plan) {
    if (!DOM.taxArea) return

    const currentTax = plan?.taxes?.currentTax
    const retirementTax = plan?.taxes?.retirementTax

    DOM.taxArea.innerHTML = `
        <div class="planner-detail-card">
            <div class="planner-section-heading">Tax Snapshot</div>

            <div class="planner-two-col">
                <div class="planner-tax-box">
                    <div class="planner-subheading">Today</div>
                    <div>Gross income: <strong>${formatCurrency(currentTax?.grossIncome || 0)}</strong></div>
                    <div>Total tax: <strong>${formatCurrency(currentTax?.totalTax || 0)}</strong></div>
                    <div>After-tax income: <strong>${formatCurrency(currentTax?.afterTaxIncome || 0)}</strong></div>
                    <div>Effective tax rate: <strong>${formatPercent(currentTax?.effectiveRate || 0)}</strong></div>
                    <div>Marginal tax rate: <strong>${formatPercent(currentTax?.combinedMarginalRate || 0)}</strong></div>
                </div>

                <div class="planner-tax-box">
                    <div class="planner-subheading">Retirement Estimate</div>
                    <div>Gross retirement income: <strong>${formatCurrency(retirementTax?.grossIncome || 0)}</strong></div>
                    <div>Total tax: <strong>${formatCurrency(retirementTax?.totalTax || 0)}</strong></div>
                    <div>Net retirement income: <strong>${formatCurrency(retirementTax?.netRetirementIncome || 0)}</strong></div>
                    <div>Effective tax rate: <strong>${formatPercent(retirementTax?.effectiveRate || 0)}</strong></div>
                    <div>Marginal tax rate: <strong>${formatPercent(retirementTax?.combinedMarginalRate || 0)}</strong></div>
                </div>
            </div>
        </div>
    `
}

// ----------------------------------------
// render social security
// ----------------------------------------

function renderSocialSecurity(plan) {
    if (!DOM.socialSecurityArea) return

    const ss = plan?.socialSecurity || {}
    const worker1 = ss.worker1Summary
    const worker2 = ss.worker2Summary
    const totalAnnual = ss.household?.annualTotal || 0
    const totalMonthly = ss.household?.monthlyTotal || 0

    DOM.socialSecurityArea.innerHTML = `
        <div class="planner-detail-card">
            <div class="planner-section-heading">Social Security</div>

            <div class="planner-two-col">
                <div class="planner-mini-stat">
                    <div class="planner-mini-stat-label">Household monthly estimate</div>
                    <div class="planner-mini-stat-value">${formatCurrency(totalMonthly)}</div>
                </div>
                <div class="planner-mini-stat">
                    <div class="planner-mini-stat-label">Household annual estimate</div>
                    <div class="planner-mini-stat-value">${formatCurrency(totalAnnual)}</div>
                </div>
            </div>

            <div class="planner-two-col">
                <div class="planner-tax-box">
                    <div class="planner-subheading">You</div>
                    <div>Claiming age: <strong>${worker1?.claimingAge || "-"}</strong></div>
                    <div>Monthly benefit: <strong>${formatCurrency(worker1?.monthlyBenefit || 0)}</strong></div>
                    <div>Annual benefit: <strong>${formatCurrency(worker1?.annualBenefit || 0)}</strong></div>
                    <div>FRA: <strong>${worker1?.fraLabel || "-"}</strong></div>
                    <div>Break-even vs 62: <strong>${worker1?.breakEvenVs62Age || "-"}</strong></div>
                </div>

                <div class="planner-tax-box">
                    <div class="planner-subheading">Spouse</div>
                    <div>Claiming age: <strong>${worker2?.claimingAge || "-"}</strong></div>
                    <div>Monthly benefit: <strong>${formatCurrency(worker2?.monthlyBenefit || 0)}</strong></div>
                    <div>Annual benefit: <strong>${formatCurrency(worker2?.annualBenefit || 0)}</strong></div>
                    <div>FRA: <strong>${worker2?.fraLabel || "-"}</strong></div>
                    <div>Break-even vs 62: <strong>${worker2?.breakEvenVs62Age || "-"}</strong></div>
                </div>
            </div>
        </div>
    `
}

// ----------------------------------------
// render income plan
// ----------------------------------------

function renderIncomePlan(plan) {
    if (!DOM.incomePlanArea) return

    const income = plan?.retirementIncome || {}
    const readiness = income?.readiness || {}

    DOM.incomePlanArea.innerHTML = `
        <div class="planner-detail-card">
            <div class="planner-section-heading">Retirement Income Plan</div>

            <div class="planner-three-col">
                <div class="planner-mini-stat">
                    <div class="planner-mini-stat-label">Safe withdrawal</div>
                    <div class="planner-mini-stat-value">${formatCurrency(income.safeWithdrawal || 0)}</div>
                </div>
                <div class="planner-mini-stat">
                    <div class="planner-mini-stat-label">Guaranteed income</div>
                    <div class="planner-mini-stat-value">${formatCurrency(income.totalGuaranteedIncome || 0)}</div>
                </div>
                <div class="planner-mini-stat">
                    <div class="planner-mini-stat-label">Estimated available income</div>
                    <div class="planner-mini-stat-value">${formatCurrency(income.estimatedAvailableIncome || 0)}</div>
                </div>
            </div>

            <div class="planner-three-col">
                <div class="planner-mini-stat">
                    <div class="planner-mini-stat-label">Spending goal</div>
                    <div class="planner-mini-stat-value">${formatCurrency(income.spendingGoal || 0)}</div>
                </div>
                <div class="planner-mini-stat">
                    <div class="planner-mini-stat-label">Spending gap</div>
                    <div class="planner-mini-stat-value">${formatCurrency(income.spendingGap || 0)}</div>
                </div>
                <div class="planner-mini-stat">
                    <div class="planner-mini-stat-label">Readiness</div>
                    <div class="planner-mini-stat-value">${readiness.status || "-"}</div>
                </div>
            </div>
        </div>
    `
}

// ----------------------------------------
// render monte carlo
// ----------------------------------------

function renderMonteCarlo(plan) {
    if (!DOM.monteCarloArea) return

    const summary = plan?.monteCarlo?.summary || {}
    const interpretation = summary?.interpretation || {}

    DOM.monteCarloArea.innerHTML = `
        <div class="planner-detail-card">
            <div class="planner-section-heading">Monte Carlo Probability Analysis</div>

            <div class="planner-big-callout">${formatPercent(summary.successRate || 0, 0)} Success Rate</div>
            <p>${interpretation.message || ""}</p>

            <div class="planner-three-col">
                <div class="planner-mini-stat">
                    <div class="planner-mini-stat-label">Median ending value</div>
                    <div class="planner-mini-stat-value">${formatCurrency(summary.medianEndingValue || 0)}</div>
                </div>
                <div class="planner-mini-stat">
                    <div class="planner-mini-stat-label">10th percentile ending value</div>
                    <div class="planner-mini-stat-value">${formatCurrency(summary.p10EndingValue || 0)}</div>
                </div>
                <div class="planner-mini-stat">
                    <div class="planner-mini-stat-label">90th percentile ending value</div>
                    <div class="planner-mini-stat-value">${formatCurrency(summary.p90EndingValue || 0)}</div>
                </div>
            </div>

            <div class="planner-three-col">
                <div class="planner-mini-stat">
                    <div class="planner-mini-stat-label">Success interpretation</div>
                    <div class="planner-mini-stat-value">${interpretation.label || "-"}</div>
                </div>
                <div class="planner-mini-stat">
                    <div class="planner-mini-stat-label">Median failure age</div>
                    <div class="planner-mini-stat-value">${summary.medianFailureAge || "-"}</div>
                </div>
                <div class="planner-mini-stat">
                    <div class="planner-mini-stat-label">Planning horizon</div>
                    <div class="planner-mini-stat-value">Through chosen planning age</div>
                </div>
            </div>
        </div>
    `
}

// ----------------------------------------
// render account breakdown table
// ----------------------------------------

function renderAccountBreakdown(plan) {
    if (!DOM.accountBreakdownArea) return

    const accounts = plan?.projections?.combinedProjectedAccounts || []

    DOM.accountBreakdownArea.innerHTML = `
        <div class="planner-detail-card">
            <div class="planner-section-heading">Projected Account Breakdown at Retirement</div>

            <div class="planner-table-wrap">
                <table class="planner-table">
                    <thead>
                        <tr>
                            <th>Account</th>
                            <th>Type</th>
                            <th>Retirement?</th>
                            <th>Current Balance</th>
                            <th>Annual Contribution</th>
                            <th>Growth Rate</th>
                            <th>Projected Balance</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${accounts.map(account => `
                            <tr>
                                <td>${account.label || account.type}</td>
                                <td>${account.type}</td>
                                <td>${account.retirement ? "Yes" : "No"}</td>
                                <td>${formatCurrency(account.balance || 0)}</td>
                                <td>${formatCurrency(account.annualContribution || 0)}</td>
                                <td>${clampNumber(account.growthRate || 0).toFixed(1)}%</td>
                                <td>${formatCurrency(account.futureBalance || 0)}</td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            </div>
        </div>
    `
}

// ----------------------------------------
// chart rendering
// ----------------------------------------

function renderCharts(plan) {
    const chartData = buildPlannerChartData(plan)

    try {
        if (chartData.retirementBreakdown?.length) {
            renderRetirementBreakdownChart(DOM.retirementBreakdownChartId, chartData.retirementBreakdown)
        } else {
            renderEmptyDoughnutChart(DOM.retirementBreakdownChartId, "Retirement Accounts Breakdown")
        }

        if (chartData.nonRetirementBreakdown?.length) {
            renderNonRetirementBreakdownChart(DOM.nonRetirementBreakdownChartId, chartData.nonRetirementBreakdown)
        } else {
            renderEmptyDoughnutChart(DOM.nonRetirementBreakdownChartId, "Non-Retirement Accounts Breakdown")
        }

        if (chartData.growthProjection?.labels?.length) {
            renderGrowthProjectionChart(DOM.growthProjectionChartId, chartData.growthProjection.labels, {
                total: chartData.growthProjection.total,
                retirement: chartData.growthProjection.retirement,
                nonRetirement: chartData.growthProjection.nonRetirement
            })
        } else {
            renderEmptyLineChart(DOM.growthProjectionChartId, "Projected Wealth Growth")
        }

        renderRothPretaxChart(DOM.rothPretaxChartId, chartData.rothPretax)
        renderHouseholdNetWorthChart(DOM.householdNetWorthChartId, chartData.householdNetWorth)
        renderRetirementIncomeChart(DOM.retirementIncomeChartId, chartData.retirementIncome)
    } catch (error) {
        console.error("Chart rendering failed:", error)
    }
}

// ----------------------------------------
// run the planner
// ----------------------------------------

function runPlanner() {
    const inputs = collectPlannerInputs()
    const validation = validatePlannerInputs(inputs)

    renderValidation(validation)

    if (!validation.valid) {
        return
    }

    const plan = buildRetirementPlan(inputs)
    const cards = buildTopLevelCards(plan)

    renderTopCards(cards)
    renderRecommendation(plan)
    renderTaxAnalysis(plan)
    renderSocialSecurity(plan)
    renderIncomePlan(plan)
    renderMonteCarlo(plan)
    renderAccountBreakdown(plan)

    destroyAllCharts()
    renderCharts(plan)
}

// ----------------------------------------
// reset planner
// ----------------------------------------

function resetPlanner() {
    if (DOM.form) {
        DOM.form.reset()
    }

    const accountsContainer = document.getElementById("accountsContainer")
    const spouseAccountsContainer = document.getElementById("spouseAccountsContainer")

    if (accountsContainer) accountsContainer.innerHTML = ""
    if (spouseAccountsContainer) spouseAccountsContainer.innerHTML = ""

    setHTML("topCards", "")
    setHTML("validationArea", "")
    setHTML("recommendationArea", "")
    setHTML("taxArea", "")
    setHTML("socialSecurityArea", "")
    setHTML("monteCarloArea", "")
    setHTML("accountBreakdownArea", "")
    setHTML("incomePlanArea", "")

    destroyAllCharts()

    try {
        renderEmptyDoughnutChart(DOM.retirementBreakdownChartId, "Retirement Accounts Breakdown")
        renderEmptyDoughnutChart(DOM.nonRetirementBreakdownChartId, "Non-Retirement Accounts Breakdown")
        renderEmptyLineChart(DOM.growthProjectionChartId, "Projected Wealth Growth")
        renderEmptyLineChart(DOM.rothPretaxChartId, "Roth vs Pretax vs Taxable")
        renderEmptyLineChart(DOM.householdNetWorthChartId, "Household Net Worth Projection")
        renderEmptyLineChart(DOM.retirementIncomeChartId, "Retirement Income vs Expenses")
    } catch (error) {
        console.warn("Could not render empty charts on reset:", error)
    }
}

// ----------------------------------------
// init
// ----------------------------------------

export function initializePlannerApp() {
    DOM.form = document.getElementById("plannerForm")
    DOM.runButton = document.getElementById("runPlannerBtn")
    DOM.resetButton = document.getElementById("resetPlannerBtn")

    DOM.topCards = document.getElementById("topCards")
    DOM.validationArea = document.getElementById("validationArea")
    DOM.recommendationArea = document.getElementById("recommendationArea")
    DOM.taxArea = document.getElementById("taxArea")
    DOM.socialSecurityArea = document.getElementById("socialSecurityArea")
    DOM.monteCarloArea = document.getElementById("monteCarloArea")
    DOM.accountBreakdownArea = document.getElementById("accountBreakdownArea")
    DOM.incomePlanArea = document.getElementById("incomePlanArea")

    populateAllStateDropdowns()

    const addAccountBtn = document.getElementById("addAccountBtn")
    const addSpouseAccountBtn = document.getElementById("addSpouseAccountBtn")

    if (addAccountBtn) {
        addAccountBtn.addEventListener("click", () => addAccountRow("accountsContainer", false))
    }

    if (addSpouseAccountBtn) {
        addSpouseAccountBtn.addEventListener("click", () => addAccountRow("spouseAccountsContainer", true))
    }

    if (DOM.runButton) {
        DOM.runButton.addEventListener("click", runPlanner)
    }

    if (DOM.resetButton) {
        DOM.resetButton.addEventListener("click", resetPlanner)
    }

    window.addEventListener("resize", () => {
        resizeAllCharts()
    })

    if (!document.getElementById("accountsContainer")?.children?.length) {
        addAccountRow("accountsContainer", false)
    }

    try {
        renderEmptyDoughnutChart(DOM.retirementBreakdownChartId, "Retirement Accounts Breakdown")
        renderEmptyDoughnutChart(DOM.nonRetirementBreakdownChartId, "Non-Retirement Accounts Breakdown")
        renderEmptyLineChart(DOM.growthProjectionChartId, "Projected Wealth Growth")
        renderEmptyLineChart(DOM.rothPretaxChartId, "Roth vs Pretax vs Taxable")
        renderEmptyLineChart(DOM.householdNetWorthChartId, "Household Net Worth Projection")
        renderEmptyLineChart(DOM.retirementIncomeChartId, "Retirement Income vs Expenses")
    } catch (error) {
        console.warn("Initial empty chart render skipped:", error)
    }
}