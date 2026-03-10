// ========================================
// CHARTS ENGINE
// Chart.js helpers for the wealth planner
// ========================================

let retirementBreakdownChartInstance = null
let nonRetirementBreakdownChartInstance = null
let growthProjectionChartInstance = null
let rothPretaxChartInstance = null
let householdNetWorthChartInstance = null
let retirementIncomeChartInstance = null

// ----------------------------------------
// format helpers
// ----------------------------------------

export function currencyTick(value) {
    const amount = Number(value) || 0

    if (Math.abs(amount) >= 1000000) {
        return `$${(amount / 1000000).toFixed(1)}M`
    }

    if (Math.abs(amount) >= 1000) {
        return `$${(amount / 1000).toFixed(0)}k`
    }

    return `$${Math.round(amount)}`
}

export function formatCurrency(value) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0
    }).format(Number(value) || 0)
}

function destroyIfExists(chartInstance) {
    if (chartInstance) {
        chartInstance.destroy()
    }
}

function getCanvasContext(canvasId) {
    const canvas = document.getElementById(canvasId)

    if (!canvas) {
        throw new Error(`Canvas with id "${canvasId}" was not found.`)
    }

    return canvas.getContext("2d")
}

// ----------------------------------------
// base options
// ----------------------------------------

function buildBaseLegendOptions(position = "bottom") {
    return {
        legend: {
            display: true,
            position,
            labels: {
                usePointStyle: true,
                padding: 16,
                boxWidth: 10,
                color: "#334155",
                font: {
                    size: 12,
                    weight: "600"
                }
            }
        }
    }
}

function buildBaseTooltipOptions() {
    return {
        callbacks: {
            label(context) {
                const label = context.label || ""
                const value = context.raw || 0
                return `${label}: ${formatCurrency(value)}`
            }
        }
    }
}

function buildCommonScales() {
    return {
        x: {
            grid: {
                color: "rgba(148, 163, 184, 0.12)"
            },
            ticks: {
                color: "#475569",
                font: {
                    size: 12
                }
            }
        },
        y: {
            beginAtZero: true,
            grid: {
                color: "rgba(148, 163, 184, 0.12)"
            },
            ticks: {
                color: "#475569",
                callback(value) {
                    return currencyTick(value)
                },
                font: {
                    size: 12
                }
            }
        }
    }
}

function buildDoughnutOptions(titleText = "") {
    return {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "58%",
        plugins: {
            ...buildBaseLegendOptions("bottom"),
            tooltip: buildBaseTooltipOptions(),
            title: {
                display: !!titleText,
                text: titleText,
                color: "#0f172a",
                font: {
                    size: 16,
                    weight: "700"
                },
                padding: {
                    bottom: 16
                }
            }
        }
    }
}

function buildLineOptions(titleText = "", stacked = false) {
    return {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: "index",
            intersect: false
        },
        plugins: {
            ...buildBaseLegendOptions("top"),
            tooltip: buildBaseTooltipOptions(),
            title: {
                display: !!titleText,
                text: titleText,
                color: "#0f172a",
                font: {
                    size: 16,
                    weight: "700"
                },
                padding: {
                    bottom: 16
                }
            }
        },
        scales: {
            ...buildCommonScales(),
            x: {
                ...buildCommonScales().x,
                stacked
            },
            y: {
                ...buildCommonScales().y,
                stacked
            }
        }
    }
}

function buildBarOptions(titleText = "", stacked = false) {
    return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            ...buildBaseLegendOptions("top"),
            tooltip: buildBaseTooltipOptions(),
            title: {
                display: !!titleText,
                text: titleText,
                color: "#0f172a",
                font: {
                    size: 16,
                    weight: "700"
                },
                padding: {
                    bottom: 16
                }
            }
        },
        scales: {
            x: {
                ...buildCommonScales().x,
                stacked
            },
            y: {
                ...buildCommonScales().y,
                stacked
            }
        }
    }
}

// ----------------------------------------
// colors
// ----------------------------------------

const PALETTE = {
    blue: "#2563eb",
    green: "#16a34a",
    purple: "#9333ea",
    orange: "#ea580c",
    pink: "#db2777",
    teal: "#0891b2",
    amber: "#f59e0b",
    slate: "#334155",
    cyan: "#06b6d4",
    indigo: "#4f46e5",
    emerald: "#10b981",
    red: "#ef4444"
}

