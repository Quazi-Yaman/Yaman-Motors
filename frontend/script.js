const API_BASE_URL = "http://localhost:5000/api";

/* =========================================================
   GLOBAL STATE
========================================================= */

const state = {
    vendors: [],
    customers: [],
    products: [],

    currentSection: "dashboard",
    currentPurchaseTab: "orders",
    currentSalesTab: "orders",
    currentInvoiceTab: "vendor",
    currentPaymentTab: "vendor",

    dashboard: null
};


/* =========================================================
   DOM HELPERS
========================================================= */

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

function escapeHtml(value) {
    if (value === null || value === undefined) return "";

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function formatCurrency(value) {
    const number = Number(value || 0);

    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2
    }).format(number);
}

function formatNumber(value) {
    return new Intl.NumberFormat("en-IN").format(Number(value || 0));
}

function formatDate(value) {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

function todayISO() {
    return new Date().toISOString().split("T")[0];
}


/* =========================================================
   TOAST
========================================================= */

function showToast(message, type = "info") {
    const container = $("#toastContainer");

    if (!container) return;

    const toast = document.createElement("div");

    toast.className = `toast toast-${type}`;

    toast.innerHTML = `
        <div class="toast-message">${escapeHtml(message)}</div>
        <button class="toast-close" type="button">&times;</button>
    `;

    container.appendChild(toast);

    const closeButton = toast.querySelector(".toast-close");

    if (closeButton) {
        closeButton.addEventListener("click", () => {
            toast.remove();
        });
    }

    setTimeout(() => {
        if (toast.parentElement) {
            toast.remove();
        }
    }, 4000);
}


/* =========================================================
   API
========================================================= */

async function apiRequest(endpoint, options = {}) {
    const config = {
        method: options.method || "GET",
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {})
        }
    };

    if (options.body !== undefined) {
        config.body =
            typeof options.body === "string"
                ? options.body
                : JSON.stringify(options.body);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    let data = null;

    try {
        data = await response.json();
    } catch {
        data = null;
    }

    if (!response.ok) {
        const message =
            data?.message ||
            data?.error ||
            `Request failed with status ${response.status}`;

        throw new Error(message);
    }

    return data;
}

async function apiGet(endpoint) {
    return apiRequest(endpoint);
}

async function apiPost(endpoint, body) {
    return apiRequest(endpoint, {
        method: "POST",
        body
    });
}

async function apiPut(endpoint, body) {
    return apiRequest(endpoint, {
        method: "PUT",
        body
    });
}

async function apiDelete(endpoint) {
    return apiRequest(endpoint, {
        method: "DELETE"
    });
}


/* =========================================================
   MODAL
========================================================= */




function openModal(title, bodyHtml, footerHtml = "") {
    const modal = $("#globalModal");

    if (!modal) return;

    const titleElement = $("#modalTitle");
    const bodyElement = $("#modalBody");
    const footerElement = $("#modalFooter");

    if (titleElement) {
        titleElement.textContent = title;
    }

    if (bodyElement) {
        bodyElement.innerHTML = bodyHtml;
    }

    if (footerElement) {
        footerElement.innerHTML = footerHtml;
    }

    // Enable modal
    modal.removeAttribute("inert");
    modal.setAttribute("aria-hidden", "false");

    // Force visible
    modal.style.display = "flex";
    modal.classList.add("open");

    document.body.classList.add("modal-open");

    requestAnimationFrame(() => {
        const firstFocusable = modal.querySelector(
            "input, textarea, select, button"
        );

        if (firstFocusable) {
            firstFocusable.focus();
        }
    });
}


function closeModal() {
    const modal = $("#globalModal");

    if (!modal) return;

    // Remove focus from modal before making it inaccessible
    const focused = document.activeElement;

    if (focused && modal.contains(focused)) {
        focused.blur();
    }

    // Close modal
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    modal.setAttribute("inert", "");

    // Force hidden
    modal.style.display = "none";

    document.body.classList.remove("modal-open");
}



/* =========================================================
   SIDEBAR TOGGLE
========================================================= */

function setupSidebarToggle() {
    const toggleButton = $("#sidebarToggle");
    const sidebar = $("#sidebar");

    if (!toggleButton || !sidebar) return;

    const savedState = localStorage.getItem("yamanMotorsSidebar");

    if (window.innerWidth > 780 && savedState === "collapsed") {
        sidebar.classList.add("collapsed");
        document.body.classList.add("sidebar-collapsed");
    }

    toggleButton.addEventListener("click", () => {
        if (window.innerWidth <= 780) {
            sidebar.classList.toggle("open");
            return;
        }

        sidebar.classList.toggle("collapsed");
        document.body.classList.toggle(
            "sidebar-collapsed",
            sidebar.classList.contains("collapsed")
        );

        localStorage.setItem(
            "yamanMotorsSidebar",
            sidebar.classList.contains("collapsed")
                ? "collapsed"
                : "expanded"
        );
    });

    window.addEventListener("resize", () => {
        if (window.innerWidth > 780) {
            sidebar.classList.remove("open");

            const saved = localStorage.getItem("yamanMotorsSidebar");

            if (saved === "collapsed") {
                sidebar.classList.add("collapsed");
                document.body.classList.add("sidebar-collapsed");
            }
        }
    });
}


/* =========================================================
   NAVIGATION
========================================================= */

const pageTitles = {
    dashboard: "Dashboard",
    vendors: "Vendors",
    customers: "Customers",
    products: "Products",
    purchases: "Purchases",
    sales: "Sales",
    invoices: "Invoices",
    payments: "Payments",
    inventory: "Inventory",
    reports: "Reports",
    "ai-assistant": "AI Assistant"
};

function showSection(sectionName) {
    const sections = $$(".page-section");

    sections.forEach(section => {
        section.classList.remove("active");
    });

    const target = $(`#section-${sectionName}`);

    if (target) {
        target.classList.add("active");
    }

    $$(".nav-item").forEach(item => {
        item.classList.remove("active");

        if (item.dataset.section === sectionName) {
            item.classList.add("active");
        }
    });

    const pageTitle = $("#pageTitle");

    if (pageTitle) {
        pageTitle.textContent =
            pageTitles[sectionName] || "Yaman Motors";
    }

    state.currentSection = sectionName;

    if (window.innerWidth <= 780) {
        const sidebar = $("#sidebar");

        if (sidebar) {
            sidebar.classList.remove("open");
        }
    }

    loadSectionData(sectionName);
}

function setupNavigation() {
    $$(".nav-item").forEach(item => {
        item.addEventListener("click", () => {
            const section = item.dataset.section;

            if (section) {
                showSection(section);
            }
        });
    });
}


/* =========================================================
   BACKEND CONNECTION
========================================================= */

async function testBackendConnection() {
    try {
        await apiGet("/health");

        const status = $(".system-status");

        if (status) {
            status.classList.add("connected");

            const text = status.querySelector(".status-text");

            if (text) {
                text.textContent = "System Online";
            }
        }

        return true;
    } catch (error) {
        console.error("Backend connection failed:", error);

        const status = $(".system-status");

        if (status) {
            status.classList.add("offline");

            const text = status.querySelector(".status-text");

            if (text) {
                text.textContent = "Backend Offline";
            }
        }

        return false;
    }
}


/* =========================================================
   DASHBOARD
========================================================= */


async function loadDashboard() {
    try {
        const data = await apiGet("/reports/summary");

        state.dashboard = data;

        setText(
            "dashboardTotalSales",
            formatCurrency(data.totalSales)
        );

        setText(
            "dashboardTotalPurchases",
            formatCurrency(data.totalPurchases)
        );

        setText(
            "dashboardCustomerOutstanding",
            formatCurrency(data.customerOutstanding)
        );

        setText(
            "dashboardVendorOutstanding",
            formatCurrency(data.vendorOutstanding)
        );

        // Load real sales chart
        await loadDashboardSalesChart();
        await loadDashboardActivity();

    } catch (error) {
        console.error("Dashboard error:", error);

        showToast(
            "Unable to load dashboard data.",
            "error"
        );
    }
}



async function loadDashboardSalesChart() {

    const chart =
        document.getElementById("dashboardSalesChart");

    const totalElement =
        document.getElementById("dashboardChartTotal");

    const periodSelect =
        document.getElementById("revenuePeriod");

    if (!chart) return;

    try {

        const invoices =
            await apiGet("/invoices/customer");

        if (!Array.isArray(invoices)) {
            throw new Error("Invalid sales data.");
        }

        const validInvoices = invoices.filter(invoice =>
            String(invoice.status).toUpperCase() !== "CANCELLED"
        );

        const now = new Date();

        const selectedPeriod =
            periodSelect?.value || "month";

        const currentYear =
            now.getFullYear();

        const currentMonth =
            now.getMonth();

        let periods = [];

        /*
         * THIS MONTH
         * One business bar for the current month.
         */
        if (selectedPeriod === "month") {

            periods = [{
                label: now.toLocaleString(
                    "en-US",
                    {
                        month: "short",
                        year: "numeric"
                    }
                ),
                year: currentYear,
                month: currentMonth
            }];

        }

        /*
         * THIS QUARTER
         * Three monthly bars.
         */
        else if (selectedPeriod === "quarter") {

            const quarterStart =
                Math.floor(currentMonth / 3) * 3;

            for (let i = 0; i < 3; i++) {

                const month =
                    quarterStart + i;

                periods.push({
                    label: new Date(
                        currentYear,
                        month,
                        1
                    ).toLocaleString(
                        "en-US",
                        { month: "short" }
                    ),
                    year: currentYear,
                    month: month
                });

            }

        }

        /*
         * THIS YEAR
         * Twelve monthly bars.
         */
        else {

            for (let month = 0; month < 12; month++) {

                periods.push({
                    label: new Date(
                        currentYear,
                        month,
                        1
                    ).toLocaleString(
                        "en-US",
                        { month: "short" }
                    ),
                    year: currentYear,
                    month: month
                });

            }

        }

        /*
         * Calculate sales for each period.
         */
        const chartData =
            periods.map(period => {

                const amount =
                    validInvoices.reduce(
                        (sum, invoice) => {

                            const invoiceDate =
                                new Date(
                                    invoice.invoiceDate
                                );

                            if (
                                invoiceDate.getFullYear() ===
                                    period.year &&
                                invoiceDate.getMonth() ===
                                    period.month
                            ) {

                                return sum +
                                    Number(
                                        invoice.grandTotal || 0
                                    );

                            }

                            return sum;

                        },
                        0
                    );

                return {
                    label: period.label,
                    amount: amount
                };

            });

        /*
         * Total for selected period.
         */
        const totalSales =
            chartData.reduce(
                (sum, item) =>
                    sum + item.amount,
                0
            );

        if (totalElement) {

            totalElement.textContent =
                formatCurrency(totalSales);

        }

        /*
         * Find largest value for bar height.
         */
        const maxValue =
            Math.max(
                ...chartData.map(item => item.amount),
                1
            );

        chart.innerHTML =
            chartData.map(item => {

                const height =
                    item.amount > 0
                        ? Math.max(
                            (item.amount / maxValue) * 100,
                            12
                        )
                        : 4;

                return `
                    <div class="sales-chart-bar-group">

                        <div class="sales-chart-value">
                            ${
                                item.amount > 0
                                    ? formatCurrency(item.amount)
                                    : ""
                            }
                        </div>

                        <div class="sales-chart-bar-area">

                            <div
                                class="sales-chart-bar ${
                                    item.amount === 0
                                        ? "empty"
                                        : ""
                                }"
                                style="height: ${height}%"
                                title="${formatCurrency(item.amount)}"
                            ></div>

                        </div>

                        <div class="sales-chart-label">
                            ${escapeHtml(item.label)}
                        </div>

                    </div>
                `;

            }).join("");

    } catch (error) {

        console.error(
            "Dashboard sales chart error:",
            error
        );

        chart.innerHTML = `
            <div class="sales-chart-empty">
                Unable to load sales data.
            </div>
        `;
    }
}


