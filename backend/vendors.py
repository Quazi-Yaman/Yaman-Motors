from database import get_connection


def get_all_vendors():
    connection = get_connection()

    try:
        cursor = connection.cursor()

        cursor.execute("""
            SELECT
                vendorId,
                vendorName,
                address,
                email,
                phone,
                gstin,
                currency,
                status,
                createdAt
            FROM Vendors
            ORDER BY vendorName
        """)

        columns = [column[0] for column in cursor.description]
        rows = cursor.fetchall()

        return [
            dict(zip(columns, row))
            for row in rows
        ]

    finally:
        connection.close()


def get_vendor(vendor_id):
    connection = get_connection()

    try:
        cursor = connection.cursor()

        cursor.execute("""
            SELECT
                vendorId,
                vendorName,
                address,
                email,
                phone,
                gstin,
                currency,
                status,
                createdAt
            FROM Vendors
            WHERE vendorId = ?
        """, (vendor_id,))

        row = cursor.fetchone()

        if not row:
            return None

        columns = [column[0] for column in cursor.description]

        return dict(zip(columns, row))

    finally:
        connection.close()


def add_vendor(
    vendor_id,
    vendor_name,
    address=None,
    email=None,
    phone=None,
    gstin=None,
    currency="INR"
):
    connection = get_connection()

    try:
        cursor = connection.cursor()

        cursor.execute("""
            INSERT INTO Vendors (
                vendorId,
                vendorName,
                address,
                email,
                phone,
                gstin,
                currency
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            vendor_id,
            vendor_name,
            address,
            email,
            phone,
            gstin,
            currency
        ))

        connection.commit()

        return {
            "success": True,
            "vendorId": vendor_id,
            "message": "Vendor added successfully"
        }

    except Exception:
        connection.rollback()
        raise

    finally:
        connection.close()


def update_vendor(
    vendor_id,
    vendor_name,
    address=None,
    email=None,
    phone=None,
    gstin=None,
    currency="INR"
):
    connection = get_connection()

    try:
        cursor = connection.cursor()

        cursor.execute("""
            UPDATE Vendors
            SET
                vendorName = ?,
                address = ?,
                email = ?,
                phone = ?,
                gstin = ?,
                currency = ?
            WHERE vendorId = ?
        """, (
            vendor_name,
            address,
            email,
            phone,
            gstin,
            currency,
            vendor_id
        ))

        if cursor.rowcount == 0:
            return {
                "success": False,
                "message": "Vendor not found"
            }

        connection.commit()

        return {
            "success": True,
            "vendorId": vendor_id,
            "message": "Vendor updated successfully"
        }

    except Exception:
        connection.rollback()
        raise

    finally:
        connection.close()


def deactivate_vendor(vendor_id):
    connection = get_connection()

    try:
        cursor = connection.cursor()

        cursor.execute("""
            UPDATE Vendors
            SET status = 'INACTIVE'
            WHERE vendorId = ?
        """, (vendor_id,))

        if cursor.rowcount == 0:
            return {
                "success": False,
                "message": "Vendor not found"
            }

        connection.commit()

        return {
            "success": True,
            "vendorId": vendor_id,
            "message": "Vendor deactivated successfully"
        }

    except Exception:
        connection.rollback()
        raise

    finally:
        connection.close()