const DOUGHNUT_COLORS = [
    PALETTE.blue,
    PALETTE.green,
    PALETTE.purple,
    PALETTE.orange,
    PALETTE.pink,
    PALETTE.teal,
    PALETTE.amber,
    PALETTE.indigo,
    PALETTE.cyan,
    PALETTE.emerald,
    PALETTE.red,
    PALETTE.slate
]

// ----------------------------------------
// sanitize chart data
// ----------------------------------------

function cleanBreakdownData(items = []) {
    return items
        .filter(item => item && Number(item.value) > 0)
        .map(item => ({
            label: item.label,
            value: Number(item.value) || 0
        }))
}

function buildSafeSeries(series = []) {
    return Array.isArray(series) ? series.map(v => Number(v) || 0) : []
}

// ----------------------------------------
// retirement breakdown doughnut
// items example:
// [
//   { label: "401(k)", value: 250000 },
//   { label: "Roth IRA", value: 90000 }
// ]
// ----------------------------------------

export function renderRetirementBreakdownChart(canvasId, items = []) {
    const cleaned = cleanBreakdownData(items)
    const ctx = getCanvasContext(canvasId)

    destroyIfExists(retirementBreakdownChartInstance)

    retirementBreakdownChartInstance = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: cleaned.map(item => item.label),
            datasets: [
                {
                    data: cleaned.map(item => item.value),
                    backgroundColor: DOUGHNUT_COLORS.slice(0, cleaned.length),
                    borderWidth: 0,
                    hoverOffset: 10
                }
            ]
        },
        options: buildDoughnutOptions("Retirement Accounts Breakdown")
    })

    return retirementBreakdownChartInstance
}

// ----------------------------------------
// non-retirement breakdown doughnut
// ----------------------------------------

export function renderNonRetirementBreakdownChart(canvasId, items = []) {
    const cleaned = cleanBreakdownData(items)
    const ctx = getCanvasContext(canvasId)

    destroyIfExists(nonRetirementBreakdownChartInstance)

    nonRetirementBreakdownChartInstance = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: cleaned.map(item => item.label),
            datasets: [
                {
                    data: cleaned.map(item => item.value),
                    backgroundColor: DOUGHNUT_COLORS.slice(0, cleaned.length),
                    borderWidth: 0,
                    hoverOffset: 10
                }
            ]
        },
        options: buildDoughnutOptions("Non-Retirement Accounts Breakdown")
    })

    return nonRetirementBreakdownChartInstance
}

// ----------------------------------------
// growth projection chart
// labels example: ["Age 25", "Age 26", ...]
// series example:
// {
//   total: [10000, 22000, 35000],
//   retirement: [8000, 18000, 29000],
//   nonRetirement: [2000, 4000, 6000]
// }
// ----------------------------------------

export function renderGrowthProjectionChart(canvasId, labels = [], series = {}) {
    const ctx = getCanvasContext(canvasId)

    destroyIfExists(growthProjectionChartInstance)

    growthProjectionChartInstance = new Chart(ctx, {
        type: "line",
        data: {
            labels,
            datasets: [
                {
                    label: "Total Net Worth",
                    data: buildSafeSeries(series.total),
                    borderColor: PALETTE.blue,
                    backgroundColor: "rgba(37, 99, 235, 0.15)",
                    tension: 0.28,
                    fill: false,
                    borderWidth: 3,
                    pointRadius: 0
                },
                {
                    label: "Retirement Accounts",
                    data: buildSafeSeries(series.retirement),
                    borderColor: PALETTE.green,
                    backgroundColor: "rgba(22, 163, 74, 0.15)",
                    tension: 0.28,
                    fill: false,
                    borderWidth: 2,
                    pointRadius: 0
                },
                {
                    label: "Non-Retirement Accounts",
                    data: buildSafeSeries(series.nonRetirement),
                    borderColor: PALETTE.purple,
                    backgroundColor: "rgba(147, 51, 234, 0.15)",
                    tension: 0.28,
                    fill: false,
                    borderWidth: 2,
                    pointRadius: 0
                }
            ]
        },
        options: buildLineOptions("Projected Wealth Growth")
    })

    return growthProjectionChartInstance
}