async function loadDashboardActivity() {

    const container =
        document.querySelector(".activity-empty");

    if (!container) return;

    try {

        const [
            salesOrders,
            customerInvoices,
            customerPayments
        ] = await Promise.all([
            apiGet("/sales"),
            apiGet("/invoices/customer"),
            apiGet("/payments/customer")
        ]);

        const activities = [];

        // Sales Orders
        if (Array.isArray(salesOrders)) {
            salesOrders.forEach(order => {
                activities.push({
                    type: "Sales Order",
                    id: order.soId,
                    description:
                        `Sales order created for ${order.customerName || order.customerId || "-"}`,
                    date: order.soDate,
                    amount: Number(order.grandTotal || 0)
                });
            });
        }

        // Customer Invoices
        if (Array.isArray(customerInvoices)) {
            customerInvoices.forEach(invoice => {
                activities.push({
                    type: "Customer Invoice",
                    id: invoice.customerInvoiceId,
                    description:
                        `Customer invoice generated`,
                    date: invoice.invoiceDate,
                    amount: Number(invoice.grandTotal || 0)
                });
            });
        }

        // Customer Payments
        if (Array.isArray(customerPayments)) {
            customerPayments.forEach(payment => {
                activities.push({
                    type: "Customer Payment",
                    id: payment.customerPaymentId,
                    description:
                        `Payment received from ${payment.customerId || "-"}`,
                    date: payment.paymentDate,
                    amount: Number(payment.amount || 0)
                });
            });
        }

        // Sort newest first
        activities.sort((a, b) =>
            String(b.date || "").localeCompare(
                String(a.date || "")
            )
        );

        const latest =
            activities.slice(0, 5);

        if (!latest.length) {

            container.innerHTML = `
                <span>◷</span>
                <strong>No recent activity</strong>
                <p>
                    Transactions will appear here
                    as your business data grows.
                </p>
            `;

            return;
        }

        container.className =
            "activity-list";

        container.innerHTML = latest.map(activity => `
            <div class="activity-item">

                <div class="activity-icon">
                    ${activity.type === "Customer Payment"
                        ? "₹"
                        : activity.type === "Customer Invoice"
                            ? "▤"
                            : "↗"
                    }
                </div>

                <div class="activity-content">

                    <strong>
                        ${escapeHtml(activity.type)}
                    </strong>

                    <span>
                        ${escapeHtml(activity.description)}
                    </span>

                    <small>
                        ${escapeHtml(activity.id || "-")}
                        •
                        ${formatDate(activity.date)}
                    </small>

                </div>

                <strong class="activity-amount">
                    ${formatCurrency(activity.amount)}
                </strong>

            </div>
        `).join("");

    } catch (error) {

        console.error(
            "Dashboard activity error:",
            error
        );
    }
}




function setText(id, value) {
    const element = document.getElementById(id);

    if (element) {
        element.textContent = value;
    }
}


function setText(id, value) {
    const element = document.getElementById(id);

    if (element) {
        element.textContent = value;
    }
}


/* =========================================================
   VENDORS
========================================================= */

async function loadVendors() {
    try {
        state.vendors = await apiGet("/vendors");

        renderVendors();

        populateVendorSelects();

    } catch (error) {
        console.error("Vendor loading error:", error);
        showToast("Unable to load vendors.", "error");
    }
}

