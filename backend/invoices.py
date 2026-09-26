from database import get_connection


# =========================================================
# VENDOR INVOICES
# =========================================================

def get_all_vendor_invoices():
    connection = get_connection()

    try:
        cursor = connection.cursor()

        cursor.execute("""
            SELECT
                vi.vendorInvoiceId,
                vi.vendorId,
                v.vendorName,
                vi.poId,
                vi.invoiceNumber,
                vi.invoiceDate,
                vi.dueDate,
                vi.status,
                vi.subtotal,
                vi.taxTotal,
                vi.grandTotal,
                vi.sourceFile
            FROM VendorInvoices vi
            INNER JOIN Vendors v
                ON vi.vendorId = v.vendorId
            ORDER BY vi.invoiceDate DESC,
                     vi.vendorInvoiceId DESC
        """)

        columns = [column[0] for column in cursor.description]
        rows = cursor.fetchall()

        return [
            dict(zip(columns, row))
            for row in rows
        ]

    finally:
        connection.close()


def get_vendor_invoice(invoice_id):
    connection = get_connection()

    try:
        cursor = connection.cursor()

        cursor.execute("""
            SELECT
                vi.vendorInvoiceId,
                vi.vendorId,
                v.vendorName,
                vi.poId,
                vi.invoiceNumber,
                vi.invoiceDate,
                vi.dueDate,
                vi.status,
                vi.subtotal,
                vi.taxTotal,
                vi.grandTotal,
                vi.sourceFile
            FROM VendorInvoices vi
            INNER JOIN Vendors v
                ON vi.vendorId = v.vendorId
            WHERE vi.vendorInvoiceId = ?
        """, (invoice_id,))

        invoice_row = cursor.fetchone()

        if not invoice_row:
            return None

        invoice_columns = [
            column[0]
            for column in cursor.description
        ]

        invoice = dict(
            zip(invoice_columns, invoice_row)
        )

        cursor.execute("""
            SELECT
                vii.invoiceItemId,
                vii.vendorInvoiceId,
                vii.productId,
                p.productName,
                vii.quantity,
                vii.unitPrice,
                vii.taxRate,
                vii.taxAmount,
                vii.lineTotal
            FROM VendorInvoiceItems vii
            INNER JOIN Products p
                ON vii.productId = p.productId
            WHERE vii.vendorInvoiceId = ?
            ORDER BY vii.invoiceItemId
        """, (invoice_id,))

        item_columns = [
            column[0]
            for column in cursor.description
        ]

        item_rows = cursor.fetchall()

        invoice["items"] = [
            dict(zip(item_columns, row))
            for row in item_rows
        ]

        return invoice

    finally:
        connection.close()


def create_vendor_invoice(
    invoice_id,
    vendor_id,
    po_id=None,
    invoice_number=None,
    invoice_date=None,
    due_date=None,
    status="OPEN",
    source_file=None
):
    connection = get_connection()

    try:
        cursor = connection.cursor()

        cursor.execute("""
            SELECT vendorId
            FROM Vendors
            WHERE vendorId = ?
        """, (vendor_id,))

        if not cursor.fetchone():
            return {
                "success": False,
                "message": "Vendor not found"
            }

        cursor.execute("""
            INSERT INTO VendorInvoices (
                vendorInvoiceId,
                vendorId,
                poId,
                invoiceNumber,
                invoiceDate,
                dueDate,
                subtotal,
                taxTotal,
                grandTotal,
                status,
                sourceFile
            )
            VALUES (?, ?, ?, ?, ?, ?, 0, 0, 0, ?, ?)
        """, (
            invoice_id,
            vendor_id,
            po_id,
            invoice_number,
            invoice_date,
            due_date,
            status,
            source_file
        ))

        connection.commit()

        return {
            "success": True,
            "vendorInvoiceId": invoice_id,
            "message": "Vendor invoice created successfully"
        }

    except Exception:
        connection.rollback()
        raise

    finally:
        connection.close()