// ----------------------------------------
// Roth vs Pretax chart
// data example:
// {
//   labels: ["Today", "Retirement"],
//   roth: [50000, 450000],
//   pretax: [80000, 650000],
//   taxable: [20000, 300000]
// }
// ----------------------------------------

export function renderRothPretaxChart(canvasId, data = {}) {
    const ctx = getCanvasContext(canvasId)

    destroyIfExists(rothPretaxChartInstance)

    rothPretaxChartInstance = new Chart(ctx, {
        type: "bar",
        data: {
            labels: data.labels || [],
            datasets: [
                {
                    label: "Roth",
                    data: buildSafeSeries(data.roth),
                    backgroundColor: "rgba(147, 51, 234, 0.85)",
                    borderRadius: 8
                },
                {
                    label: "Pretax",
                    data: buildSafeSeries(data.pretax),
                    backgroundColor: "rgba(37, 99, 235, 0.85)",
                    borderRadius: 8
                },
                {
                    label: "Taxable",
                    data: buildSafeSeries(data.taxable),
                    backgroundColor: "rgba(22, 163, 74, 0.85)",
                    borderRadius: 8
                }
            ]
        },
        options: buildBarOptions("Roth vs Pretax vs Taxable", true)
    })

    return rothPretaxChartInstance
}

// ----------------------------------------
// household net worth chart
// data example:
// {
//   labels: ["Today", "Retirement"],
//   yours: [100000, 1200000],
//   spouse: [50000, 900000],
//   combined: [150000, 2100000]
// }
// ----------------------------------------

export function renderHouseholdNetWorthChart(canvasId, data = {}) {
    const ctx = getCanvasContext(canvasId)

    destroyIfExists(householdNetWorthChartInstance)

    householdNetWorthChartInstance = new Chart(ctx, {
        type: "line",
        data: {
            labels: data.labels || [],
            datasets: [
                {
                    label: "Your Net Worth",
                    data: buildSafeSeries(data.yours),
                    borderColor: PALETTE.blue,
                    backgroundColor: "rgba(37, 99, 235, 0.12)",
                    tension: 0.28,
                    fill: false,
                    borderWidth: 2.5,
                    pointRadius: 0
                },
                {
                    label: "Spouse Net Worth",
                    data: buildSafeSeries(data.spouse),
                    borderColor: PALETTE.pink,
                    backgroundColor: "rgba(219, 39, 119, 0.12)",
                    tension: 0.28,
                    fill: false,
                    borderWidth: 2.5,
                    pointRadius: 0
                },
                {
                    label: "Combined Net Worth",
                    data: buildSafeSeries(data.combined),
                    borderColor: PALETTE.green,
                    backgroundColor: "rgba(22, 163, 74, 0.12)",
                    tension: 0.28,
                    fill: false,
                    borderWidth: 3.5,
                    pointRadius: 0
                }
            ]
        },
        options: buildLineOptions("Household Net Worth Projection")
    })

    return householdNetWorthChartInstance
}

// ----------------------------------------
// retirement income chart
// data example:
// {
//   labels: ["Age 60", "Age 65", "Age 70", "Age 75"],
//   withdrawals: [70000, 72000, 76000, 80000],
//   socialSecurity: [0, 18000, 24000, 26000],
//   pension: [0, 0, 12000, 12000],
//   expenses: [65000, 68000, 70000, 74000]
// }
// ----------------------------------------

export function renderRetirementIncomeChart(canvasId, data = {}) {
    const ctx = getCanvasContext(canvasId)

    destroyIfExists(retirementIncomeChartInstance)

    retirementIncomeChartInstance = new Chart(ctx, {
        type: "bar",
        data: {
            labels: data.labels || [],
            datasets: [
                {
                    label: "Portfolio Withdrawals",
                    data: buildSafeSeries(data.withdrawals),
                    backgroundColor: "rgba(37, 99, 235, 0.82)",
                    borderRadius: 8,
                    stack: "income"
                },
                {
                    label: "Social Security",
                    data: buildSafeSeries(data.socialSecurity),
                    backgroundColor: "rgba(22, 163, 74, 0.82)",
                    borderRadius: 8,
                    stack: "income"
                },
                {
                    label: "Pension",
                    data: buildSafeSeries(data.pension),
                    backgroundColor: "rgba(147, 51, 234, 0.82)",
                    borderRadius: 8,
                    stack: "income"
                },
                {
                    label: "Estimated Expenses",
                    data: buildSafeSeries(data.expenses),
                    type: "line",
                    borderColor: PALETTE.red,
                    backgroundColor: "rgba(239, 68, 68, 0.12)",
                    borderWidth: 3,
                    tension: 0.25,
                    pointRadius: 0,
                    yAxisID: "y"
                }
            ]
        },
        options: buildBarOptions("Retirement Income vs Expenses", true)
    })

    return retirementIncomeChartInstance
}