function renderVendors() {
    const tbody = $("#vendorsTableBody");

    if (!tbody) return;

    const search = ($("#vendorSearch")?.value || "")
        .trim()
        .toLowerCase();

    const status = $("#vendorStatusFilter")?.value || "";

    const normalizedStatus =
        status.toLowerCase() === "all" ? "" : status;

    const filtered = state.vendors.filter(vendor => {
        const matchesSearch =
            !search ||
            String(vendor.vendorId || "").toLowerCase().includes(search) ||
            String(vendor.vendorName || "").toLowerCase().includes(search) ||
            String(vendor.email || "").toLowerCase().includes(search) ||
            String(vendor.phone || "").toLowerCase().includes(search);

        const matchesStatus =
            !normalizedStatus ||
            String(vendor.status || "").toLowerCase() ===
            normalizedStatus.toLowerCase();

        return matchesSearch && matchesStatus;
    });

    if (!filtered.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-table">
                    No vendors found.
                </td>
            </tr>
        `;

        return;
    }

    tbody.innerHTML = filtered.map(vendor => `
        <tr>
            <td>${escapeHtml(vendor.vendorId)}</td>
            <td>${escapeHtml(vendor.vendorName)}</td>
            <td>${escapeHtml(vendor.email || "-")}</td>
            <td>${escapeHtml(vendor.phone || "-")}</td>
            <td>${escapeHtml(vendor.gstin || "-")}</td>
            <td>
                <span class="status-badge ${getStatusClass(vendor.status)}">
                    ${escapeHtml(vendor.status || "Active")}
                </span>
            </td>
            <td>
                <button
                    class="table-action"
                    type="button"
                    data-vendor-view="${escapeHtml(vendor.vendorId)}">
                    View
                </button>
            </td>
        </tr>
    `).join("");

    tbody.querySelectorAll("[data-vendor-view]").forEach(button => {
        button.addEventListener("click", () => {
            showVendorDetails(button.dataset.vendorView);
        });
    });
}

function getStatusClass(status) {
    const value = String(status || "").toLowerCase();

    if (value === "active") return "status-active";
    if (value === "inactive") return "status-inactive";
    if (value === "paid") return "status-paid";
    if (value === "pending") return "status-pending";
    if (value === "cancelled") return "status-cancelled";

    return "";
}

function showVendorDetails(vendorId) {
    const vendor = state.vendors.find(
        item => String(item.vendorId) === String(vendorId)
    );

    if (!vendor) return;

    openModal(
        "Vendor Details",
        `
            <div class="detail-grid">
                <div>
                    <span>Vendor ID</span>
                    <strong>${escapeHtml(vendor.vendorId)}</strong>
                </div>

                <div>
                    <span>Vendor Name</span>
                    <strong>${escapeHtml(vendor.name)}</strong>
                </div>

                <div>
                    <span>Email</span>
                    <strong>${escapeHtml(vendor.email || "-")}</strong>
                </div>

                <div>
                    <span>Phone</span>
                    <strong>${escapeHtml(vendor.phone || "-")}</strong>
                </div>

                <div>
                    <span>GSTIN</span>
                    <strong>${escapeHtml(vendor.gstin || "-")}</strong>
                </div>

                <div>
                    <span>Currency</span>
                    <strong>${escapeHtml(vendor.currency || "INR")}</strong>
                </div>

                <div class="detail-full">
                    <span>Address</span>
                    <strong>${escapeHtml(vendor.address || "-")}</strong>
                </div>
            </div>
        `,
        `
            <button class="button secondary" id="modalCancelButton">
                Close
            </button>
        `
    );

    $("#modalCancelButton")?.addEventListener("click", closeModal);
}

function showVendorForm(vendor = null) {
    const isEdit = Boolean(vendor);

    openModal(
        isEdit ? "Edit Vendor" : "Add Vendor",
        `
            <form id="vendorForm" class="modal-form">

                <div class="form-grid">

                    <div class="form-group">
                        <label>Vendor ID</label>
                        <input
                            id="vendorId"
                            value="${escapeHtml(vendor?.vendorId || "")}"
                            ${isEdit ? "readonly" : ""}
                            required>
                    </div>

                    <div class="form-group">
                        <label>Vendor Name</label>
                        <input
                            id="vendorName"
                            value="${escapeHtml(vendor?.name || "")}"
                            required>
                    </div>

                    <div class="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            id="vendorEmail"
                            value="${escapeHtml(vendor?.email || "")}">
                    </div>

                    <div class="form-group">
                        <label>Phone</label>
                        <input
                            id="vendorPhone"
                            value="${escapeHtml(vendor?.phone || "")}">
                    </div>

                    <div class="form-group">
                        <label>GSTIN</label>
                        <input
                            id="vendorGstin"
                            value="${escapeHtml(vendor?.gstin || "")}">
                    </div>

                    <div class="form-group">
                        <label>Currency</label>
                        <input
                            id="vendorCurrency"
                            value="${escapeHtml(vendor?.currency || "INR")}">
                    </div>

                    <div class="form-group form-group-full">
                        <label>Address</label>
                        <textarea id="vendorAddress">${escapeHtml(
                            vendor?.address || ""
                        )}</textarea>
                    </div>

                </div>

            </form>
        `,
        `
            <button class="button secondary" id="vendorCancelButton">
                Cancel
            </button>

            <button class="button primary" id="vendorSaveButton">
                ${isEdit ? "Update Vendor" : "Save Vendor"}
            </button>
        `
    );

    $("#vendorCancelButton")?.addEventListener(
        "click",
        closeModal
    );

    $("#vendorSaveButton")?.addEventListener(
        "click",
        async () => {
            const payload = {
                vendorId: $("#vendorId").value.trim(),
                vendorName: $("#vendorName").value.trim(),
                address: $("#vendorAddress").value.trim(),
                email: $("#vendorEmail").value.trim(),
                phone: $("#vendorPhone").value.trim(),
                gstin: $("#vendorGstin").value.trim(),
                currency: $("#vendorCurrency").value.trim() || "INR"
            };

            if (!payload.vendorId || !payload.vendorName) {
                showToast(
                    "Vendor ID and Vendor Name are required.",
                    "warning"
                );
                return;
            }

            try {
                if (isEdit) {
                    await apiPut(
                        `/vendors/${encodeURIComponent(vendor.vendorId)}`,
                        payload
                    );

                    showToast(
                        "Vendor updated successfully.",
                        "success"
                    );
                } else {
                    await apiPost("/vendors", payload);

                    showToast(
                        "Vendor added successfully.",
                        "success"
                    );
                }

                closeModal();
                await loadVendors();

            } catch (error) {
                showToast(error.message, "error");
            }
        }
    );
}

/* =========================================================
   PURCHASE ORDER FORM
========================================================= */

function showPurchaseForm() {
    const vendorOptions = state.vendors.map(vendor => `
        <option value="${escapeHtml(vendor.vendorId)}">
            ${escapeHtml(vendor.vendorId)} - ${escapeHtml(vendor.vendorName)}
        </option>
    `).join("");

    const productOptions = state.products.map(product => `
        <option
            value="${escapeHtml(product.productId)}"
            data-price="${product.sellingPrice || 0}"
            data-tax="${product.taxRate || 0}">
            ${escapeHtml(product.productId)} - ${escapeHtml(product.productName)}
        </option>
    `).join("");

    const today = new Date().toISOString().split("T")[0];

    openModal(
        "New Purchase Order",
        `
        <form id="purchaseOrderForm" class="modal-form">

            <div class="form-grid">

                <div class="form-group">
                    <label>PO Number</label>
                    <input
                        type="text"
                        id="poId"
                        placeholder="PO-000001"
                        required>
                </div>

                <div class="form-group">
                    <label>Vendor</label>
                    <select id="poVendorId" required>
                        <option value="">Select vendor</option>
                        ${vendorOptions}
                    </select>
                </div>

                <div class="form-group">
                    <label>PO Date</label>
                    <input
                        type="date"
                        id="poDate"
                        value="${today}"
                        required>
                </div>

                <div class="form-group">
                    <label>Expected Delivery Date</label>
                    <input
                        type="date"
                        id="poExpectedDate">
                </div>

            </div>

            <div style="margin-top:20px;">

                <div class="panel-header">
                    <div>
                        <h3>Order Items</h3>
                        <span>Add one or more products</span>
                    </div>

                    <button
                        type="button"
                        class="btn btn-secondary"
                        id="addPurchaseItemButton">
                        + Add Item
                    </button>
                </div>

                <div
                    id="purchaseItemsContainer"
                    style="margin-top:12px;">
                </div>

            </div>

            <div
                style="
                    margin-top:20px;
                    padding:16px;
                    border:1px solid var(--border);
                    border-radius:8px;
                    background:var(--surface-soft);
                ">

                <div style="
                    display:flex;
                    justify-content:space-between;
                    margin-bottom:8px;
                ">
                    <span>Subtotal</span>
                    <strong id="purchaseSubtotal">₹0.00</strong>
                </div>

                <div style="
                    display:flex;
                    justify-content:space-between;
                    margin-bottom:8px;
                ">
                    <span>Tax</span>
                    <strong id="purchaseTax">₹0.00</strong>
                </div>

                <div style="
                    display:flex;
                    justify-content:space-between;
                    padding-top:10px;
                    border-top:1px solid var(--border);
                    font-size:14px;
                ">
                    <span>Grand Total</span>
                    <strong id="purchaseGrandTotal">₹0.00</strong>
                </div>

            </div>

            <div class="form-group" style="margin-top:20px;">
                <label>Notes</label>
                <textarea
                    id="poNotes"
                    rows="3"
                    placeholder="Optional notes"></textarea>
            </div>

        </form>
        `,
        `
        <button
            type="button"
            class="button secondary"
            id="purchaseCancelButton">
            Cancel
        </button>

        <button
            type="button"
            class="button primary"
            id="purchaseSaveButton">
            Create Purchase Order
        </button>
        `
    );

    const itemsContainer = $("#purchaseItemsContainer");

    function calculateTotals() {
        let subtotal = 0;
        let taxTotal = 0;

        $$(".purchase-item-row").forEach(row => {

            const quantity =
                parseFloat(
                    row.querySelector(".purchase-quantity")?.value
                ) || 0;

            const price =
                parseFloat(
                    row.querySelector(".purchase-price")?.value
                ) || 0;

            const taxRate =
                parseFloat(
                    row.querySelector(".purchase-tax-rate")?.value
                ) || 0;

            const lineSubtotal = quantity * price;
            const lineTax = lineSubtotal * taxRate / 100;

            subtotal += lineSubtotal;
            taxTotal += lineTax;
        });

        $("#purchaseSubtotal").textContent =
            formatCurrency(subtotal);

        $("#purchaseTax").textContent =
            formatCurrency(taxTotal);

        $("#purchaseGrandTotal").textContent =
            formatCurrency(subtotal + taxTotal);
    }

    function addItemRow() {

        const row = document.createElement("div");

        row.className = "purchase-item-row";

        row.style.cssText = `
            display:grid;
            grid-template-columns:2fr 1fr 1fr 1fr auto;
            gap:10px;
            align-items:end;
            margin-bottom:10px;
        `;

        row.innerHTML = `
            <div class="form-group">
                <label>Product</label>

                <select
                    class="purchase-product"
                    required>

                    <option value="">
                        Select product
                    </option>

                    ${productOptions}

                </select>
            </div>

            <div class="form-group">
                <label>Quantity</label>

                <input
                    type="number"
                    class="purchase-quantity"
                    min="0.01"
                    step="0.01"
                    value="1"
                    required>
            </div>

            <div class="form-group">
                <label>Unit Price</label>

                <input
                    type="number"
                    class="purchase-price"
                    min="0"
                    step="0.01"
                    required>
            </div>

            <div class="form-group">
                <label>Tax %</label>

                <input
                    type="number"
                    class="purchase-tax-rate"
                    min="0"
                    step="0.01"
                    value="0"
                    required>
            </div>

            <button
                type="button"
                class="table-action purchase-remove-item">
                Remove
            </button>
        `;

        itemsContainer.appendChild(row);

        const productSelect =
            row.querySelector(".purchase-product");

        const priceInput =
            row.querySelector(".purchase-price");

        const taxInput =
            row.querySelector(".purchase-tax-rate");

        productSelect.addEventListener(
            "change",
            () => {

                const option =
                    productSelect.options[
                        productSelect.selectedIndex
                    ];

                priceInput.value =
                    option.dataset.price || "";

                taxInput.value =
                    option.dataset.tax || "0";

                calculateTotals();
            }
        );

        row.querySelectorAll("input").forEach(input => {
            input.addEventListener(
                "input",
                calculateTotals
            );
        });

        row.querySelector(
            ".purchase-remove-item"
        ).addEventListener(
            "click",
            () => {
                row.remove();
                calculateTotals();
            }
        );

        calculateTotals();
    }

    addItemRow();

    $("#addPurchaseItemButton")?.addEventListener(
        "click",
        addItemRow
    );

    $("#purchaseCancelButton")?.addEventListener(
        "click",
        closeModal
    );

    $("#purchaseSaveButton")?.addEventListener(
        "click",
        async () => {

            const poId =
                $("#poId").value.trim();

            const vendorId =
                $("#poVendorId").value;

            const poDate =
                $("#poDate").value;

            const expectedDate =
                $("#poExpectedDate").value || null;

            const notes =
                $("#poNotes").value.trim() || null;

            const rows =
                $$(".purchase-item-row");

            if (!poId || !vendorId || !poDate) {
                showToast(
                    "PO Number, Vendor and PO Date are required.",
                    "warning"
                );
                return;
            }

            if (!rows.length) {
                showToast(
                    "Add at least one product.",
                    "warning"
                );
                return;
            }

            const items = [];

            for (const row of rows) {

                const productId =
                    row.querySelector(
                        ".purchase-product"
                    ).value;

                const quantity =
                    parseFloat(
                        row.querySelector(
                            ".purchase-quantity"
                        ).value
                    );

                const unitPrice =
                    parseFloat(
                        row.querySelector(
                            ".purchase-price"
                        ).value
                    );

                const taxRate =
                    parseFloat(
                        row.querySelector(
                            ".purchase-tax-rate"
                        ).value
                    ) || 0;

                if (
                    !productId ||
                    quantity <= 0 ||
                    unitPrice < 0
                ) {
                    showToast(
                        "Please complete all purchase item fields.",
                        "warning"
                    );
                    return;
                }

                items.push({
                    productId,
                    quantity,
                    unitPrice,
                    taxRate
                });
            }

            try {

                await apiPost(
                    "/purchases",
                    {
                        poId,
                        vendorId,
                        orderDate: poDate,
                        expectedDate,
                        status: "OPEN",
                        notes
                    }
                );

                for (const item of items) {

                    await apiPost(
                        `/purchases/${encodeURIComponent(poId)}/items`,
                        item
                    );
                }

                closeModal();

                await loadPurchaseOrders();

                showToast(
                    "Purchase order created successfully.",
                    "success"
                );

            } catch (error) {

                console.error(
                    "Purchase order creation error:",
                    error
                );

                showToast(
                    error.message ||
                    "Unable to create purchase order.",
                    "error"
                );
            }
        }
    );
}

function showPurchaseDetails(poId) {
    openModal(
        "Purchase Order Details",
        `
            <div style="padding:10px 0;">
                <p>Loading purchase order...</p>
            </div>
        `
    );

    apiGet(`/purchases/${encodeURIComponent(poId)}`)
        .then(order => {

            if (!order) {
                throw new Error("Purchase order not found.");
            }

            const items = Array.isArray(order.items)
                ? order.items
                : [];

            const itemsHtml = items.length
                ? items.map(item => `
                    <tr>
                        <td>${escapeHtml(item.productId)}</td>
                        <td>${escapeHtml(item.productName || "-")}</td>
                        <td>${item.quantity}</td>
                        <td>${formatCurrency(item.unitPrice)}</td>
                        <td>${item.taxRate}%</td>
                        <td>${formatCurrency(item.lineTotal)}</td>
                    </tr>
                `).join("")
                : `
                    <tr>
                        <td colspan="6" class="empty-table">
                            No items found.
                        </td>
                    </tr>
                `;

            const body = `
                <div class="form-grid">

                    <div class="form-group">
                        <label>PO Number</label>
                        <input
                            value="${escapeHtml(order.poId)}"
                            readonly>
                    </div>

                    <div class="form-group">
                        <label>Vendor</label>
                        <input
                            value="${escapeHtml(
                                order.vendorName || order.vendorId || "-"
                            )}"
                            readonly>
                    </div>

                    <div class="form-group">
                        <label>PO Date</label>
                        <input
                            value="${escapeHtml(
                                formatDate(order.poDate)
                            )}"
                            readonly>
                    </div>

                    <div class="form-group">
                        <label>Expected Delivery</label>
                        <input
                            value="${escapeHtml(
                                formatDate(order.expectedDate)
                            )}"
                            readonly>
                    </div>

                    <div class="form-group">
                        <label>Status</label>
                        <input
                            value="${escapeHtml(
                                order.status || "OPEN"
                            )}"
                            readonly>
                    </div>

                </div>

                <div style="margin-top:20px;">

                    <h3>Order Items</h3>

                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Product ID</th>
                                    <th>Product</th>
                                    <th>Quantity</th>
                                    <th>Unit Price</th>
                                    <th>Tax</th>
                                    <th>Total</th>
                                </tr>
                            </thead>

                            <tbody>
                                ${itemsHtml}
                            </tbody>
                        </table>
                    </div>

                </div>

                <div style="
                    margin-top:20px;
                    padding:16px;
                    border:1px solid var(--border);
                    border-radius:8px;
                    background:var(--surface-soft);
                ">

                    <div style="
                        display:flex;
                        justify-content:space-between;
                        margin-bottom:8px;
                    ">
                        <span>Subtotal</span>
                        <strong>
                            ${formatCurrency(order.subtotal)}
                        </strong>
                    </div>

                    <div style="
                        display:flex;
                        justify-content:space-between;
                        margin-bottom:8px;
                    ">
                        <span>Tax</span>
                        <strong>
                            ${formatCurrency(order.taxTotal)}
                        </strong>
                    </div>

                    <div style="
                        display:flex;
                        justify-content:space-between;
                        padding-top:10px;
                        border-top:1px solid var(--border);
                        font-size:15px;
                    ">
                        <strong>Grand Total</strong>
                        <strong>
                            ${formatCurrency(order.grandTotal)}
                        </strong>
                    </div>

                </div>

                ${
                    order.notes
                        ? `
                            <div
                                class="form-group"
                                style="margin-top:20px;">
                                <label>Notes</label>
                                <textarea readonly>${escapeHtml(
                                    order.notes
                                )}</textarea>
                            </div>
                        `
                        : ""
                }
            `;

            const footer = `
                <button
                    type="button"
                    class="button secondary"
                    id="purchaseDetailsCloseButton">
                    Close
                </button>
            `;

            openModal(
                `Purchase Order ${escapeHtml(order.poId)}`,
                body,
                footer
            );

            $("#purchaseDetailsCloseButton")
                ?.addEventListener(
                    "click",
                    closeModal
                );
        })
        .catch(error => {

            console.error(
                "Purchase order details error:",
                error
            );

            closeModal();

            showToast(
                error.message ||
                "Unable to load purchase order details.",
                "error"
            );
        });
}

function showVendorInvoiceForm() {

    const vendorOptions = state.vendors.map(vendor => `
        <option value="${escapeHtml(vendor.vendorId)}">
            ${escapeHtml(vendor.vendorId)} -
            ${escapeHtml(vendor.vendorName)}
        </option>
    `).join("");

    openModal(
        "Upload Vendor Invoice",
        `
        <form id="vendorInvoiceForm" class="modal-form">

            <div class="form-grid">

                <div class="form-group">
                    <label>Vendor</label>
                    <select id="vendorInvoiceVendorId" required>
                        <option value="">
                            Select vendor
                        </option>
                        ${vendorOptions}
                    </select>
                </div>

                <div class="form-group">
                    <label>Purchase Order</label>
                    <select id="vendorInvoicePoId" required>
                        <option value="">
                            Select purchase order
                        </option>
                    </select>
                </div>

                <div class="form-group">
                    <label>Invoice Number</label>
                    <input
                        id="vendorInvoiceNumber"
                        placeholder="INV-000001"
                        required>
                </div>

                <div class="form-group">
                    <label>Invoice Date</label>
                    <input
                        type="date"
                        id="vendorInvoiceDate"
                        required>
                </div>

                <div class="form-group">
                    <label>Due Date</label>
                    <input
                        type="date"
                        id="vendorInvoiceDueDate">
                </div>

                <div class="form-group">
                    <label>Invoice PDF</label>
                    <input
                        type="file"
                        id="vendorInvoiceFile"
                        accept=".pdf">
                </div>

            </div>

            <div
                style="
                    margin-top:20px;
                    padding:16px;
                    border:1px solid var(--border);
                    border-radius:8px;
                    background:var(--surface-soft);
                ">

                <div style="
                    display:flex;
                    justify-content:space-between;
                    margin-bottom:8px;
                ">
                    <span>PO Subtotal</span>
                    <strong id="vendorInvoiceSubtotal">
                        ₹0.00
                    </strong>
                </div>

                <div style="
                    display:flex;
                    justify-content:space-between;
                    margin-bottom:8px;
                ">
                    <span>PO Tax</span>
                    <strong id="vendorInvoiceTax">
                        ₹0.00
                    </strong>
                </div>

                <div style="
                    display:flex;
                    justify-content:space-between;
                    padding-top:10px;
                    border-top:1px solid var(--border);
                    font-size:15px;
                ">
                    <strong>Invoice Total</strong>
                    <strong id="vendorInvoiceGrandTotal">
                        ₹0.00
                    </strong>
                </div>

            </div>

        </form>
        `,
        `
        <button
            type="button"
            class="button secondary"
            id="vendorInvoiceCancelButton">
            Cancel
        </button>

        <button
            type="button"
            class="button primary"
            id="vendorInvoiceSaveButton">
            Save Vendor Invoice
        </button>
        `
    );

    const vendorSelect =
        $("#vendorInvoiceVendorId");

    const poSelect =
        $("#vendorInvoicePoId");

    const subtotalElement =
        $("#vendorInvoiceSubtotal");

    const taxElement =
        $("#vendorInvoiceTax");

    const grandTotalElement =
        $("#vendorInvoiceGrandTotal");

    async function loadPurchaseOrdersForVendor() {

        poSelect.innerHTML = `
            <option value="">
                Select purchase order
            </option>
        `;

        subtotalElement.textContent =
            formatCurrency(0);

        taxElement.textContent =
            formatCurrency(0);

        grandTotalElement.textContent =
            formatCurrency(0);

        const vendorId = vendorSelect.value;

        if (!vendorId) {
            return;
        }

        try {

            const orders =
                await apiGet("/purchases");

            const vendorOrders =
                orders.filter(order =>
                    String(order.vendorId) ===
                    String(vendorId)
                );

            poSelect.innerHTML +=
                vendorOrders.map(order => `
                    <option
                        value="${escapeHtml(order.poId)}"
                        data-subtotal="${order.subtotal || 0}"
                        data-tax="${order.taxTotal || 0}"
                        data-total="${order.grandTotal || 0}">
                        ${escapeHtml(order.poId)}
                        -
                        ${formatCurrency(order.grandTotal)}
                    </option>
                `).join("");

        } catch (error) {

            console.error(
                "Purchase order loading error:",
                error
            );

            showToast(
                "Unable to load purchase orders.",
                "error"
            );
        }
    }

    vendorSelect?.addEventListener(
        "change",
        loadPurchaseOrdersForVendor
    );

    loadVendorInvoicesForPayment();

    poSelect?.addEventListener(
        "change",
        () => {

            const option =
                poSelect.options[
                    poSelect.selectedIndex
                ];

            if (!option.value) {

                subtotalElement.textContent =
                    formatCurrency(0);

                taxElement.textContent =
                    formatCurrency(0);

                grandTotalElement.textContent =
                    formatCurrency(0);

                return;
            }

            subtotalElement.textContent =
                formatCurrency(
                    option.dataset.subtotal
                );

            taxElement.textContent =
                formatCurrency(
                    option.dataset.tax
                );

            grandTotalElement.textContent =
                formatCurrency(
                    option.dataset.total
                );
        }
    );

    $("#vendorInvoiceCancelButton")
        ?.addEventListener(
            "click",
            closeModal
        );

    $("#vendorInvoiceSaveButton")
        ?.addEventListener(
            "click",
            async () => {

                const vendorId =
                    vendorSelect.value;

                const poId =
                    poSelect.value;

                const invoiceNumber =
                    $("#vendorInvoiceNumber")
                        .value
                        .trim();

                const invoiceDate =
                    $("#vendorInvoiceDate")
                        .value;

                const dueDate =
                    $("#vendorInvoiceDueDate")
                        .value || null;

                if (
                    !vendorId ||
                    !poId ||
                    !invoiceNumber ||
                    !invoiceDate
                ) {

                    showToast(
                        "Vendor, Purchase Order, Invoice Number and Invoice Date are required.",
                        "warning"
                    );

                    return;
                }

                try {

                    const order =
                        await apiGet(
                            `/purchases/${encodeURIComponent(poId)}`
                        );

                    if (!order) {
                        throw new Error(
                            "Purchase order not found."
                        );
                    }

                    const invoiceId =
                        `VINV-${Date.now()}`;

                    await apiPost(
                        "/invoices/vendor",
                        {
                            vendorInvoiceId:
                                invoiceId,

                            vendorId,

                            poId,

                            invoiceNumber,

                            invoiceDate,

                            dueDate,

                            subtotal:
                                order.subtotal || 0,

                            taxTotal:
                                order.taxTotal || 0,

                            grandTotal:
                                order.grandTotal || 0,

                            status: "OPEN"
                        }
                    );

                    for (
                        const item of order.items || []
                    ) {

                        await apiPost(
                            `/invoices/vendor/${encodeURIComponent(invoiceId)}/items`,
                            {
                                productId:
                                    item.productId,

                                quantity:
                                    item.quantity,

                                unitPrice:
                                    item.unitPrice,

                                taxRate:
                                    item.taxRate
                            }
                        );
                    }

                    closeModal();

                    showToast(
                        "Vendor invoice created successfully.",
                        "success"
                    );

                } catch (error) {

                    console.error(
                        "Vendor invoice creation error:",
                        error
                    );

                    showToast(
                        error.message ||
                        "Unable to create vendor invoice.",
                        "error"
                    );
                }
            }
        );
}

function showVendorPaymentForm() {
    const vendorOptions = state.vendors.map(vendor => `
        <option value="${escapeHtml(vendor.vendorId)}">
            ${escapeHtml(vendor.vendorId)} -
            ${escapeHtml(vendor.vendorName)}
        </option>
    `).join("");

    openModal(
        "Record Vendor Payment",
        `
        <form id="vendorPaymentForm" class="modal-form">

            <div class="form-grid">

                <div class="form-group">
                    <label>Vendor</label>
                    <select id="vendorPaymentVendorId" required>
                        <option value="">Select vendor</option>
                        ${vendorOptions}
                    </select>
                </div>

                <div class="form-group">
                    <label>Vendor Invoice</label>
                    <select id="vendorPaymentInvoiceId" required>
                        <option value="">Select invoice</option>
                    </select>
                </div>

                <div class="form-group">
                    <label>Payment Date</label>
                    <input
                        type="date"
                        id="vendorPaymentDate"
                        value="${todayISO()}"
                        required>
                </div>

                <div class="form-group">
                    <label>Payment Amount</label>
                    <input
                        type="number"
                        id="vendorPaymentAmount"
                        min="0.01"
                        step="0.01"
                        placeholder="0.00"
                        required>
                </div>

                <div class="form-group">
                    <label>Payment Method</label>
                    <select id="vendorPaymentMethod">
                        <option value="BANK_TRANSFER">Bank Transfer</option>
                        <option value="UPI">UPI</option>
                        <option value="CHEQUE">Cheque</option>
                        <option value="CASH">Cash</option>
                    </select>
                </div>

                <div class="form-group">
                    <label>Transaction Reference</label>
                    <input
                        type="text"
                        id="vendorPaymentTransactionRef"
                        placeholder="UTR / Transaction ID">
                </div>

            </div>

            <div
                style="
                    margin-top:20px;
                    padding:16px;
                    border:1px solid var(--border);
                    border-radius:8px;
                    background:var(--surface-soft);
                "
            >
                <div style="
                    display:flex;
                    justify-content:space-between;
                    margin-bottom:8px;
                ">
                    <span>Invoice Total</span>
                    <strong id="vendorPaymentInvoiceTotal">
                        ₹0.00
                    </strong>
                </div>

                <div style="
                    display:flex;
                    justify-content:space-between;
                    margin-bottom:8px;
                ">
                    <span>Already Paid</span>
                    <strong id="vendorPaymentAlreadyPaid">
                        ₹0.00
                    </strong>
                </div>

                <div style="
                    display:flex;
                    justify-content:space-between;
                    padding-top:10px;
                    border-top:1px solid var(--border);
                ">
                    <strong>Remaining</strong>
                    <strong id="vendorPaymentRemaining">
                        ₹0.00
                    </strong>
                </div>
            </div>

            <div class="form-group" style="margin-top:20px;">
                <label>Notes</label>
                <textarea
                    id="vendorPaymentNotes"
                    rows="3"
                    placeholder="Optional notes"></textarea>
            </div>

        </form>
        `,
        `
        <button
            type="button"
            class="button secondary"
            id="vendorPaymentCancelButton">
            Cancel
        </button>

        <button
            type="button"
            class="button primary"
            id="vendorPaymentSaveButton">
            Record Payment
        </button>
        `
    );

    const vendorSelect = $("#vendorPaymentVendorId");
    const invoiceSelect = $("#vendorPaymentInvoiceId");

    const invoiceTotalElement =
        $("#vendorPaymentInvoiceTotal");

    const alreadyPaidElement =
        $("#vendorPaymentAlreadyPaid");

    const remainingElement =
        $("#vendorPaymentRemaining");

    async function loadVendorInvoicesForPayment() {
        invoiceSelect.innerHTML = `
            <option value="">Select invoice</option>
        `;

        invoiceTotalElement.textContent =
            formatCurrency(0);

        alreadyPaidElement.textContent =
            formatCurrency(0);

        remainingElement.textContent =
            formatCurrency(0);

        const vendorId = vendorSelect.value;

        if (!vendorId) return;

        try {
            const invoices =
                await apiGet("/invoices/vendor");

            const vendorInvoices = invoices.filter(invoice =>
                String(invoice.vendorId) ===
                String(vendorId)
            );

            invoiceSelect.innerHTML +=
                vendorInvoices.map(invoice => `
                    <option
                        value="${escapeHtml(invoice.vendorInvoiceId)}"
                        data-total="${invoice.grandTotal || 0}">
                        ${escapeHtml(
                            invoice.invoiceNumber ||
                            invoice.vendorInvoiceId
                        )}
                        -
                        ${formatCurrency(invoice.grandTotal)}
                    </option>
                `).join("");

        } catch (error) {
            console.error(
                "Vendor invoice loading error:",
                error
            );

            showToast(
                "Unable to load vendor invoices.",
                "error"
            );
        }
    }

    vendorSelect?.addEventListener(
        "change",
        loadVendorInvoicesForPayment
    );

   
invoiceSelect?.addEventListener(
    "change",
    async () => {

        const option =
            invoiceSelect.options[
                invoiceSelect.selectedIndex
            ];

        if (!option.value) {
            invoiceTotalElement.textContent =
                formatCurrency(0);

            alreadyPaidElement.textContent =
                formatCurrency(0);

            remainingElement.textContent =
                formatCurrency(0);

            return;
        }

        const total =
            parseFloat(option.dataset.total) || 0;

        invoiceTotalElement.textContent =
            formatCurrency(total);

        try {
            const payments =
                await apiGet("/payments/vendor");

            const paidAmount = payments
                .filter(payment =>
                    String(payment.vendorInvoiceId) ===
                    String(option.value) &&
                    String(payment.status).toUpperCase() ===
                    "COMPLETED"
                )
                .reduce(
                    (sum, payment) =>
                        sum + (parseFloat(payment.amount) || 0),
                    0
                );

            const remaining =
                Math.max(total - paidAmount, 0);

            alreadyPaidElement.textContent =
                formatCurrency(paidAmount);

            remainingElement.textContent =
                formatCurrency(remaining);

        } catch (error) {
            console.error(
                "Vendor payment calculation error:",
                error
            );

            alreadyPaidElement.textContent =
                formatCurrency(0);

            remainingElement.textContent =
                formatCurrency(total);
        }
    }
);


    $("#vendorPaymentCancelButton")
        ?.addEventListener(
            "click",
            closeModal
        );

    $("#vendorPaymentSaveButton")
        ?.addEventListener(
            "click",
            async () => {

                const vendorId =
                    vendorSelect.value;

                const vendorInvoiceId =
                    invoiceSelect.value;

                const amount =
                    parseFloat(
                        $("#vendorPaymentAmount").value
                    );

                const paymentDate =
                    $("#vendorPaymentDate").value;

                const paymentMethod =
                    $("#vendorPaymentMethod").value;

                const transactionRef =
                    $("#vendorPaymentTransactionRef")
                        .value
                        .trim() || null;

                const notes =
                    $("#vendorPaymentNotes")
                        .value
                        .trim() || null;

                if (
                    !vendorId ||
                    !vendorInvoiceId ||
                    !paymentDate ||
                    !amount ||
                    amount <= 0
                ) {
                    showToast(
                        "Vendor, Invoice, Date and Payment Amount are required.",
                        "warning"
                    );
                    return;
                }

                try {

                    const paymentId =
                        `VPAY-${Date.now()}`;

                    await apiPost(
                        "/payments/vendor",
                        {
                            vendorPaymentId:
                                paymentId,

                            vendorId,

                            vendorInvoiceId,

                            amount,

                            paymentDate,

                            paymentMethod,

                            transactionRef,

                            status: "COMPLETED",

                            notes
                        }
                    );

                    closeModal();

                    await loadVendorPayments();

                    showToast(
                        "Vendor payment recorded successfully.",
                        "success"
                    );

                } catch (error) {

                    console.error(
                        "Vendor payment creation error:",
                        error
                    );

                    showToast(
                        error.message ||
                        "Unable to record vendor payment.",
                        "error"
                    );
                }
            }
        );
}

/* =========================================================
   CUSTOMERS
========================================================= */

async function loadCustomers() {
    try {
        state.customers = await apiGet("/customers");

        renderCustomers();

        populateCustomerSelects();

    } catch (error) {
        console.error("Customer loading error:", error);
        showToast("Unable to load customers.", "error");
    }
}

function renderCustomers() {
    const tbody = $("#customersTableBody");

    if (!tbody) return;

    const search = ($("#customerSearch")?.value || "")
        .trim()
        .toLowerCase();

    const status = $("#customerStatusFilter")?.value || "";

    const normalizedStatus =
        status.toLowerCase() === "all" ? "" : status;

    const filtered = state.customers.filter(customer => {
        const matchesSearch =
            !search ||
            String(customer.customerId || "").toLowerCase().includes(search) ||
            String(customer.customerName || "").toLowerCase().includes(search) ||
            String(customer.email || "").toLowerCase().includes(search) ||
            String(customer.phone || "").toLowerCase().includes(search);

        const matchesStatus =
            !normalizedStatus ||
            String(customer.status || "").toLowerCase() ===
            normalizedStatus.toLowerCase();

        return matchesSearch && matchesStatus;
    });

    if (!filtered.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-table">
                    No customers found.
                </td>
            </tr>
        `;

        return;
    }

    tbody.innerHTML = filtered.map(customer => `
        <tr>
            <td>${escapeHtml(customer.customerId)}</td>
            <td>${escapeHtml(customer.customerName)}</td>
            <td>${escapeHtml(customer.email || "-")}</td>
            <td>${escapeHtml(customer.phone || "-")}</td>
            <td>${escapeHtml(customer.gstin || "-")}</td>
            <td>
                <span class="status-badge ${getStatusClass(customer.status)}">
                    ${escapeHtml(customer.status || "Active")}
                </span>
            </td>
            <td>
                <button
                    class="table-action"
                    type="button"
                    data-customer-view="${escapeHtml(customer.customerId)}">
                    View
                </button>
            </td>
        </tr>
    `).join("");

    tbody.querySelectorAll("[data-customer-view]").forEach(button => {
        button.addEventListener("click", () => {
            showCustomerDetails(button.dataset.customerView);
        });
    });
}


