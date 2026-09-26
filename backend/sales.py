from database import get_connection


# =========================================================
# GET ALL SALES ORDERS
# =========================================================

def get_all_sales_orders():
    connection = get_connection()

    try:
        cursor = connection.cursor()

        cursor.execute("""
            SELECT
                so.soId,
                so.customerId,
                c.customerName,
                so.soDate,
                so.expectedDate,
                so.status,
                so.subtotal,
                so.taxTotal,
                so.grandTotal,
                so.notes
            FROM SalesOrders so
            INNER JOIN Customers c
                ON so.customerId = c.customerId
            ORDER BY so.soDate DESC, so.soId DESC
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
# GET SINGLE SALES ORDER
# =========================================================

def get_sales_order(so_id):
    connection = get_connection()

    try:
        cursor = connection.cursor()

        # Get sales order header
        cursor.execute("""
            SELECT
                so.soId,
                so.customerId,
                c.customerName,
                so.soDate,
                so.expectedDate,
                so.status,
                so.subtotal,
                so.taxTotal,
                so.grandTotal,
                so.notes
            FROM SalesOrders so
            INNER JOIN Customers c
                ON so.customerId = c.customerId
            WHERE so.soId = ?
        """, (so_id,))

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

        # Get sales order items
        cursor.execute("""
            SELECT
                soi.soItemId,
                soi.productId,
                p.productName,
                soi.quantity,
                soi.unitPrice,
                soi.taxRate,
                soi.taxAmount,
                soi.lineTotal
            FROM SalesOrderItems soi
            INNER JOIN Products p
                ON soi.productId = p.productId
            WHERE soi.soId = ?
            ORDER BY soi.soItemId
        """, (so_id,))

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
# CREATE SALES ORDER
# =========================================================

def create_sales_order(
    so_id,
    customer_id,
    so_date,
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
            INSERT INTO SalesOrders (
                soId,
                customerId,
                soDate,
                expectedDate,
                status,
                subtotal,
                taxTotal,
                grandTotal,
                notes
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            so_id,
            customer_id,
            so_date,
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
            "soId": so_id,
            "message": "Sales order created successfully"
        }

    except Exception:
        connection.rollback()
        raise

    finally:
        connection.close()


# =========================================================
# ADD SALES ORDER ITEM
# =========================================================

def add_sales_order_item(
    so_id,
    product_id,
    quantity,
    unit_price,
    tax_rate=0
):
    connection = get_connection()

    try:
        cursor = connection.cursor()

        # Check sales order exists
        cursor.execute("""
            SELECT soId
            FROM SalesOrders
            WHERE soId = ?
        """, (so_id,))

        if not cursor.fetchone():
            return {
                "success": False,
                "message": "Sales order not found"
            }

        # Check product exists
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

        # Calculate values
        quantity = float(quantity)
        unit_price = float(unit_price)
        tax_rate = float(tax_rate)

        subtotal = quantity * unit_price
        tax_amount = subtotal * (tax_rate / 100)
        line_total = subtotal + tax_amount

        # Insert item
        cursor.execute("""
            INSERT INTO SalesOrderItems (
                soId,
                productId,
                quantity,
                unitPrice,
                taxRate,
                taxAmount,
                lineTotal
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            so_id,
            product_id,
            quantity,
            unit_price,
            tax_rate,
            tax_amount,
            line_total
        ))

        # Recalculate complete order totals
        cursor.execute("""
            SELECT
                COALESCE(SUM(quantity * unitPrice), 0),
                COALESCE(SUM(taxAmount), 0),
                COALESCE(SUM(lineTotal), 0)
            FROM SalesOrderItems
            WHERE soId = ?
        """, (so_id,))

        subtotal_total, tax_total, grand_total = cursor.fetchone()

        # Update sales order header
        cursor.execute("""
            UPDATE SalesOrders
            SET
                subtotal = ?,
                taxTotal = ?,
                grandTotal = ?
            WHERE soId = ?
        """, (
            subtotal_total,
            tax_total,
            grand_total,
            so_id
        ))

        connection.commit()

        return {
            "success": True,
            "soId": so_id,
            "productId": product_id,
            "quantity": quantity,
            "unitPrice": unit_price,
            "taxRate": tax_rate,
            "taxAmount": tax_amount,
            "lineTotal": line_total,
            "subtotal": subtotal_total,
            "taxTotal": tax_total,
            "grandTotal": grand_total,
            "message": "Sales order item added successfully"
        }

    except Exception:
        connection.rollback()
        raise

    finally:
        connection.close()


# =========================================================
# UPDATE SALES ORDER STATUS
# =========================================================

def update_sales_order_status(so_id, status):
    connection = get_connection()

    try:
        cursor = connection.cursor()

        cursor.execute("""
            UPDATE SalesOrders
            SET status = ?
            WHERE soId = ?
        """, (
            status,
            so_id
        ))

        if cursor.rowcount == 0:
            return {
                "success": False,
                "message": "Sales order not found"
            }

        connection.commit()

        return {
            "success": True,
            "soId": so_id,
            "status": status,
            "message": "Sales order status updated successfully"
        }

    except Exception:
        connection.rollback()
        raise

    finally:
        connection.close()