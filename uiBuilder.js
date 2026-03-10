// ========================================
// UI BUILDER
// Reusable HTML builders for planner UI
// Helps keep calculator.js cleaner
// ========================================

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

export function formatNumber(value, digits = 0) {
    return new Intl.NumberFormat("en-US", {
        maximumFractionDigits: digits
    }).format(clampNumber(value))
}

export function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;")
}

export function joinClassNames(...classes) {
    return classes.filter(Boolean).join(" ")
}

// ----------------------------------------
// basic wrappers
// ----------------------------------------

export function buildSectionHeading(title, subtitle = "") {
    return `
        <div class="planner-section-header">
            <div class="planner-section-heading">${escapeHtml(title)}</div>
            ${subtitle ? `<div class="planner-section-subheading">${escapeHtml(subtitle)}</div>` : ""}
        </div>
    `
}

export function buildDetailCard({
    title = "",
    subtitle = "",
    body = "",
    extraClass = ""
} = {}) {
    return `
        <div class="${joinClassNames("planner-detail-card", extraClass)}">
            ${title ? buildSectionHeading(title, subtitle) : ""}
            ${body}
        </div>
    `
}

export function buildPanel({
    title = "",
    subtitle = "",
    body = "",
    extraClass = ""
} = {}) {
    return `
        <section class="${joinClassNames("planner-panel", extraClass)}">
            ${title ? buildSectionHeading(title, subtitle) : ""}
            ${body}
        </section>
    `
}

export function buildEmptyState({
    title = "Nothing to show yet",
    message = "Add data and run the planner."
} = {}) {
    return `
        <div class="planner-empty-state">
            <div class="planner-empty-state-title">${escapeHtml(title)}</div>
            <div class="planner-empty-state-message">${escapeHtml(message)}</div>
        </div>
    `
}

// ----------------------------------------
// stat cards
// ----------------------------------------

export function buildTopStatCard({
    title = "",
    value = "",
    sub = "",
    tone = "default"
} = {}) {
    return `
        <div class="planner-top-card planner-tone-${escapeHtml(tone)}">
            <div class="planner-top-card-title">${escapeHtml(title)}</div>
            <div class="planner-top-card-value">${value}</div>
            <div class="planner-top-card-sub">${escapeHtml(sub)}</div>
        </div>
    `
}

export function buildTopStatCards(cards = []) {
    if (!cards.length) {
        return buildEmptyState({
            title: "No summary yet",
            message: "Run the planner to see your summary cards."
        })
    }

    return `
        <div class="planner-top-card-grid">
            ${cards.map(card => buildTopStatCard(card)).join("")}
        </div>
    `
}

export function buildMiniStat({
    label = "",
    value = "",
    sub = "",
    tone = "default"
} = {}) {
    return `
        <div class="${joinClassNames("planner-mini-stat", `planner-tone-${escapeHtml(tone)}`)}">
            <div class="planner-mini-stat-label">${escapeHtml(label)}</div>
            <div class="planner-mini-stat-value">${value}</div>
            ${sub ? `<div class="planner-mini-stat-sub">${escapeHtml(sub)}</div>` : ""}
        </div>
    `
}

export function buildMiniStatGrid(items = [], columns = 3) {
    if (!items.length) {
        return buildEmptyState({
            title: "No stats yet",
            message: "This section will populate after you run the planner."
        })
    }

    const gridClass =
        columns === 2 ? "planner-two-col" :
        columns === 4 ? "planner-four-col" :
        "planner-three-col"

    return `
        <div class="${gridClass}">
            ${items.map(item => buildMiniStat(item)).join("")}
        </div>
    `
}

// ----------------------------------------
// alerts / calls / notices
// ----------------------------------------

export function buildAlert({
    title = "",
    message = "",
    tone = "info",
    bullets = []
} = {}) {
    return `
        <div class="${joinClassNames("planner-alert", `planner-alert-${escapeHtml(tone)}`)}">
            ${title ? `<div class="planner-alert-title">${escapeHtml(title)}</div>` : ""}
            ${message ? `<div class="planner-alert-message">${escapeHtml(message)}</div>` : ""}
            ${bullets.length ? `
                <ul class="planner-alert-list">
                    ${bullets.map(item => `<li>${escapeHtml(item)}</li>`).join("")}
                </ul>
            ` : ""}
        </div>
    `
}