function showCustomerDetails(customerId) {
    const customer = state.customers.find(
        item => String(item.customerId) === String(customerId)
    );

    if (!customer) return;

    openModal(
        "Customer Details",
        `
            <div class="detail-grid">

                <div>
                    <span>Customer ID</span>
                    <strong>${escapeHtml(customer.customerId)}</strong>
                </div>

                <div>
                    <span>Customer Name</span>
                    <strong>${escapeHtml(customer.name)}</strong>
                </div>

                <div>
                    <span>Email</span>
                    <strong>${escapeHtml(customer.email || "-")}</strong>
                </div>

                <div>
                    <span>Phone</span>
                    <strong>${escapeHtml(customer.phone || "-")}</strong>
                </div>

                <div>
                    <span>GSTIN</span>
                    <strong>${escapeHtml(customer.gstin || "-")}</strong>
                </div>

                <div>
                    <span>Currency</span>
                    <strong>${escapeHtml(customer.currency || "INR")}</strong>
                </div>

                <div class="detail-full">
                    <span>Address</span>
                    <strong>${escapeHtml(customer.address || "-")}</strong>
                </div>

            </div>
        `,
        `
            <button class="button secondary" id="modalCancelButton">
                Close
            </button>
        `
    );

    $("#modalCancelButton")?.addEventListener(
        "click",
        closeModal
    );
}

