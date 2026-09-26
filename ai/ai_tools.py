from backend.database import get_connection


def run_query(query, params=()):
    conn = get_connection()

    try:
        cursor = conn.cursor()
        cursor.execute(query, params)

        if cursor.description is None:
            return []

        columns = [column[0] for column in cursor.description]
        rows = cursor.fetchall()

        return [
            dict(zip(columns, row))
            for row in rows
        ]

    finally:
        conn.close()


def get_table_columns(table_name):
    query = """
        SELECT COLUMN_NAME
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = ?
        ORDER BY ORDINAL_POSITION
    """

    rows = run_query(query, (table_name,))
    return [row["COLUMN_NAME"] for row in rows]


def who_do_we_owe():
    """
    Calculate outstanding amount for each vendor.
    Vendor outstanding = invoices - successful payments.
    """

    query = """
        SELECT
            v.vendorId,
            v.vendorName,
            COALESCE(SUM(vi.grandTotal), 0) AS totalInvoiced,
            COALESCE(
                (
                    SELECT SUM(vp.amount)
                    FROM VendorPayments vp
                    WHERE vp.vendorInvoiceId = vi.vendorInvoiceId
                      AND vp.status = 'PAID'
                ), 0
            ) AS totalPaid
        FROM Vendors v
        LEFT JOIN VendorInvoices vi
            ON v.vendorId = vi.vendorId
        GROUP BY
            v.vendorId,
            v.vendorName,
            vi.vendorInvoiceId
    """

    rows = run_query(query)

    result = {}

    for row in rows:
        vendor_id = row["vendorId"]
        vendor_name = row["vendorName"]

        if vendor_id not in result:
            result[vendor_id] = {
                "vendorId": vendor_id,
                "vendorName": vendor_name,
                "totalInvoiced": 0,
                "totalPaid": 0
            }

        result[vendor_id]["totalInvoiced"] += float(row["totalInvoiced"] or 0)
        result[vendor_id]["totalPaid"] += float(row["totalPaid"] or 0)

    for vendor in result.values():
        vendor["outstanding"] = (
            vendor["totalInvoiced"] -
            vendor["totalPaid"]
        )

    return list(result.values())


def revenue_this_month():
    query = """
        SELECT
            COALESCE(SUM(grandTotal), 0) AS revenue
        FROM CustomerInvoices
        WHERE YEAR(invoiceDate) = YEAR(GETDATE())
          AND MONTH(invoiceDate) = MONTH(GETDATE())
    """

    rows = run_query(query)

    return {
        "period": "current month",
        "revenue": float(rows[0]["revenue"] or 0)
    }


def cheapest_vendor(product_code):
    query = """
        SELECT
            p.productId,
            p.productName,
            v.vendorId,
            v.vendorName,
            vp.purchasePrice,
            vp.currency,
            vp.leadTimeDays
        FROM Products p
        INNER JOIN VendorProducts vp
            ON p.productId = vp.productId
        INNER JOIN Vendors v
            ON vp.vendorId = v.vendorId
        WHERE
            p.productId = ?
            OR p.productName LIKE ?
        ORDER BY vp.purchasePrice ASC
    """

    return run_query(
        query,
        (product_code, f"%{product_code}%")
    )


def customer_transactions(customer_name):
    query = """
        SELECT
            c.customerName,
            ci.invoiceNumber,
            ci.invoiceDate,
            ci.grandTotal,
            ci.status
        FROM Customers c
        INNER JOIN CustomerInvoices ci
            ON c.customerId = ci.customerId
        WHERE c.customerName LIKE ?
        ORDER BY ci.invoiceDate DESC
    """

    return run_query(
        query,
        (f"%{customer_name}%",)
    )