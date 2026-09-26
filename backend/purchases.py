from database import get_connection


# =========================================================
# GET ALL PURCHASE ORDERS
# =========================================================

def get_all_purchase_orders():
    connection = get_connection()

    try:
        cursor = connection.cursor()

        cursor.execute("""
            SELECT
                po.poId,
                po.vendorId,
                v.vendorName,
                po.poDate,
                po.expectedDate,
                po.status,
                po.subtotal,
                po.taxTotal,
                po.grandTotal,
                po.notes
            FROM PurchaseOrders po
            INNER JOIN Vendors v
                ON po.vendorId = v.vendorId
            ORDER BY po.poDate DESC, po.poId DESC
        """)

        columns = [column[0] for column in cursor.description]
        rows = cursor.fetchall()

        return [
            dict(zip(columns, row))
            for row in rows
        ]

    finally:
        connection.close()


# =========================================================
# GET SINGLE PURCHASE ORDER
# =========================================================

def get_purchase_order(po_id):
    connection = get_connection()

    try:
        cursor = connection.cursor()

        cursor.execute("""
            SELECT
                po.poId,
                po.vendorId,
                v.vendorName,
                po.poDate,
                po.expectedDate,
                po.status,
                po.subtotal,
                po.taxTotal,
                po.grandTotal,
                po.notes
            FROM PurchaseOrders po
            INNER JOIN Vendors v
                ON po.vendorId = v.vendorId
            WHERE po.poId = ?
        """, (po_id,))

        order_row = cursor.fetchone()

        if not order_row:
            return None

        order_columns = [
            column[0]
            for column in cursor.description
        ]

        order = dict(
            zip(order_columns, order_row)
        )

        cursor.execute("""
            SELECT
                poi.poItemId,
                poi.productId,
                p.productName,
                poi.quantity,
                poi.unitPrice,
                poi.taxRate,
                poi.taxAmount,
                poi.lineTotal
            FROM PurchaseOrderItems poi
            INNER JOIN Products p
                ON poi.productId = p.productId
            WHERE poi.poId = ?
            ORDER BY poi.poItemId
        """, (po_id,))

        item_columns = [
            column[0]
            for column in cursor.description
        ]

        item_rows = cursor.fetchall()

        order["items"] = [
            dict(zip(item_columns, row))
            for row in item_rows
        ]

        return order

    finally:
        connection.close()


# =========================================================
# CREATE PURCHASE ORDER
# =========================================================

def create_purchase_order(
    po_id,
    vendor_id,
    po_date,
    expected_date=None,
    status="OPEN",
    subtotal=0,
    tax_total=0,
    grand_total=0,
    notes=None
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
            INSERT INTO PurchaseOrders (
                poId,
                vendorId,
                poDate,
                expectedDate,
                status,
                subtotal,
                taxTotal,
                grandTotal,
                notes
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            po_id,
            vendor_id,
            po_date,
            expected_date,
            status,
            subtotal,
            tax_total,
            grand_total,
            notes
        ))

        connection.commit()

        return {
            "success": True,
            "poId": po_id,
            "message": "Purchase order created successfully"
        }

    except Exception:
        connection.rollback()
        raise

    finally:
        connection.close()


# =========================================================
# ADD PURCHASE ORDER ITEM
# =========================================================

def add_purchase_order_item(
    po_id,
    product_id,
    quantity,
    unit_price,
    tax_rate=0
):
    connection = get_connection()

    try:
        cursor = connection.cursor()

        # Check purchase order
        cursor.execute("""
            SELECT poId
            FROM PurchaseOrders
            WHERE poId = ?
        """, (po_id,))

        if not cursor.fetchone():
            return {
                "success": False,
                "message": "Purchase order not found"
            }

        # Check product
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
            INSERT INTO PurchaseOrderItems (
                poId,
                productId,
                quantity,
                unitPrice,
                taxRate,
                taxAmount,
                lineTotal
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            po_id,
            product_id,
            quantity,
            unit_price,
            tax_rate,
            tax_amount,
            line_total
        ))

        # Recalculate PO totals
        cursor.execute("""
            SELECT
                COALESCE(SUM(quantity * unitPrice), 0),
                COALESCE(SUM(taxAmount), 0),
                COALESCE(SUM(lineTotal), 0)
            FROM PurchaseOrderItems
            WHERE poId = ?
        """, (po_id,))

        subtotal_total, tax_total, grand_total = cursor.fetchone()

        cursor.execute("""
            UPDATE PurchaseOrders
            SET
                subtotal = ?,
                taxTotal = ?,
                grandTotal = ?
            WHERE poId = ?
        """, (
            subtotal_total,
            tax_total,
            grand_total,
            po_id
        ))

        connection.commit()

        return {
            "success": True,
            "poId": po_id,
            "productId": product_id,
            "quantity": quantity,
            "unitPrice": unit_price,
            "taxRate": tax_rate,
            "taxAmount": tax_amount,
            "lineTotal": line_total,
            "subtotal": subtotal_total,
            "taxTotal": tax_total,
            "grandTotal": grand_total,
            "message": "Purchase order item added successfully"
        }

    except Exception:
        connection.rollback()
        raise

    finally:
        connection.close()


# =========================================================
# UPDATE PURCHASE ORDER STATUS
# =========================================================

def update_purchase_order_status(po_id, status):
    connection = get_connection()

    try:
        cursor = connection.cursor()

        cursor.execute("""
            UPDATE PurchaseOrders
            SET status = ?
            WHERE poId = ?
        """, (
            status,
            po_id
        ))

        if cursor.rowcount == 0:
            return {
                "success": False,
                "message": "Purchase order not found"
            }

        connection.commit()

        return {
            "success": True,
            "poId": po_id,
            "status": status,
            "message": "Purchase order status updated successfully"
        }

    except Exception:
        connection.rollback()
        raise

    finally:
        connection.close()