function showCustomerForm(customer = null) {
    const isEdit = Boolean(customer);

    openModal(
        isEdit ? "Edit Customer" : "Add Customer",
        `
            <form id="customerForm" class="modal-form">

                <div class="form-grid">

                    <div class="form-group">
                        <label>Customer ID</label>
                        <input
                            id="customerId"
                            value="${escapeHtml(customer?.customerId || "")}"
                            ${isEdit ? "readonly" : ""}
                            required>
                    </div>

                    <div class="form-group">
                        <label>Customer Name</label>
                        <input
                            id="customerName"
                            value="${escapeHtml(customer?.name || "")}"
                            required>
                    </div>

                    <div class="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            id="customerEmail"
                            value="${escapeHtml(customer?.email || "")}">
                    </div>

                    <div class="form-group">
                        <label>Phone</label>
                        <input
                            id="customerPhone"
                            value="${escapeHtml(customer?.phone || "")}">
                    </div>

                    <div class="form-group">
                        <label>GSTIN</label>
                        <input
                            id="customerGstin"
                            value="${escapeHtml(customer?.gstin || "")}">
                    </div>

                    <div class="form-group">
                        <label>Currency</label>
                        <input
                            id="customerCurrency"
                            value="${escapeHtml(customer?.currency || "INR")}">
                    </div>

                    <div class="form-group form-group-full">
                        <label>Address</label>
                        <textarea id="customerAddress">${escapeHtml(
                            customer?.address || ""
                        )}</textarea>
                    </div>

                </div>

            </form>
        `,
        `
            <button class="button secondary" id="customerCancelButton">
                Cancel
            </button>

            <button class="button primary" id="customerSaveButton">
                ${isEdit ? "Update Customer" : "Save Customer"}
            </button>
        `
    );

    $("#customerCancelButton")?.addEventListener(
        "click",
        closeModal
    );

    $("#customerSaveButton")?.addEventListener(
        "click",
        async () => {

            const payload = {
                customerId: $("#customerId").value.trim(),
                customerName: $("#customerName").value.trim(),
                address: $("#customerAddress").value.trim(),
                email: $("#customerEmail").value.trim(),
                phone: $("#customerPhone").value.trim(),
                gstin: $("#customerGstin").value.trim(),
                currency:
                    $("#customerCurrency").value.trim() || "INR"
            };

            if (!payload.customerId || !payload.customerName) {
                showToast(
                    "Customer ID and Customer Name are required.",
                    "warning"
                );
                return;
            }

            try {
                if (isEdit) {
                    await apiPut(
                        `/customers/${encodeURIComponent(customer.customerId)}`,
                        payload
                    );

                    showToast(
                        "Customer updated successfully.",
                        "success"
                    );
                } else {
                    await apiPost("/customers", payload);

                    showToast(
                        "Customer added successfully.",
                        "success"
                    );
                }

                closeModal();
                await loadCustomers();

            } catch (error) {
                showToast(error.message, "error");
            }
        }
    );
}


/* =========================================================
   PRODUCTS
========================================================= */

async function loadProducts() {
    try {
        state.products = await apiGet("/products");

        console.log("PRODUCTS FROM API:", state.products);
        console.log("PRODUCT TABLE:", $("#productsTableBody"));

        renderProducts();

        console.log(
            "PRODUCT TABLE HTML:",
            $("#productsTableBody")?.innerHTML
        );

        populateProductSelects();

    } catch (error) {
        console.error("Product loading error:", error);
        showToast("Unable to load products.", "error");
    }
}


function renderProducts() {
    const tbody = $("#productsTableBody");

    if (!tbody) return;

    const search = ($("#productSearch")?.value || "")
        .trim()
        .toLowerCase();

    const category = $("#productCategoryFilter")?.value || "";

    const normalizedCategory =
        category.toLowerCase() === "all" ? "" : category;

    const filtered = state.products.filter(product => {
        const matchesSearch =
            !search ||
            String(product.productId || "").toLowerCase().includes(search) ||
            String(product.productName || "").toLowerCase().includes(search) ||
            String(product.category || "").toLowerCase().includes(search);

        const matchesCategory =
            !normalizedCategory ||
            String(product.category || "").toLowerCase() ===
            normalizedCategory.toLowerCase();

        return matchesSearch && matchesCategory;
    });

    if (!filtered.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="empty-table">
                    No products found.
                </td>
            </tr>
        `;

        return;
    }

    tbody.innerHTML = filtered.map(product => `
        <tr>
            <td>${escapeHtml(product.productId)}</td>
            <td>${escapeHtml(product.productName)}</td>
            <td>${escapeHtml(product.category || "-")}</td>
            <td>${escapeHtml(product.productType || "-")}</td>
            <td>${escapeHtml(product.unit || "-")}</td>
            <td>${formatCurrency(product.sellingPrice)}</td>
            <td>${escapeHtml(product.taxRate ?? 0)}%</td>
            <td>
                <span class="status-badge ${getStatusClass(product.status)}">
                    ${escapeHtml(product.status || "Active")}
                </span>
            </td>
        </tr>
    `).join("");
}



function showProductForm(product = null) {
    const isEdit = Boolean(product);

    openModal(
        isEdit ? "Edit Product" : "Add Product",
        `
            <form id="productForm" class="modal-form">

                <div class="form-grid">

                    <div class="form-group">
                        <label>Product ID</label>
                        <input
                            id="productId"
                            value="${escapeHtml(product?.productId || "")}"
                            ${isEdit ? "readonly" : ""}
                            required>
                    </div>

                    <div class="form-group">
                        <label>Product Name</label>
                        <input
                            id="productName"
                            value="${escapeHtml(product?.productName || "")}"
                            required>
                    </div>

                    <div class="form-group">
                        <label>Category</label>
                        <input
                            id="productCategory"
                            value="${escapeHtml(product?.category || "")}">
                    </div>

                    <div class="form-group">
                        <label>Product Type</label>
                        <input
                            id="productType"
                            value="${escapeHtml(product?.productType || "")}">
                    </div>

                    <div class="form-group">
                        <label>Unit</label>
                        <input
                            id="productUnit"
                            value="${escapeHtml(product?.unit || "PCS")}">
                    </div>

                    <div class="form-group">
                        <label>Selling Price</label>
                        <input
                            type="number"
                            step="0.01"
                            id="productSellingPrice"
                            value="${escapeHtml(product?.sellingPrice || 0)}">
                    </div>

                    <div class="form-group">
                        <label>Tax Rate (%)</label>
                        <input
                            type="number"
                            step="0.01"
                            id="productTaxRate"
                            value="${escapeHtml(product?.taxRate || 0)}">
                    </div>

                    <div class="form-group form-group-full">
                        <label>Description</label>
                        <textarea id="productDescription">${escapeHtml(
                            product?.description || ""
                        )}</textarea>
                    </div>

                </div>

            </form>
        `,
        `
            <button class="button secondary" id="productCancelButton">
                Cancel
            </button>

            <button class="button primary" id="productSaveButton">
                ${isEdit ? "Update Product" : "Save Product"}
            </button>
        `
    );

    $("#productCancelButton")?.addEventListener(
        "click",
        closeModal
    );

    $("#productSaveButton")?.addEventListener(
        "click",
        async () => {

            const payload = {
                productId: $("#productId").value.trim(),
                productName: $("#productName").value.trim(),
                category: $("#productCategory").value.trim(),
                productType: $("#productType").value.trim(),
                unit: $("#productUnit").value.trim(),
                description: $("#productDescription").value.trim(),
                sellingPrice:
                    Number($("#productSellingPrice").value || 0),
                taxRate:
                    Number($("#productTaxRate").value || 0)
            };

            if (!payload.productId || !payload.productName) {
                showToast(
                    "Product ID and Product Name are required.",
                    "warning"
                );
                return;
            }

            try {
                if (isEdit) {
                    await apiPut(
                        `/products/${encodeURIComponent(product.productId)}`,
                        payload
                    );

                    showToast(
                        "Product updated successfully.",
                        "success"
                    );
                } else {
                    await apiPost("/products", payload);

                    showToast(
                        "Product added successfully.",
                        "success"
                    );
                }

                closeModal();
                await loadProducts();

            } catch (error) {
                showToast(error.message, "error");
            }
        }
    );
}


/* =========================================================
   SELECT HELPERS
========================================================= */

function populateVendorSelects() {
    $$("select[data-vendor-select]").forEach(select => {

        const currentValue = select.value;

        select.innerHTML = `
            <option value="">Select vendor</option>
            ${state.vendors.map(vendor => `
                <option value="${escapeHtml(vendor.vendorId)}">
                    ${escapeHtml(vendor.vendorId)} - ${escapeHtml(vendor.vendorName)}
                </option>
            `).join("")}
        `;

        select.value = currentValue;
    });
}

function populateCustomerSelects() {
    $$("select[data-customer-select]").forEach(select => {

        const currentValue = select.value;

        select.innerHTML = `
            <option value="">Select customer</option>
            ${state.customers.map(customer => `
                <option value="${escapeHtml(customer.customerId)}">
                    ${escapeHtml(customer.customerId)} - ${escapeHtml(customer.name)}
                </option>
            `).join("")}
        `;

        select.value = currentValue;
    });
}

function populateProductSelects() {
    $$("select[data-product-select]").forEach(select => {

        const currentValue = select.value;

        select.innerHTML = `
            <option value="">Select product</option>
            ${state.products.map(product => `
                <option value="${escapeHtml(product.productId)}">
                    ${escapeHtml(product.productId)} - ${escapeHtml(product.productName)}
                </option>
            `).join("")}
        `;

        select.value = currentValue;
    });
}


/* =========================================================
   PURCHASES
========================================================= */

function setupPurchaseTabs() {
    $$("[data-purchase-tab]").forEach(button => {

        button.addEventListener("click", () => {

            const tab = button.dataset.purchaseTab;

            state.currentPurchaseTab = tab;

            $$("[data-purchase-tab]").forEach(item => {
                item.classList.remove("active");
            });

            button.classList.add("active");

            $$(".purchase-tab-content").forEach(content => {
                content.classList.remove("active");
            });

            $(`#purchase-tab-${tab}`)?.classList.add("active");

            loadPurchaseTab(tab);
        });
    });
}