export function buildBigCallout({
    value = "",
    label = "",
    tone = "default"
} = {}) {
    return `
        <div class="${joinClassNames("planner-big-callout-wrap", `planner-tone-${escapeHtml(tone)}`)}">
            <div class="planner-big-callout">${value}</div>
            ${label ? `<div class="planner-big-callout-label">${escapeHtml(label)}</div>` : ""}
        </div>
    `
}

// ----------------------------------------
// lists / bullets / reasons
// ----------------------------------------

export function buildReasonList(reasons = [], emptyText = "No explanation available.") {
    if (!reasons.length) {
        return `<div class="planner-reason-empty">${escapeHtml(emptyText)}</div>`
    }

    return `
        <div class="planner-reason-list">
            ${reasons.map(reason => `
                <div class="planner-reason-item">
                    <span class="planner-reason-bullet">•</span>
                    <span class="planner-reason-text">${escapeHtml(reason)}</span>
                </div>
            `).join("")}
        </div>
    `
}

export function buildSimpleList(items = []) {
    if (!items.length) {
        return ""
    }

    return `
        <ul class="planner-simple-list">
            ${items.map(item => `<li>${escapeHtml(item)}</li>`).join("")}
        </ul>
    `
}

// ----------------------------------------
// tax / recommendation blocks
// ----------------------------------------

export function buildRecommendationCard({
    title = "Recommendation",
    explanation = "",
    reasons = [],
    stats = []
} = {}) {
    const body = `
        ${buildBigCallout({
            value: escapeHtml(title),
            label: "Recommendation",
            tone: "good"
        })}
        ${explanation ? `<p class="planner-body-copy">${escapeHtml(explanation)}</p>` : ""}
        ${stats.length ? buildMiniStatGrid(stats, 2) : ""}
        ${buildReasonList(reasons)}
    `

    return buildDetailCard({
        title: "Roth vs Pretax Recommendation",
        body
    })
}

export function buildTaxComparisonCard({
    today = {},
    retirement = {}
} = {}) {
    const body = `
        <div class="planner-two-col">
            <div class="planner-tax-box">
                <div class="planner-subheading">Today</div>
                <div>Gross income: <strong>${formatCurrency(today.grossIncome || 0)}</strong></div>
                <div>Total tax: <strong>${formatCurrency(today.totalTax || 0)}</strong></div>
                <div>Federal tax: <strong>${formatCurrency(today.federalTax || 0)}</strong></div>
                <div>State tax: <strong>${formatCurrency(today.stateTax || 0)}</strong></div>
                <div>Effective rate: <strong>${formatPercent(today.effectiveRate || 0)}</strong></div>
                <div>Marginal rate: <strong>${formatPercent(today.marginalRate || 0)}</strong></div>
            </div>

            <div class="planner-tax-box">
                <div class="planner-subheading">Retirement</div>
                <div>Gross income: <strong>${formatCurrency(retirement.grossIncome || 0)}</strong></div>
                <div>Total tax: <strong>${formatCurrency(retirement.totalTax || 0)}</strong></div>
                <div>Federal tax: <strong>${formatCurrency(retirement.federalTax || 0)}</strong></div>
                <div>State tax: <strong>${formatCurrency(retirement.stateTax || 0)}</strong></div>
                <div>Effective rate: <strong>${formatPercent(retirement.effectiveRate || 0)}</strong></div>
                <div>Marginal rate: <strong>${formatPercent(retirement.marginalRate || 0)}</strong></div>
            </div>
        </div>
    `

    return buildDetailCard({
        title: "Tax Snapshot",
        subtitle: "Side-by-side estimate of now vs retirement",
        body
    })
}

// ----------------------------------------
// monte carlo card
// ----------------------------------------

