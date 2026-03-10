// ========================================
// MAIN APP ENTRY
// Boots the retirement planner in browser
// ========================================

import { initializePlannerApp } from "./calculator.js"

// ----------------------------------------
// startup helpers
// ----------------------------------------

function safeInitialize() {
    try {
        initializePlannerApp()
    } catch (error) {
        console.error("Planner failed to initialize:", error)

        const fallback = document.getElementById("appErrorArea")
        if (fallback) {
            fallback.innerHTML = `
                <div class="planner-alert planner-alert-error">
                    <div class="planner-alert-title">App failed to load</div>
                    <div class="planner-alert-message">
                        Please check your file paths, module imports, and element IDs in index.html.
                    </div>
                </div>
            `
        }
    }
}

function bindGlobalHelpers() {
    window.addEventListener("error", event => {
        console.error("Global error:", event.error || event.message)
    })

    window.addEventListener("unhandledrejection", event => {
        console.error("Unhandled promise rejection:", event.reason)
    })
}

// ----------------------------------------
// DOM ready boot
// ----------------------------------------

document.addEventListener("DOMContentLoaded", () => {
    bindGlobalHelpers()
    safeInitialize()
})