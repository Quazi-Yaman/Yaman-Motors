from database import get_connection


def get_all_customers():
    connection = get_connection()

    try:
        cursor = connection.cursor()

        cursor.execute("""
            SELECT
                customerId,
                customerName,
                address,
                email,
                phone,
                gstin,
                status,
                createdAt
            FROM Customers
            ORDER BY customerName
        """)

        columns = [column[0] for column in cursor.description]
        rows = cursor.fetchall()

        return [
            dict(zip(columns, row))
            for row in rows
        ]

    finally:
        connection.close()


def get_customer(customer_id):
    connection = get_connection()

    try:
        cursor = connection.cursor()

        cursor.execute("""
            SELECT
                customerId,
                customerName,
                address,
                email,
                phone,
                gstin,
                status,
                createdAt
            FROM Customers
            WHERE customerId = ?
        """, (customer_id,))

        row = cursor.fetchone()

        if not row:
            return None

        columns = [column[0] for column in cursor.description]

        return dict(zip(columns, row))

    finally:
        connection.close()


def add_customer(
    customer_id,
    customer_name,
    address=None,
    email=None,
    phone=None,
    gstin=None
):
    connection = get_connection()

    try:
        cursor = connection.cursor()

        cursor.execute("""
            INSERT INTO Customers (
                customerId,
                customerName,
                address,
                email,
                phone,
                gstin
            )
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            customer_id,
            customer_name,
            address,
            email,
            phone,
            gstin
        ))

        connection.commit()

        return {
            "success": True,
            "customerId": customer_id,
            "message": "Customer added successfully"
        }

    except Exception:
        connection.rollback()
        raise

    finally:
        connection.close()


def update_customer(
    customer_id,
    customer_name,
    address=None,
    email=None,
    phone=None,
    gstin=None
):
    connection = get_connection()

    try:
        cursor = connection.cursor()

        cursor.execute("""
            UPDATE Customers
            SET
                customerName = ?,
                address = ?,
                email = ?,
                phone = ?,
                gstin = ?
            WHERE customerId = ?
        """, (
            customer_name,
            address,
            email,
            phone,
            gstin,
            customer_id
        ))

        if cursor.rowcount == 0:
            return {
                "success": False,
                "message": "Customer not found"
            }

        connection.commit()

        return {
            "success": True,
            "customerId": customer_id,
            "message": "Customer updated successfully"
        }

    except Exception:
        connection.rollback()
        raise

    finally:
        connection.close()


def deactivate_customer(customer_id):
    connection = get_connection()

    try:
        cursor = connection.cursor()

        cursor.execute("""
            UPDATE Customers
            SET status = 'INACTIVE'
            WHERE customerId = ?
        """, (customer_id,))

        if cursor.rowcount == 0:
            return {
                "success": False,
                "message": "Customer not found"
            }

        connection.commit()

        return {
            "success": True,
            "customerId": customer_id,
            "message": "Customer deactivated successfully"
        }

    except Exception:
        connection.rollback()
        raise

    finally:
        connection.close()