export function buildMonteCarloCard({
    successRate = 0,
    interpretationLabel = "",
    interpretationMessage = "",
    medianEndingValue = 0,
    p10EndingValue = 0,
    p90EndingValue = 0,
    medianFailureAge = null
} = {}) {
    const body = `
        ${buildBigCallout({
            value: formatPercent(successRate, 0),
            label: "Success Rate Through Planning Age",
            tone: successRate >= 0.75 ? "good" : successRate >= 0.6 ? "mid" : "bad"
        })}

        ${interpretationMessage ? `<p class="planner-body-copy">${escapeHtml(interpretationMessage)}</p>` : ""}

        ${buildMiniStatGrid([
            {
                label: "Interpretation",
                value: escapeHtml(interpretationLabel || "-")
            },
            {
                label: "Median ending value",
                value: formatCurrency(medianEndingValue)
            },
            {
                label: "10th percentile",
                value: formatCurrency(p10EndingValue)
            },
            {
                label: "90th percentile",
                value: formatCurrency(p90EndingValue)
            },
            {
                label: "Median failure age",
                value: medianFailureAge ?? "-"
            }
        ], 3)}
    `

    return buildDetailCard({
        title: "Monte Carlo Probability Analysis",
        body
    })
}

// ----------------------------------------
// retirement income card
// ----------------------------------------

export function buildIncomePlanCard({
    safeWithdrawal = 0,
    guaranteedIncome = 0,
    estimatedAvailableIncome = 0,
    spendingGoal = 0,
    spendingGap = 0,
    readinessStatus = "",
    readinessScore = null
} = {}) {
    const body = `
        ${buildMiniStatGrid([
            {
                label: "Safe withdrawal",
                value: formatCurrency(safeWithdrawal)
            },
            {
                label: "Guaranteed income",
                value: formatCurrency(guaranteedIncome)
            },
            {
                label: "Estimated available income",
                value: formatCurrency(estimatedAvailableIncome)
            },
            {
                label: "Spending goal",
                value: formatCurrency(spendingGoal)
            },
            {
                label: "Spending gap",
                value: formatCurrency(spendingGap)
            },
            {
                label: "Readiness",
                value: escapeHtml(readinessStatus || "-"),
                sub: readinessScore !== null ? `Score: ${formatPercent(readinessScore, 0)}` : ""
            }
        ], 3)}
    `

    return buildDetailCard({
        title: "Retirement Income Plan",
        subtitle: "Spending, withdrawals, and guaranteed income",
        body
    })
}

// ----------------------------------------
// social security card
// ----------------------------------------

export function buildSocialSecurityCard({
    householdMonthly = 0,
    householdAnnual = 0,
    worker1 = null,
    worker2 = null
} = {}) {
    const body = `
        ${buildMiniStatGrid([
            {
                label: "Household monthly estimate",
                value: formatCurrency(householdMonthly)
            },
            {
                label: "Household annual estimate",
                value: formatCurrency(householdAnnual)
            }
        ], 2)}

        <div class="planner-two-col">
            <div class="planner-tax-box">
                <div class="planner-subheading">You</div>
                <div>Claiming age: <strong>${escapeHtml(worker1?.claimingAge ?? "-")}</strong></div>
                <div>Monthly benefit: <strong>${formatCurrency(worker1?.monthlyBenefit || 0)}</strong></div>
                <div>Annual benefit: <strong>${formatCurrency(worker1?.annualBenefit || 0)}</strong></div>
                <div>FRA: <strong>${escapeHtml(worker1?.fraLabel || "-")}</strong></div>
                <div>Break-even vs 62: <strong>${escapeHtml(worker1?.breakEvenVs62Age ?? "-")}</strong></div>
            </div>

            <div class="planner-tax-box">
                <div class="planner-subheading">Spouse</div>
                <div>Claiming age: <strong>${escapeHtml(worker2?.claimingAge ?? "-")}</strong></div>
                <div>Monthly benefit: <strong>${formatCurrency(worker2?.monthlyBenefit || 0)}</strong></div>
                <div>Annual benefit: <strong>${formatCurrency(worker2?.annualBenefit || 0)}</strong></div>
                <div>FRA: <strong>${escapeHtml(worker2?.fraLabel || "-")}</strong></div>
                <div>Break-even vs 62: <strong>${escapeHtml(worker2?.breakEvenVs62Age ?? "-")}</strong></div>
            </div>
        </div>
    `

    return buildDetailCard({
        title: "Social Security",
        subtitle: "Claiming analysis and household estimate",
        body
    })
}