function loadPurchaseTab(tab) {
    if (tab === "orders") {
        loadPurchaseOrders();
    }

    if (tab === "invoices") {
        loadVendorInvoices();
    }

    if (tab === "payments") {
        loadVendorPayments();
    }
}

async function loadPurchaseOrders() {
    const tbody = $("#purchaseTableBody");

    if (!tbody) return;

    try {
        const data = await apiGet("/purchases");

        if (!Array.isArray(data) || !data.length) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="empty-table">
                        No purchase orders found.
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = data.map(order => `
            <tr>
                <td>${escapeHtml(order.poId)}</td>

                <td>
                    ${escapeHtml(order.vendorName || order.vendorId || "-")}
                </td>

                <td>${formatDate(order.poDate)}</td>

                <td>${formatDate(order.expectedDate)}</td>

                <td>${formatCurrency(order.grandTotal)}</td>

                <td>
                    <span class="status-badge ${getStatusClass(order.status)}">
                        ${escapeHtml(order.status || "OPEN")}
                    </span>
                </td>

                <td>
                    <button
                        type="button"
                        class="table-action"
                        data-purchase-view="${escapeHtml(order.poId)}">
                        View
                    </button>
                </td>
            </tr>
        `).join("");

        tbody
            .querySelectorAll("[data-purchase-view]")
            .forEach(button => {
                button.addEventListener("click", () => {
                    showPurchaseDetails(
                        button.dataset.purchaseView
                    );
                });
            });

    } catch (error) {
        console.error("Purchase order loading error:", error);

        showToast(
            "Unable to load purchase orders.",
            "error"
        );
    }
}


async function loadVendorInvoices() {
    const container = document.querySelector("#purchase-tab-invoices .panel");

    if (!container) return;

    try {
        const invoices = await apiGet("/invoices/vendor");

        const rows = Array.isArray(invoices) ? invoices : [];

        container.innerHTML = `
            <div class="panel-header">
                <div>
                    <h3>Vendor Invoices</h3>
                    <span>Bills received from suppliers</span>
                </div>

                <button
                    type="button"
                    class="btn btn-primary"
                    id="uploadVendorInvoiceButton">
                    + Upload Invoice
                </button>
            </div>

            ${
                rows.length
                    ? `
                        <div class="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Invoice</th>
                                        <th>Vendor</th>
                                        <th>PO</th>
                                        <th>Date</th>
                                        <th>Due Date</th>
                                        <th>Total</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    ${rows.map(invoice => `
                                        <tr>
                                            <td>
                                                ${escapeHtml(
                                                    invoice.invoiceNumber ||
                                                    invoice.vendorInvoiceId ||
                                                    "-"
                                                )}
                                            </td>

                                            <td>
                                                ${escapeHtml(
                                                    invoice.vendorName ||
                                                    invoice.vendorId ||
                                                    "-"
                                                )}
                                            </td>

                                            <td>
                                                ${escapeHtml(
                                                    invoice.poId || "-"
                                                )}
                                            </td>

                                            <td>
                                                ${formatDate(invoice.invoiceDate)}
                                            </td>

                                            <td>
                                                ${formatDate(invoice.dueDate)}
                                            </td>

                                            <td>
                                                ${formatCurrency(invoice.grandTotal)}
                                            </td>

                                            <td>
                                                <span class="status-badge ${getStatusClass(invoice.status)}">
                                                    ${escapeHtml(invoice.status || "-")}
                                                </span>
                                            </td>
                                        </tr>
                                    `).join("")}
                                </tbody>
                            </table>
                        </div>
                    `
                    : `
                        <div class="table-empty-state large">
                            <span>▤</span>
                            <strong>No vendor invoices</strong>
                            <p>Upload a vendor PDF and associate it with a purchase order.</p>
                        </div>
                    `
            }
        `;

        // Reconnect the Upload Invoice button
        $("#uploadVendorInvoiceButton")?.addEventListener(
            "click",
            () => {
                showSection("purchases");
                showVendorInvoiceForm();
            }
        );

    } catch (error) {
        console.error("Vendor invoice loading error:", error);

        showToast(
            "Unable to load vendor invoices.",
            "error"
        );
    }
}





async function loadVendorPayments() {
    try {
        const data = await apiGet("/payments/vendor");
        let advices = [];
try {
    advices = await apiGet("/payments/vendor/advice");
} catch (e) {
    console.warn("Vendor payment advice unavailable:", e);
}

        const panels = [
            document.querySelector("#payment-tab-vendor .panel"),
            document.querySelector("#purchase-tab-payments .panel")
        ].filter(Boolean);

        if (panels.length === 0) return;

        let content = "";

        if (!data || data.length === 0) {
            content = `
                <div class="table-empty-state large">
                    <span>₹</span>
                    <strong>No vendor payments</strong>
                    <p>Payments made to vendors will appear here.</p>
                </div>
            `;
        } else {
            content = `
                <div class="table-wrapper">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Payment ID</th>
                                <th>Vendor</th>
                                <th>Invoice</th>
                                <th>Date</th>
                                <th>Amount</th>
                                <th>Method</th>
                                <th>Transaction Ref</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>

                        <tbody>
                            ${data.map(payment => `
                                <tr>
                                    <td>
                                        ${escapeHtml(
                                            payment.vendorPaymentId || "-"
                                        )}
                                    </td>

                                    <td>
                                        ${escapeHtml(
                                            payment.vendorId || "-"
                                        )}
                                    </td>

                                    <td>
                                        ${escapeHtml(
                                            payment.vendorInvoiceId || "-"
                                        )}
                                    </td>

                                    <td>
                                        ${formatDate(
                                            payment.paymentDate
                                        )}
                                    </td>

                                    <td>
                                        ${formatCurrency(
                                            payment.amount || 0
                                        )}
                                    </td>

                                    <td>
                                        ${escapeHtml(
                                            payment.paymentMethod || "-"
                                        )}
                                    </td>

                                    <td>
                                        ${escapeHtml(
                                            payment.transactionRef || "-"
                                        )}
                                    </td>

                                    <td>
                                        <span class="${getStatusClass(
                                            payment.status
                                        )}">
                                            ${escapeHtml(
                                                payment.status || "-"
                                            )}
                                        </span>
                                    </td>

                                    <
<td>
    ${
        (() => {
            const advice = advices.find(item =>
                String(item.vendorPaymentId) ===
                String(payment.vendorPaymentId)
            );

            if (advice) {
                return `
                    <button
                        type="button"
                        class="btn btn-secondary btn-sm"
                        onclick="viewVendorPaymentAdvice(
                            '${escapeHtml(advice.adviceId)}',
                            '${escapeHtml(payment.vendorPaymentId)}',
                            '${escapeHtml(payment.vendorId)}',
                            '${escapeHtml(payment.vendorInvoiceId)}'
                        )"
                    >
                        View Advice
                    </button>
                `;
            }

            if (
                String(payment.status).toUpperCase() ===
                "COMPLETED"
            ) {
                return `
                    <button
                        type="button"
                        class="btn btn-secondary btn-sm"
                        onclick="createVendorPaymentAdvice(
                            '${escapeHtml(payment.vendorPaymentId)}',
                            '${escapeHtml(payment.vendorId)}',
                            '${escapeHtml(payment.vendorInvoiceId)}'
                        )"
                    >
                        Create Advice
                    </button>
                `;
            }

            return "-";
        })()
    }
</td>

                         </tr>
                            `).join("")}
                        </tbody>
                    </table>
                </div>
            `;
        }

        panels.forEach(panel => {
            panel.innerHTML = content;
        });

    } catch (error) {
        console.error(
            "Vendor payments loading error:",
            error
        );
    }
}




async function viewVendorPaymentAdvice(
    adviceId,
    vendorPaymentId,
    vendorId,
    vendorInvoiceId
) {
    try {
        const payments =
            await apiGet("/payments/vendor");

        const payment =
            payments.find(item =>
                String(item.vendorPaymentId) ===
                String(vendorPaymentId)
            );

        if (!payment) {
            throw new Error(
                "Vendor payment not found."
            );
        }

        const invoices =
            await apiGet("/invoices/vendor");

        const invoice =
            invoices.find(item =>
                String(item.vendorInvoiceId) ===
                String(vendorInvoiceId)
            );

        if (!invoice) {
            throw new Error(
                "Vendor invoice not found."
            );
        }

        const vendors =
            await apiGet("/vendors");

        const vendor =
            vendors.find(item =>
                String(item.vendorId) ===
                String(vendorId)
            );

        const vendorName =
            vendor?.vendorName ||
            vendorId;

        const adviceHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">

                <title>Vendor Payment Advice</title>

                <style>
                    body {
                        font-family: Arial, sans-serif;
                        background: #f5f7fa;
                        margin: 0;
                        padding: 40px;
                        color: #222;
                    }

                    .advice {
                        max-width: 800px;
                        margin: auto;
                        background: #fff;
                        padding: 40px;
                        border: 1px solid #ddd;
                    }

                    .header {
                        display: flex;
                        justify-content: space-between;
                        border-bottom: 2px solid #222;
                        padding-bottom: 20px;
                        margin-bottom: 30px;
                    }

                    .company {
                        font-size: 26px;
                        font-weight: bold;
                    }

                    .title {
                        text-align: right;
                        font-size: 22px;
                        font-weight: bold;
                    }

                    .grid {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 20px;
                        margin-bottom: 30px;
                    }

                    .field {
                        border-bottom: 1px solid #ddd;
                        padding-bottom: 10px;
                    }

                    .label {
                        font-size: 12px;
                        color: #777;
                        text-transform: uppercase;
                        margin-bottom: 5px;
                    }

                    .value {
                        font-size: 16px;
                        font-weight: 600;
                    }

                    .amount-box {
                        margin-top: 20px;
                        border: 1px solid #ddd;
                    }

                    .amount-row {
                        display: flex;
                        justify-content: space-between;
                        padding: 14px 16px;
                        border-bottom: 1px solid #eee;
                    }

                    .amount-row:last-child {
                        border-bottom: none;
                    }

                    .paid {
                        font-size: 20px;
                        font-weight: bold;
                    }

                    .remaining {
                        font-size: 18px;
                        font-weight: bold;
                    }

                    .footer {
                        margin-top: 40px;
                        padding-top: 20px;
                        border-top: 1px solid #ddd;
                        color: #666;
                        font-size: 13px;
                    }

                    .print-button {
                        display: block;
                        margin: 0 auto 20px;
                        padding: 10px 20px;
                        border: none;
                        background: #173f5f;
                        color: white;
                        cursor: pointer;
                        border-radius: 5px;
                    }

                    @media print {
                        body {
                            background: white;
                            padding: 0;
                        }

                        .print-button {
                            display: none;
                        }

                        .advice {
                            border: none;
                        }
                    }
                </style>
            </head>

            <body>

                <button
                    class="print-button"
                    onclick="window.print()"
                >
                    Print / Save as PDF
                </button>

                <div class="advice">

                    <div class="header">

                        <div class="company">
                            YAMAN MOTORS
                        </div>

                        <div class="title">
                            VENDOR PAYMENT ADVICE
                        </div>

                    </div>

                    <div class="grid">

                        <div class="field">
                            <div class="label">
                                Advice ID
                            </div>

                            <div class="value">
                                ${escapeHtml(adviceId)}
                            </div>
                        </div>

                        <div class="field">
                            <div class="label">
                                Payment Date
                            </div>

                            <div class="value">
                                ${formatDate(
                                    payment.paymentDate
                                )}
                            </div>
                        </div>

                        <div class="field">
                            <div class="label">
                                Vendor
                            </div>

                            <div class="value">
                                ${escapeHtml(
                                    vendorName
                                )}
                            </div>
                        </div>

                        <div class="field">
                            <div class="label">
                                Vendor Invoice
                            </div>

                            <div class="value">
                                ${escapeHtml(
                                    invoice.invoiceNumber ||
                                    vendorInvoiceId
                                )}
                            </div>
                        </div>

                        <div class="field">
                            <div class="label">
                                Payment Method
                            </div>

                            <div class="value">
                                ${escapeHtml(
                                    payment.paymentMethod ||
                                    "-"
                                )}
                            </div>
                        </div>

                        <div class="field">
                            <div class="label">
                                Transaction Reference
                            </div>

                            <div class="value">
                                ${escapeHtml(
                                    payment.transactionRef ||
                                    "-"
                                )}
                            </div>
                        </div>

                    </div>

                    <div class="amount-box">

                        <div class="amount-row">
                            <span>
                                Invoice Total
                            </span>

                            <strong>
                                ${formatCurrency(
                                    invoice.grandTotal
                                )}
                            </strong>
                        </div>

                        <div class="amount-row">
                            <span>
                                Amount Paid
                            </span>

                            <span class="paid">
                                ${formatCurrency(
                                    payment.amount
                                )}
                            </span>
                        </div>

                        <div class="amount-row">
                            <span>
                                Remaining Amount
                            </span>

                            <span class="remaining">
                                ${formatCurrency(
                                    Math.max(
                                        parseFloat(
                                            invoice.grandTotal
                                        ) -
                                        parseFloat(
                                            payment.amount
                                        ),
                                        0
                                    )
                                )}
                            </span>
                        </div>

                    </div>

                    <div class="footer">
                        This document confirms the payment made
                        by YAMAN MOTORS against the above vendor invoice.
                    </div>

                </div>

            </body>
            </html>
        `;

        const adviceWindow =
            window.open(
                "",
                "_blank",
                "width=900,height=800"
            );

        if (!adviceWindow) {
            throw new Error(
                "Please allow pop-ups for this website."
            );
        }

        adviceWindow.document.open();
        adviceWindow.document.write(adviceHtml);
        adviceWindow.document.close();

    } catch (error) {
        console.error(
            "Payment advice view error:",
            error
        );

        showToast(
            error.message ||
            "Unable to open payment advice.",
            "error"
        );
    }
}




async function createVendorPaymentAdvice(
    vendorPaymentId,
    vendorId,
    vendorInvoiceId
) {
    try {
        const adviceId =
            `VPA-${Date.now()}`;

        const result = await apiPost(
            "/payments/vendor/advice",
            {
                adviceId: adviceId,
                vendorPaymentId: vendorPaymentId,
                vendorId: vendorId,
                vendorInvoiceId: vendorInvoiceId,
                pdfKey: null
            }
        );

        if (!result || !result.success) {
            throw new Error(
                result?.message ||
                "Unable to create vendor payment advice."
            );
        }

        showToast(
            `Payment Advice ${adviceId} created successfully.`,
            "success"
        );

        await loadVendorPayments();

    } catch (error) {
        console.error(
            "Vendor payment advice error:",
            error
        );

        showToast(
            error.message ||
            "Unable to create vendor payment advice.",
            "error"
        );
    }
}




/* =========================================================
   SALES
========================================================= */

function setupSalesTabs() {
    $$("[data-sales-tab]").forEach(button => {

        button.addEventListener("click", () => {

            const tab = button.dataset.salesTab;

            state.currentSalesTab = tab;

            $$("[data-sales-tab]").forEach(item => {
                item.classList.remove("active");
            });

            button.classList.add("active");

            $$(".sales-tab-content").forEach(content => {
                content.classList.remove("active");
            });

            $(`#sales-tab-${tab}`)?.classList.add("active");

            loadSalesTab(tab);
        });
    });
}

