from database import get_connection


def get_all_products():
    connection = get_connection()

    try:
        cursor = connection.cursor()

        cursor.execute("""
            SELECT
                productId,
                productName,
                category,
                productType,
                unit,
                description,
                sellingPrice,
                taxRate,
                status,
                createdAt
            FROM Products
            ORDER BY productName
        """)

        columns = [column[0] for column in cursor.description]
        rows = cursor.fetchall()

        return [dict(zip(columns, row)) for row in rows]

    finally:
        connection.close()


def get_product(product_id):
    connection = get_connection()

    try:
        cursor = connection.cursor()

        cursor.execute("""
            SELECT
                productId,
                productName,
                category,
                productType,
                unit,
                description,
                sellingPrice,
                taxRate,
                status,
                createdAt
            FROM Products
            WHERE productId = ?
        """, (product_id,))

        row = cursor.fetchone()

        if not row:
            return None

        columns = [column[0] for column in cursor.description]

        return dict(zip(columns, row))

    finally:
        connection.close()


def add_product(
    product_id,
    product_name,
    category=None,
    product_type=None,
    unit=None,
    description=None,
    selling_price=None,
    tax_rate=None
):
    connection = get_connection()

    try:
        cursor = connection.cursor()

        cursor.execute("""
            INSERT INTO Products (
                productId,
                productName,
                category,
                productType,
                unit,
                description,
                sellingPrice,
                taxRate
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            product_id,
            product_name,
            category,
            product_type,
            unit,
            description,
            selling_price,
            tax_rate
        ))

        connection.commit()

        return {
            "success": True,
            "productId": product_id,
            "message": "Product added successfully"
        }

    except Exception:
        connection.rollback()
        raise

    finally:
        connection.close()


def update_product(
    product_id,
    product_name,
    category=None,
    product_type=None,
    unit=None,
    description=None,
    selling_price=None,
    tax_rate=None
):
    connection = get_connection()

    try:
        cursor = connection.cursor()

        cursor.execute("""
            UPDATE Products
            SET
                productName = ?,
                category = ?,
                productType = ?,
                unit = ?,
                description = ?,
                sellingPrice = ?,
                taxRate = ?
            WHERE productId = ?
        """, (
            product_name,
            category,
            product_type,
            unit,
            description,
            selling_price,
            tax_rate,
            product_id
        ))

        if cursor.rowcount == 0:
            return {
                "success": False,
                "message": "Product not found"
            }

        connection.commit()

        return {
            "success": True,
            "productId": product_id,
            "message": "Product updated successfully"
        }

    except Exception:
        connection.rollback()
        raise

    finally:
        connection.close()


def deactivate_product(product_id):
    connection = get_connection()

    try:
        cursor = connection.cursor()

        cursor.execute("""
            UPDATE Products
            SET status = 'INACTIVE'
            WHERE productId = ?
        """, (product_id,))

        if cursor.rowcount == 0:
            return {
                "success": False,
                "message": "Product not found"
            }

        connection.commit()

        return {
            "success": True,
            "productId": product_id,
            "message": "Product deactivated successfully"
        }

    except Exception:
        connection.rollback()
        raise

    finally:
        connection.close()
