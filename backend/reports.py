from database import get_connection


# ============================================================
# SALES / REVENUE
# ============================================================

def get_total_sales():
    connection = get_connection()

    try:
        cursor = connection.cursor()

        cursor.execute("""
            SELECT COALESCE(SUM(grandTotal), 0)
            FROM CustomerInvoices
            WHERE status <> 'CANCELLED'
        """)

        return cursor.fetchone()[0]

    finally:
        connection.close()


# ============================================================
# PURCHASES
# ============================================================

def get_total_purchases():
    connection = get_connection()

    try:
        cursor = connection.cursor()

        cursor.execute("""
            SELECT COALESCE(SUM(grandTotal), 0)
            FROM VendorInvoices
            WHERE status <> 'CANCELLED'
        """)

        return cursor.fetchone()[0]

    finally:
        connection.close()


# ============================================================
# CUSTOMER OUTSTANDING
# ============================================================

def get_customer_outstanding():
    connection = get_connection()

    try:
        cursor = connection.cursor()

        cursor.execute("""
            SELECT
                COALESCE(SUM(ci.grandTotal), 0)
                -
                COALESCE((
                    SELECT SUM(cp.amount)
                    FROM CustomerPayments cp
                    WHERE cp.status = 'COMPLETED'
                ), 0)
            FROM CustomerInvoices ci
            WHERE ci.status <> 'CANCELLED'
        """)

        return cursor.fetchone()[0]

    finally:
        connection.close()


# ============================================================
# VENDOR OUTSTANDING
# ============================================================

def get_vendor_outstanding():
    connection = get_connection()

    try:
        cursor = connection.cursor()

        cursor.execute("""
            SELECT
                COALESCE(SUM(vi.grandTotal), 0)
                -
                COALESCE((
                    SELECT SUM(vp.amount)
                    FROM VendorPayments vp
                    WHERE vp.status = 'COMPLETED'
                ), 0)
            FROM VendorInvoices vi
            WHERE vi.status <> 'CANCELLED'
        """)

        return cursor.fetchone()[0]

    finally:
        connection.close()


# ============================================================
# BUSINESS SUMMARY
# ============================================================

def get_business_summary():
    return {
        "totalSales": get_total_sales(),
        "totalPurchases": get_total_purchases(),
        "customerOutstanding": get_customer_outstanding(),
        "vendorOutstanding": get_vendor_outstanding()
    }