function loadSalesTab(tab) {
    if (tab === "orders") {
        loadSalesOrders();
    }

    if (tab === "invoices") {
        loadCustomerInvoices();
    }

    if (tab === "payments") {
        loadCustomerPayments();
    }
}


async function loadSalesOrders() {
    try {
        const data = await apiGet("/sales");

        const panel =
            document.querySelector("#sales-tab-orders .panel");

        if (!panel) return;

        if (!data || data.length === 0) {
            panel.innerHTML = `
                <div class="table-empty-state large">
                    <span>🛒</span>
                    <strong>No sales orders</strong>
                    <p>Sales orders created for customers will appear here.</p>
                </div>
            `;
            return;
        }

        panel.innerHTML = `
            <div class="table-wrapper">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Sales Order</th>
                            <th>Customer</th>
                            <th>Date</th>
                            <th>Subtotal</th>
                            <th>Tax</th>
                            <th>Total</th>
                            <th>Status</th>
                        </tr>
                    </thead>

                    <tbody>
                        ${data.map(order => `
                            <tr>
                                <td>
                                    ${escapeHtml(
                                        order.soId || "-"
                                    )}
                                </td>

                                <td>
                                    ${escapeHtml(
                                        order.customerId || "-"
                                    )}
                                </td>

                                <td>
                                    ${formatDate(
                                        order.orderDate
                                    )}
                                </td>

                                <td>
                                    ${formatCurrency(
                                        order.subtotal || 0
                                    )}
                                </td>

                                <td>
                                    ${formatCurrency(
                                        order.taxTotal || 0
                                    )}
                                </td>

                                <td>
                                    ${formatCurrency(
                                        order.grandTotal || 0
                                    )}
                                </td>

                                <td>
                                    <span class="${getStatusClass(
                                        order.status
                                    )}">
                                        ${escapeHtml(
                                            order.status || "-"
                                        )}
                                    </span>
                                </td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            </div>
        `;
    } catch (error) {
        console.error(
            "Sales orders loading error:",
            error
        );

        showToast(
            "Unable to load sales orders.",
            "error"
        );
    }
}



async function loadCusstomerInvoices() {
    try {
        const data = await apiGet("/invoices/customer");

        const panel =
            document.querySelector("#sales-tab-invoices .panel");

        if (!panel) return;

        if (!data || data.length === 0) {
            panel.innerHTML = `
                <div class="table-empty-state large">
                    <span>🧾</span>
                    <strong>No customer invoices</strong>
                    <p>Invoices issued to customers will appear here.</p>
                </div>
            `;
            return;
        }

        panel.innerHTML = `
            <div class="table-wrapper">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Invoice</th>
                            <th>Customer</th>
                            <th>Sales Order</th>
                            <th>Date</th>
                            <th>Due Date</th>
                            <th>Total</th>
                            <th>Status</th>
                        </tr>
                    </thead>

                    <tbody>
                        ${data.map(invoice => `
                            <tr>
                                <td>
                                    ${escapeHtml(
                                        invoice.invoiceNumber ||
                                        invoice.customerInvoiceId ||
                                        "-"
                                    )}
                                </td>

                                <td>
                                    ${escapeHtml(
                                        invoice.customerId || "-"
                                    )}
                                </td>

                                <td>
                                    ${escapeHtml(
                                        invoice.soId || "-"
                                    )}
                                </td>

                                <td>
                                    ${formatDate(
                                        invoice.invoiceDate
                                    )}
                                </td>

                                <td>
                                    ${formatDate(
                                        invoice.dueDate
                                    )}
                                </td>

                                <td>
                                    ${formatCurrency(
                                        invoice.grandTotal || 0
                                    )}
                                </td>

                                <td>
                                    <span class="${getStatusClass(
                                        invoice.status
                                    )}">
                                        ${escapeHtml(
                                            invoice.status || "-"
                                        )}
                                    </span>
                                </td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            </div>
        `;
    } catch (error) {
        console.error(
            "Customer invoices loading error:",
            error
        );

        showToast(
            "Unable to load customer invoices.",
            "error"
        );
    }
}



async function loadCustomerPayments() {
    try {
        const data = await apiGet("/payments/customer");

        const panel =
            document.querySelector("#sales-tab-payments .panel");

        if (!panel) return;

        if (!data || data.length === 0) {
            panel.innerHTML = `
                <div class="table-empty-state large">
                    <span>₹</span>
                    <strong>No customer payments</strong>
                    <p>Payments received from customers will appear here.</p>
                </div>
            `;
            return;
        }

        panel.innerHTML = `
            <div class="table-wrapper">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Payment ID</th>
                            <th>Customer</th>
                            <th>Invoice</th>
                            <th>Date</th>
                            <th>Amount</th>
                            <th>Method</th>
                            <th>Transaction Ref</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>

                    <tbody>
                        ${data.map(payment => `
                            <tr>
                                <td>
                                    ${escapeHtml(
                                        payment.customerPaymentId || "-"
                                    )}
                                </td>

                                <td>
                                    ${escapeHtml(
                                        payment.customerId || "-"
                                    )}
                                </td>

                                <td>
                                    ${escapeHtml(
                                        payment.customerInvoiceId || "-"
                                    )}
                                </td>

                                <td>
                                    ${formatDate(
                                        payment.paymentDate
                                    )}
                                </td>

                                <td>
                                    ${formatCurrency(
                                        payment.amount || 0
                                    )}
                                </td>

                                <td>
                                    ${escapeHtml(
                                        payment.paymentMethod || "-"
                                    )}
                                </td>

                                <td>
                                    ${escapeHtml(
                                        payment.transactionRef || "-"
                                    )}
                                </td>

                                <td>
                                    <span class="${getStatusClass(
                                        payment.status
                                    )}">
                                        ${escapeHtml(
                                            payment.status || "-"
                                        )}
                                    </span>
                                </td>

                                <td>
                                    ${
                                        String(payment.status).toUpperCase() ===
                                        "COMPLETED"
                                            ? `
                                                <button
                                                    type="button"
                                                    class="btn btn-secondary btn-sm"
                                                    onclick="createCustomerReceipt(
                                                        '${escapeHtml(payment.customerPaymentId)}',
                                                        '${escapeHtml(payment.customerId)}',
                                                        '${escapeHtml(payment.customerInvoiceId)}'
                                                    )"
                                                >
                                                    Create Receipt
                                                </button>
                                            `
                                            : "-"
                                    }
                                </td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            </div>
        `;

    } catch (error) {
        console.error(
            "Customer payments loading error:",
            error
        );

        showToast(
            "Unable to load customer payments.",
            "error"
        );
    }
}



async function createCustomerReceipt(
    customerPaymentId,
    customerId,
    customerInvoiceId
) {
    try {
        const receiptId =
            `REC-${Date.now()}`;

        const result = await apiPost(
            "/payments/customer/receipt",
            {
                receiptId: receiptId,
                customerPaymentId: customerPaymentId,
                customerId: customerId,
                customerInvoiceId: customerInvoiceId,
                pdfKey: null
            }
        );

        if (!result || !result.success) {
            throw new Error(
                result?.message ||
                "Unable to create customer receipt."
            );
        }

        showToast(
            `Customer Receipt ${receiptId} created successfully.`,
            "success"
        );

    } catch (error) {
        console.error(
            "Customer receipt error:",
            error
        );

        showToast(
            error.message ||
            "Unable to create customer receipt.",
            "error"
        );
    }
}

/* =========================================================
   INVOICES
========================================================= */

function setupInvoiceTabs() {
    $$("[data-invoice-tab]").forEach(button => {

        button.addEventListener("click", () => {

            const tab = button.dataset.invoiceTab;

            state.currentInvoiceTab = tab;

            $$("[data-invoice-tab]").forEach(item => {
                item.classList.remove("active");
            });

            button.classList.add("active");

            $$(".invoice-tab-content").forEach(content => {
                content.classList.remove("active");
            });

            $(`#invoice-tab-${tab}`)?.classList.add("active");
        });
    });
}


/* =========================================================
   PAYMENTS
========================================================= */

function setupPaymentTabs() {
    $$("[data-payment-tab]").forEach(button => {

        button.addEventListener("click", () => {

            const tab = button.dataset.paymentTab;

            state.currentPaymentTab = tab;

            $$("[data-payment-tab]").forEach(item => {
                item.classList.remove("active");
            });

            button.classList.add("active");

            $$(".payment-tab-content").forEach(content => {
                content.classList.remove("active");
            });

            $(`#payment-tab-${tab}`)?.classList.add("active");
        });
    });
}


/* =========================================================
   INVENTORY
========================================================= */