// ----------------------------------------
// generic chart reset
// ----------------------------------------

export function destroyAllCharts() {
    destroyIfExists(retirementBreakdownChartInstance)
    destroyIfExists(nonRetirementBreakdownChartInstance)
    destroyIfExists(growthProjectionChartInstance)
    destroyIfExists(rothPretaxChartInstance)
    destroyIfExists(householdNetWorthChartInstance)
    destroyIfExists(retirementIncomeChartInstance)

    retirementBreakdownChartInstance = null
    nonRetirementBreakdownChartInstance = null
    growthProjectionChartInstance = null
    rothPretaxChartInstance = null
    householdNetWorthChartInstance = null
    retirementIncomeChartInstance = null
}

// ----------------------------------------
// UI summary cards helper
// useful when wiring the main calculator
// ----------------------------------------

export function buildBreakdownFromAccounts(accounts = [], retirementOnly = true) {
    const filtered = accounts.filter(account => {
        const isRetirement = !!account.retirement
        return retirementOnly ? isRetirement : !isRetirement
    })

    return filtered.map(account => ({
        label: account.label || account.type || "Account",
        value: Number(account.futureBalance || account.value || 0)
    }))
}

// ----------------------------------------
// projection series helper
// years example:
// [25, 26, 27, 28]
// rawSeries example:
// {
//   retirement: [10000, 20000],
//   nonRetirement: [5000, 8000]
// }
// ----------------------------------------

export function buildGrowthSeries(labels = [], rawSeries = {}) {
    const retirement = buildSafeSeries(rawSeries.retirement)
    const nonRetirement = buildSafeSeries(rawSeries.nonRetirement)
    const total = labels.map((_, index) => {
        return (retirement[index] || 0) + (nonRetirement[index] || 0)
    })

    return {
        labels,
        total,
        retirement,
        nonRetirement
    }
}

// ----------------------------------------
// default empty state renderers
// ----------------------------------------

export function renderEmptyDoughnutChart(canvasId, title = "No Data Yet") {
    const ctx = getCanvasContext(canvasId)

    return new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: ["No Data"],
            datasets: [
                {
                    data: [1],
                    backgroundColor: ["#e2e8f0"],
                    borderWidth: 0
                }
            ]
        },
        options: buildDoughnutOptions(title)
    })
}

export function renderEmptyLineChart(canvasId, title = "Projection Will Appear Here") {
    const ctx = getCanvasContext(canvasId)

    return new Chart(ctx, {
        type: "line",
        data: {
            labels: ["Today", "Future"],
            datasets: [
                {
                    label: "No Data",
                    data: [0, 0],
                    borderColor: "#cbd5e1",
                    tension: 0.28,
                    fill: false,
                    borderWidth: 2,
                    pointRadius: 0
                }
            ]
        },
        options: buildLineOptions(title)
    })
}

// ----------------------------------------
// resize helper in case you add tabs later
// ----------------------------------------

export function resizeAllCharts() {
    const charts = [
        retirementBreakdownChartInstance,
        nonRetirementBreakdownChartInstance,
        growthProjectionChartInstance,
        rothPretaxChartInstance,
        householdNetWorthChartInstance,
        retirementIncomeChartInstance
    ]

    charts.forEach(chart => {
        if (chart) {
            chart.resize()
        }
    })
}

// ----------------------------------------
// expose instances if needed
// ----------------------------------------

export function getChartInstances() {
    return {
        retirementBreakdownChartInstance,
        nonRetirementBreakdownChartInstance,
        growthProjectionChartInstance,
        rothPretaxChartInstance,
        householdNetWorthChartInstance,
        retirementIncomeChartInstance
    }
}