def add_vendor_invoice_item(
    invoice_id,
    product_id,
    quantity,
    unit_price,
    tax_rate=0
):
    connection = get_connection()

    try:
        cursor = connection.cursor()

        cursor.execute("""
            SELECT vendorInvoiceId
            FROM VendorInvoices
            WHERE vendorInvoiceId = ?
        """, (invoice_id,))

        if not cursor.fetchone():
            return {
                "success": False,
                "message": "Vendor invoice not found"
            }

        cursor.execute("""
            SELECT productId
            FROM Products
            WHERE productId = ?
        """, (product_id,))

        if not cursor.fetchone():
            return {
                "success": False,
                "message": "Product not found"
            }

        quantity = float(quantity)
        unit_price = float(unit_price)
        tax_rate = float(tax_rate)

        subtotal = quantity * unit_price
        tax_amount = subtotal * (tax_rate / 100)
        line_total = subtotal + tax_amount

        cursor.execute("""
            INSERT INTO VendorInvoiceItems (
                vendorInvoiceId,
                productId,
                quantity,
                unitPrice,
                taxRate,
                taxAmount,
                lineTotal
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            invoice_id,
            product_id,
            quantity,
            unit_price,
            tax_rate,
            tax_amount,
            line_total
        ))

        cursor.execute("""
            SELECT
                COALESCE(SUM(quantity * unitPrice), 0),
                COALESCE(SUM(taxAmount), 0),
                COALESCE(SUM(lineTotal), 0)
            FROM VendorInvoiceItems
            WHERE vendorInvoiceId = ?
        """, (invoice_id,))

        subtotal_total, tax_total, grand_total = cursor.fetchone()

        cursor.execute("""
            UPDATE VendorInvoices
            SET
                subtotal = ?,
                taxTotal = ?,
                grandTotal = ?
            WHERE vendorInvoiceId = ?
        """, (
            subtotal_total,
            tax_total,
            grand_total,
            invoice_id
        ))

        connection.commit()

        return {
            "success": True,
            "vendorInvoiceId": invoice_id,
            "productId": product_id,
            "quantity": quantity,
            "unitPrice": unit_price,
            "taxRate": tax_rate,
            "taxAmount": tax_amount,
            "lineTotal": line_total,
            "subtotal": subtotal_total,
            "taxTotal": tax_total,
            "grandTotal": grand_total,
            "message": "Vendor invoice item added successfully"
        }

    except Exception:
        connection.rollback()
        raise

    finally:
        connection.close()


def update_vendor_invoice_status(invoice_id, status):
    connection = get_connection()

    try:
        cursor = connection.cursor()

        cursor.execute("""
            UPDATE VendorInvoices
            SET status = ?
            WHERE vendorInvoiceId = ?
        """, (
            status,
            invoice_id
        ))

        if cursor.rowcount == 0:
            return {
                "success": False,
                "message": "Vendor invoice not found"
            }

        connection.commit()

        return {
            "success": True,
            "vendorInvoiceId": invoice_id,
            "status": status,
            "message": "Vendor invoice status updated successfully"
        }

    except Exception:
        connection.rollback()
        raise

    finally:
        connection.close()


# =========================================================
# CUSTOMER INVOICES
# =========================================================

def get_all_customer_invoices():
    connection = get_connection()

    try:
        cursor = connection.cursor()

        cursor.execute("""
            SELECT
                ci.customerInvoiceId,
                ci.customerId,
                c.customerName,
                ci.soId,
                ci.invoiceNumber,
                ci.invoiceDate,
                ci.dueDate,
                ci.status,
                ci.subtotal,
                ci.taxTotal,
                ci.grandTotal
            FROM CustomerInvoices ci
            INNER JOIN Customers c
                ON ci.customerId = c.customerId
            ORDER BY ci.invoiceDate DESC,
                     ci.customerInvoiceId DESC
        """)

        columns = [column[0] for column in cursor.description]
        rows = cursor.fetchall()

        return [
            dict(zip(columns, row))
            for row in rows
        ]

    finally:
        connection.close()


def get_customer_invoice(invoice_id):
    connection = get_connection()

    try:
        cursor = connection.cursor()

        cursor.execute("""
            SELECT
                ci.customerInvoiceId,
                ci.customerId,
                c.customerName,
                ci.soId,
                ci.invoiceNumber,
                ci.invoiceDate,
                ci.dueDate,
                ci.status,
                ci.subtotal,
                ci.taxTotal,
                ci.grandTotal
            FROM CustomerInvoices ci
            INNER JOIN Customers c
                ON ci.customerId = c.customerId
            WHERE ci.customerInvoiceId = ?
        """, (invoice_id,))

        invoice_row = cursor.fetchone()

        if not invoice_row:
            return None

        invoice_columns = [
            column[0]
            for column in cursor.description
        ]

        invoice = dict(
            zip(invoice_columns, invoice_row)
        )

        cursor.execute("""
            SELECT
                cii.invoiceItemId,
                cii.customerInvoiceId,
                cii.productId,
                p.productName,
                cii.quantity,
                cii.unitPrice,
                cii.taxRate,
                cii.taxAmount,
                cii.lineTotal
            FROM CustomerInvoiceItems cii
            INNER JOIN Products p
                ON cii.productId = p.productId
            WHERE cii.customerInvoiceId = ?
            ORDER BY cii.invoiceItemId
        """, (invoice_id,))

        item_columns = [
            column[0]
            for column in cursor.description
        ]

        item_rows = cursor.fetchall()

        invoice["items"] = [
            dict(zip(item_columns, row))
            for row in item_rows
        ]

        return invoice

    finally:
        connection.close()


def create_customer_invoice(
    invoice_id,
    customer_id,
    so_id=None,
    invoice_number=None,
    invoice_date=None,
    due_date=None,
    status="OPEN"
):
    connection = get_connection()

    try:
        cursor = connection.cursor()

        cursor.execute("""
            SELECT customerId
            FROM Customers
            WHERE customerId = ?
        """, (customer_id,))

        if not cursor.fetchone():
            return {
                "success": False,
                "message": "Customer not found"
            }

        cursor.execute("""
            INSERT INTO CustomerInvoices (
                customerInvoiceId,
                customerId,
                soId,
                invoiceNumber,
                invoiceDate,
                dueDate,
                subtotal,
                taxTotal,
                grandTotal,
                status
            )
            VALUES (?, ?, ?, ?, ?, ?, 0, 0, 0, ?)
        """, (
            invoice_id,
            customer_id,
            so_id,
            invoice_number,
            invoice_date,
            due_date,
            status
        ))

        connection.commit()

        return {
            "success": True,
            "customerInvoiceId": invoice_id,
            "message": "Customer invoice created successfully"
        }

    except Exception:
        connection.rollback()
        raise

    finally:
        connection.close()


def add_customer_invoice_item(
    invoice_id,
    product_id,
    quantity,
    unit_price,
    tax_rate=0
):
    connection = get_connection()

    try:
        cursor = connection.cursor()

        cursor.execute("""
            SELECT customerInvoiceId
            FROM CustomerInvoices
            WHERE customerInvoiceId = ?
        """, (invoice_id,))

        if not cursor.fetchone():
            return {
                "success": False,
                "message": "Customer invoice not found"
            }

        cursor.execute("""
            SELECT productId
            FROM Products
            WHERE productId = ?
        """, (product_id,))

        if not cursor.fetchone():
            return {
                "success": False,
                "message": "Product not found"
            }

        quantity = float(quantity)
        unit_price = float(unit_price)
        tax_rate = float(tax_rate)

        subtotal = quantity * unit_price
        tax_amount = subtotal * (tax_rate / 100)
        line_total = subtotal + tax_amount

        cursor.execute("""
            INSERT INTO CustomerInvoiceItems (
                customerInvoiceId,
                productId,
                quantity,
                unitPrice,
                taxRate,
                taxAmount,
                lineTotal
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            invoice_id,
            product_id,
            quantity,
            unit_price,
            tax_rate,
            tax_amount,
            line_total
        ))

        cursor.execute("""
            SELECT
                COALESCE(SUM(quantity * unitPrice), 0),
                COALESCE(SUM(taxAmount), 0),
                COALESCE(SUM(lineTotal), 0)
            FROM CustomerInvoiceItems
            WHERE customerInvoiceId = ?
        """, (invoice_id,))

        subtotal_total, tax_total, grand_total = cursor.fetchone()

        cursor.execute("""
            UPDATE CustomerInvoices
            SET
                subtotal = ?,
                taxTotal = ?,
                grandTotal = ?
            WHERE customerInvoiceId = ?
        """, (
            subtotal_total,
            tax_total,
            grand_total,
            invoice_id
        ))

        connection.commit()

        return {
            "success": True,
            "customerInvoiceId": invoice_id,
            "productId": product_id,
            "quantity": quantity,
            "unitPrice": unit_price,
            "taxRate": tax_rate,
            "taxAmount": tax_amount,
            "lineTotal": line_total,
            "subtotal": subtotal_total,
            "taxTotal": tax_total,
            "grandTotal": grand_total,
            "message": "Customer invoice item added successfully"
        }

    except Exception:
        connection.rollback()
        raise

    finally:
        connection.close()


def update_customer_invoice_status(invoice_id, status):
    connection = get_connection()

    try:
        cursor = connection.cursor()

        cursor.execute("""
            UPDATE CustomerInvoices
            SET status = ?
            WHERE customerInvoiceId = ?
        """, (
            status,
            invoice_id
        ))

        if cursor.rowcount == 0:
            return {
                "success": False,
                "message": "Customer invoice not found"
            }

        connection.commit()

        return {
            "success": True,
            "customerInvoiceId": invoice_id,
            "status": status,
            "message": "Customer invoice status updated successfully"
        }

    except Exception:
        connection.rollback()
        raise

    finally:
        connection.close()