// ----------------------------------------
// chart wrappers
// ----------------------------------------

export function buildChartCard({
    title = "",
    subtitle = "",
    canvasId = ""
} = {}) {
    return `
        <div class="planner-detail-card planner-chart-card">
            ${buildSectionHeading(title, subtitle)}
            <div class="planner-chart-wrap">
                <canvas id="${escapeHtml(canvasId)}"></canvas>
            </div>
        </div>
    `
}

export function buildTwoChartGrid(cards = []) {
    return `
        <div class="planner-chart-grid planner-two-chart-grid">
            ${cards.join("")}
        </div>
    `
}

export function buildSingleChartGrid(card = "") {
    return `
        <div class="planner-chart-grid planner-single-chart-grid">
            ${card}
        </div>
    `
}

// ----------------------------------------
// tables
// ----------------------------------------

export function buildTable({
    columns = [],
    rows = [],
    emptyMessage = "No rows available."
} = {}) {
    if (!rows.length) {
        return buildEmptyState({
            title: "No table data",
            message: emptyMessage
        })
    }

    return `
        <div class="planner-table-wrap">
            <table class="planner-table">
                <thead>
                    <tr>
                        ${columns.map(column => `<th>${escapeHtml(column.label)}</th>`).join("")}
                    </tr>
                </thead>
                <tbody>
                    ${rows.map(row => `
                        <tr>
                            ${columns.map(column => {
                                const rawValue =
                                    typeof column.render === "function"
                                        ? column.render(row)
                                        : row[column.key]

                                return `<td>${rawValue ?? ""}</td>`
                            }).join("")}
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        </div>
    `
}

export function buildAccountBreakdownTable(accounts = []) {
    const columns = [
        {
            key: "label",
            label: "Account",
            render: row => escapeHtml(row.label || row.type || "Account")
        },
        {
            key: "type",
            label: "Type",
            render: row => escapeHtml(row.type || "-")
        },
        {
            key: "retirement",
            label: "Retirement?",
            render: row => row.retirement ? "Yes" : "No"
        },
        {
            key: "balance",
            label: "Current Balance",
            render: row => formatCurrency(row.balance || 0)
        },
        {
            key: "annualContribution",
            label: "Annual Contribution",
            render: row => formatCurrency(row.annualContribution || 0)
        },
        {
            key: "growthRate",
            label: "Growth Rate",
            render: row => `${formatNumber(row.growthRate || 0, 1)}%`
        },
        {
            key: "futureBalance",
            label: "Projected Balance",
            render: row => formatCurrency(row.futureBalance || 0)
        }
    ]

    return buildDetailCard({
        title: "Projected Account Breakdown at Retirement",
        body: buildTable({
            columns,
            rows: accounts,
            emptyMessage: "Add accounts to see your projected balances."
        })
    })
}

export function buildSensitivityTable({
    title = "Sensitivity Analysis",
    rows = [],
    mode = "spending"
} = {}) {
    let columns = []

    if (mode === "spending") {
        columns = [
            {
                key: "spending",
                label: "Annual Spending",
                render: row => formatCurrency(row.spending || 0)
            },
            {
                key: "multiplier",
                label: "Level",
                render: row => `${formatNumber((row.multiplier || 0) * 100, 0)}%`
            },
            {
                key: "successRate",
                label: "Success Rate",
                render: row => formatPercent(row.successRate || 0, 0)
            },
            {
                key: "medianEndingValue",
                label: "Median Ending Value",
                render: row => formatCurrency(row.medianEndingValue || 0)
            }
        ]
    } else if (mode === "retirementAge") {
        columns = [
            {
                key: "retirementAge",
                label: "Retirement Age",
                render: row => escapeHtml(row.retirementAge ?? "-")
            },
            {
                key: "successRate",
                label: "Success Rate",
                render: row => formatPercent(row.successRate || 0, 0)
            },
            {
                key: "medianEndingValue",
                label: "Median Ending Value",
                render: row => formatCurrency(row.medianEndingValue || 0)
            },
            {
                key: "medianFailureAge",
                label: "Median Failure Age",
                render: row => escapeHtml(row.medianFailureAge ?? "-")
            }
        ]
    }

    return buildDetailCard({
        title,
        body: buildTable({
            columns,
            rows,
            emptyMessage: "No sensitivity results yet."
        })
    })
}

// ----------------------------------------
// planner summary section builder
// ----------------------------------------

export function buildPlannerSummarySection({
    cards = [],
    recommendationHtml = "",
    taxHtml = "",
    socialSecurityHtml = "",
    incomePlanHtml = "",
    monteCarloHtml = "",
    accountsHtml = ""
} = {}) {
    return `
        ${buildTopStatCards(cards)}
        ${recommendationHtml}
        ${taxHtml}
        ${socialSecurityHtml}
        ${incomePlanHtml}
        ${monteCarloHtml}
        ${accountsHtml}
    `
}

// ----------------------------------------
// validation UI
// ----------------------------------------

export function buildValidationSummary({
    errors = [],
    warnings = []
} = {}) {
    if (!errors.length && !warnings.length) {
        return ""
    }

    return `
        <div class="planner-validation-card">
            ${errors.length ? buildAlert({
                title: "Please fix these first",
                tone: "error",
                bullets: errors
            }) : ""}
            ${warnings.length ? buildAlert({
                title: "Warnings",
                tone: "warning",
                bullets: warnings
            }) : ""}
        </div>
    `
}

// ----------------------------------------
// notes / helper text
// ----------------------------------------

export function buildInfoNote({
    title = "",
    message = ""
} = {}) {
    return `
        <div class="planner-info-note">
            ${title ? `<div class="planner-info-note-title">${escapeHtml(title)}</div>` : ""}
            ${message ? `<div class="planner-info-note-message">${escapeHtml(message)}</div>` : ""}
        </div>
    `
}

// ----------------------------------------
// dashboard section builders
// ----------------------------------------

export function buildDashboardSection({
    title = "",
    subtitle = "",
    content = ""
} = {}) {
    return `
        <section class="planner-dashboard-section">
            ${buildSectionHeading(title, subtitle)}
            ${content}
        </section>
    `
}

export function buildBreakdownRows(items = []) {
    if (!items.length) {
        return buildEmptyState({
            title: "No breakdown available",
            message: "Run the planner to see the account breakdown."
        })
    }

    return `
        <div class="planner-breakdown-list">
            ${items.map(item => `
                <div class="planner-breakdown-row">
                    <div class="planner-breakdown-label">${escapeHtml(item.label || "Item")}</div>
                    <div class="planner-breakdown-value">${formatCurrency(item.value || 0)}</div>
                </div>
            `).join("")}
        </div>
    `
}

// ----------------------------------------
// tabs helper
// ----------------------------------------

export function buildTabs({
    tabs = [],
    activeKey = ""
} = {}) {
    return `
        <div class="planner-tabs">
            ${tabs.map(tab => `
                <button
                    type="button"
                    class="${joinClassNames("planner-tab-btn", tab.key === activeKey ? "active" : "")}"
                    data-tab-key="${escapeHtml(tab.key)}"
                >
                    ${escapeHtml(tab.label)}
                </button>
            `).join("")}
        </div>
    `
}

// ----------------------------------------
// raw render helper
// ----------------------------------------

export function renderInto(elementOrId, html) {
    const el = typeof elementOrId === "string"
        ? document.getElementById(elementOrId)
        : elementOrId

    if (!el) return
    el.innerHTML = html
}