async function loadInventory() {
    const tbody = $("#inventoryTableBody");

    if (!tbody) return;

    try {
        // Get inventory transactions
        const transactions = await apiGet("/inventory");

        if (!Array.isArray(transactions) || !transactions.length) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-table">
                        No inventory records found.
                    </td>
                </tr>
            `;
            return;
        }

        // Get product master data
        const products = await apiGet("/products");

        // Create product lookup
        const productMap = {};

        if (Array.isArray(products)) {
            products.forEach(product => {
                productMap[product.productId] = product;
            });
        }

        // Calculate stock per product
        const stockMap = {};

        transactions.forEach(item => {
            const productId = item.productId;

            if (!stockMap[productId]) {
                stockMap[productId] = 0;
            }

            const quantity = Number(item.quantity || 0);

            if (String(item.transactionType).toUpperCase() === "IN") {
                stockMap[productId] += quantity;
            } else if (
                String(item.transactionType).toUpperCase() === "OUT"
            ) {
                stockMap[productId] -= quantity;
            } else if (
                String(item.transactionType).toUpperCase() === "ADJUSTMENT"
            ) {
                stockMap[productId] += quantity;
            }
        });

        // Show one row per product
        tbody.innerHTML = Object.keys(stockMap).map(productId => {

            const product = productMap[productId] || {};
            const stock = stockMap[productId] || 0;

            const sellingPrice =
                Number(
                    product.sellingPrice ||
                    product.defaultSellingPrice ||
                    0
                );

            const stockValue = stock * sellingPrice;

            return `
                <tr>
                    <td>${escapeHtml(productId)}</td>

                    <td>
                        ${escapeHtml(
                            product.productName || "-"
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            product.category || "-"
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            product.unit || "-"
                        )}
                    </td>

                    <td>
                        ${formatNumber(stock)}
                    </td>

                    <td>
                        ${formatCurrency(stockValue)}
                    </td>
                </tr>
            `;
        }).join("");

    } catch (error) {
        console.error("Inventory error:", error);
        showToast("Unable to load inventory.", "error");
    }
}


/* =========================================================
   REPORTS
========================================================= */

async function loadReports() {
    try {
        const data = await apiGet("/reports/summary");

        setText(
            "reportRevenue",
            formatCurrency(data.totalSales)
        );

        setText(
            "reportPurchases",
            formatCurrency(data.totalPurchases)
        );

        setText(
            "reportReceivables",
            formatCurrency(data.customerOutstanding)
        );

        setText(
            "reportPayables",
            formatCurrency(data.vendorOutstanding)
        );

    } catch (error) {
        console.error("Reports error:", error);

        showToast(
            "Unable to load reports.",
            "error"
        );
    }
}


/* =========================================================
   AI ASSISTANT
========================================================= */

function addChatMessage(message, sender = "assistant") {
    const container = $("#chatMessages");

    if (!container) return;

    const messageElement = document.createElement("div");

    messageElement.className =
        `chat-message ${sender === "user" ? "user" : "assistant"}`;

    messageElement.innerHTML = `
        <div class="chat-avatar">
            ${sender === "user" ? "Y" : "AI"}
        </div>

        <div class="chat-bubble">
            ${escapeHtml(message)}
        </div>
    `;

    container.appendChild(messageElement);

    container.scrollTop = container.scrollHeight;
}

async function handleAIChat(message) {

    try {

        addChatMessage("Thinking...", "assistant");

        const response = await fetch(
            `${API_BASE_URL}/ai/chat`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    question: message
                })
            }
        );

        const result = await response.json();

        // Remove "Thinking..."
        const messages = $("#chatMessages");
        const lastMessage = messages?.lastElementChild;

        if (
            lastMessage &&
            lastMessage.textContent.includes("Thinking...")
        ) {
            lastMessage.remove();
        }

        if (!response.ok || !result.success) {
            throw new Error(
                result.error || "AI request failed"
            );
        }

        addChatMessage(
            result.answer,
            "assistant"
        );

    } catch (error) {

        console.error("AI Chat Error:", error);

        const messages = $("#chatMessages");
        const lastMessage = messages?.lastElementChild;

        if (
            lastMessage &&
            lastMessage.textContent.includes("Thinking...")
        ) {
            lastMessage.remove();
        }

        addChatMessage(
            "Sorry, I couldn't process your question. Please try again.",
            "assistant"
        );
    }
}

/* =========================================================
   GLOBAL SEARCH
========================================================= */

function setupGlobalSearch() {
    const input = $("#globalSearch");

    if (!input) return;

    input.addEventListener("input", () => {

        const query = input.value.trim().toLowerCase();

        if (!query) return;

        const vendorMatch = state.vendors.find(vendor =>
            Object.values(vendor)
                .some(value =>
                    String(value || "")
                        .toLowerCase()
                        .includes(query)
                )
        );

        if (vendorMatch) {
            showSection("vendors");
            $("#vendorSearch").value = query;
            renderVendors();
            return;
        }

        const customerMatch = state.customers.find(customer =>
            Object.values(customer)
                .some(value =>
                    String(value || "")
                        .toLowerCase()
                        .includes(query)
                )
        );

        if (customerMatch) {
            showSection("customers");
            $("#customerSearch").value = query;
            renderCustomers();
            return;
        }

        const productMatch = state.products.find(product =>
            Object.values(product)
                .some(value =>
                    String(value || "")
                        .toLowerCase()
                        .includes(query)
                )
        );

        if (productMatch) {
            showSection("products");
            $("#productSearch").value = query;
            renderProducts();
        }
    });
}


/* =========================================================
   QUICK ACTIONS
========================================================= */

function setupQuickActions() {
    $$(".quick-action").forEach(button => {

        button.addEventListener("click", () => {

            const action = button.dataset.action;

            switch (action) {

                case "new-purchase":
                    showSection("purchases");
                    break;

                case "new-sale":
                    showSection("sales");
                    break;

                case "upload-invoice":
                    showSection("invoices");
                    break;

                case "record-payment":
                    showSection("payments");
                    break;

                default:
                    break;
            }
        });
    });
}


/* =========================================================
   FILTERS
========================================================= */

function setupFilters() {

    $("#vendorSearch")?.addEventListener(
        "input",
        renderVendors
    );

    $("#vendorStatusFilter")?.addEventListener(
        "change",
        renderVendors
    );

    $("#customerSearch")?.addEventListener(
        "input",
        renderCustomers
    );

    $("#customerStatusFilter")?.addEventListener(
        "change",
        renderCustomers
    );

    $("#productSearch")?.addEventListener(
        "input",
        renderProducts
    );

    $("#productCategoryFilter")?.addEventListener(
        "change",
        renderProducts
    );

    $("#inventorySearch")?.addEventListener(
        "input",
        () => {
            loadInventory();
        }
    );
}


/* =========================================================
   BUTTONS
========================================================= */

function setupButtons() {

    const addVendorButton = $("#addVendorButton");

console.log("Add Vendor button:", addVendorButton);

addVendorButton?.addEventListener(
    "click",
    () => {
        console.log("ADD VENDOR CLICKED");
        showVendorForm();
    }
);
    $("#addCustomerButton")?.addEventListener(
        "click",
        () => showCustomerForm()
    );

    $("#addProductButton")?.addEventListener(
        "click",
        () => showProductForm()
    );

    $("#refreshDashboardButton")?.addEventListener(
        "click",
        loadDashboard
    );

    
    $("#revenuePeriod")?.addEventListener(
        "change",
        loadDashboardSalesChart
    );


    $("#refreshReportsButton")?.addEventListener(
        "click",
        loadReports
    );

    $("#refreshInventoryButton")?.addEventListener(
        "click",
        loadInventory
    );

   $("#newPurchaseButton")?.addEventListener(
    "click",
    () => {
        showSection("purchases");
        showPurchaseForm();
    }
);

    $("#newSaleButton")?.addEventListener(
        "click",
        () => {
            showSection("sales");
            showToast(
                "Sales order workflow will be connected next.",
                "info"
            );
        }
    );

    $("#uploadVendorInvoiceButton")?.addEventListener(
    "click",
    () => {
        showSection("purchases");
        showVendorInvoiceForm();
    }
);

    $("#invoiceUploadButton")?.addEventListener(
        "click",
        () => {
            showSection("invoices");
        }
    );

    $("#invoiceUploadButtonSecondary")?.addEventListener(
        "click",
        () => {
            showSection("invoices");
        }
    );

   $("#recordPaymentButton")?.addEventListener(
    "click",
    () => {
        showSection("payments");
        showVendorPaymentForm();
    }
);

    $("#inventoryTransactionButton")?.addEventListener(
        "click",
        () => {
            showToast(
                "Inventory transaction workflow will be connected to the backend.",
                "info"
            );
        }
    );
}


/* =========================================================
   AI FORM
========================================================= */

function setupAIChat() {

    const form = $("#aiChatForm");
    const input = $("#aiChatInput");

    if (!form || !input) return;

    form.addEventListener("submit", async event => {

        event.preventDefault();

        const message = input.value.trim();

        if (!message) return;

        addChatMessage(message, "user");

        input.value = "";

        await handleAIChat(message);
    });

    $$(".suggestion-chip").forEach(button => {

        button.addEventListener("click", () => {

            const prompt = button.dataset.prompt;

            if (!prompt) return;

            input.value = prompt;
            input.focus();
        });
    });
}


/* =========================================================
   MODAL EVENTS
========================================================= */

function setupModal() {

    $("#modalClose")?.addEventListener(
        "click",
        closeModal
    );

    $("#globalModal")?.addEventListener(
        "click",
        event => {

            if (event.target.id === "globalModal") {
                closeModal();
            }
        }
    );
}


/* =========================================================
   HEADER / USER
========================================================= */

function setupHeaderButtons() {

    $("#notificationButton")?.addEventListener(
        "click",
        () => {
            showToast(
                "No new notifications.",
                "info"
            );
        }
    );

    $("#userMenu")?.addEventListener(
        "click",
        () => {

            openModal(
                "Yaman Motors",
                `
                    <div class="detail-grid">
                        <div>
                            <span>Account</span>
                            <strong>Administrator</strong>
                        </div>

                        <div>
                            <span>Company</span>
                            <strong>Yaman Motors</strong>
                        </div>

                        <div>
                            <span>System</span>
                            <strong>Yaman Motors ERP</strong>
                        </div>
                    </div>
                `,
                `
                    <button
                        class="button secondary"
                        id="modalCancelButton">
                        Close
                    </button>
                `
            );

            $("#modalCancelButton")?.addEventListener(
                "click",
                closeModal
            );
        }
    );
}


/* =========================================================
   SECTION LOADING
========================================================= */

async function loadSectionData(section) {

    switch (section) {

        case "dashboard":
            await loadDashboard();
            break;

        case "vendors":
            await loadVendors();
            break;

        case "customers":
            await loadCustomers();
            break;

        case "products":
            await loadProducts();
            break;

        case "purchases":
            loadPurchaseTab(state.currentPurchaseTab);
            break;

        case "sales":
            loadSalesTab(state.currentSalesTab);
            break;

        case "invoices":
            break;

        case "payments":
            break;

        case "inventory":
            await loadInventory();
            break;

        case "reports":
            await loadReports();
            break;

        case "ai-assistant":
            break;

        default:
            break;
    }
}


/* =========================================================
   KEYBOARD
========================================================= */

function setupKeyboardShortcuts() {

    document.addEventListener("keydown", event => {

        if (event.key === "Escape") {
            closeModal();
        }

        if (
            (event.ctrlKey || event.metaKey) &&
            event.key.toLowerCase() === "k"
        ) {
            event.preventDefault();

            const search = $("#globalSearch");

            if (search) {
                search.focus();
            }
        }
    });
}


/* =========================================================
   INITIALIZATION
========================================================= */

async function initializeApp() {
        const modal = $("#globalModal");

    if (modal) {
        modal.classList.remove("open");
        modal.setAttribute("aria-hidden", "true");
        modal.setAttribute("inert", "");
        modal.style.display = "none";
    }

    setupSidebarToggle();
    setupNavigation();
    setupPurchaseTabs();
    setupSalesTabs();
    setupInvoiceTabs();
    setupPaymentTabs();

    setupFilters();
    setupButtons();
    setupQuickActions();
    setupGlobalSearch();
    setupAIChat();
    setupModal();
    setupHeaderButtons();
    setupKeyboardShortcuts();

    await testBackendConnection();

    await Promise.all([
        loadVendors(),
        loadCustomers(),
        loadProducts(),
        loadDashboard()
    ]);

    showSection("dashboard");
}


/* =========================================================
   START APPLICATION
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initializeApp
);

// =========================================================
// YAMAN MOTORS AI ASSISTANT
// =========================================================

async function sendAIQuestion() {

    const input =
        document.querySelector(
            'input[placeholder*="question"], textarea[placeholder*="question"]'
        );

    if (!input) {
        console.error("AI input not found");
        return;
    }

    const question = input.value.trim();

    if (!question) return;

    const chatArea =
        document.querySelector(
            ".ai-chat, .chat-messages, #aiChatMessages"
        );

    try {

        if (chatArea) {
            chatArea.innerHTML += `
                <div class="ai-message user-message">
                    ${escapeHtml(question)}
                </div>
            `;
        }

        input.value = "";

        const response = await fetch(
            `${API_BASE_URL}/ai/chat`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    question: question
                })
            }
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(
                result.error || "AI request failed"
            );
        }

        if (chatArea) {
            chatArea.innerHTML += `
                <div class="ai-message assistant-message">
                    ${escapeHtml(result.answer)}
                </div>
            `;

            chatArea.scrollTop = chatArea.scrollHeight;
        }

    } catch (error) {

        console.error("AI Assistant Error:", error);

        if (chatArea) {
            chatArea.innerHTML += `
                <div class="ai-message assistant-message">
                    Sorry, I couldn't process that request.
                </div>
            `;
        }
    }
}