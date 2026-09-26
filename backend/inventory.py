from database import get_connection


def add_inventory_transaction(
    transaction_id,
    product_id,
    transaction_type,
    quantity,
    reference_id=None,
    transaction_date=None,
    notes=None
):
    if quantity <= 0:
        raise ValueError("Quantity must be greater than 0.")

    transaction_type = transaction_type.upper()

    if transaction_type not in ["IN", "OUT", "ADJUSTMENT"]:
        raise ValueError("Invalid transaction type.")

    connection = get_connection()

    try:
        cursor = connection.cursor()

        # Check product exists
        cursor.execute(
            """
            SELECT productId
            FROM Products
            WHERE productId = ?
            """,
            (product_id,)
        )

        if not cursor.fetchone():
            raise ValueError(f"Product {product_id} does not exist.")

        # For OUT, make sure enough stock exists
        if transaction_type == "OUT":
            current_stock = get_product_stock(product_id)

            if quantity > current_stock:
                raise ValueError(
                    f"Insufficient stock. Available: {current_stock}"
                )

        cursor.execute(
            """
            INSERT INTO InventoryTransactions
            (
                transactionId,
                productId,
                transactionType,
                referenceId,
                quantity,
                transactionDate,
                notes
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                transaction_id,
                product_id,
                transaction_type,
                reference_id,
                quantity,
                transaction_date,
                notes
            )
        )

        connection.commit()

        return {
            "success": True,
            "transactionId": transaction_id,
            "productId": product_id,
            "transactionType": transaction_type,
            "quantity": float(quantity),
            "message": "Inventory transaction created successfully"
        }

    finally:
        connection.close()


def get_product_stock(product_id):
    connection = get_connection()

    try:
        cursor = connection.cursor()

        cursor.execute(
            """
            SELECT
                COALESCE(
                    SUM(
                        CASE
                            WHEN transactionType = 'IN'
                                THEN quantity
                            WHEN transactionType = 'OUT'
                                THEN -quantity
                            WHEN transactionType = 'ADJUSTMENT'
                                THEN quantity
                            ELSE 0
                        END
                    ),
                    0
                )
            FROM InventoryTransactions
            WHERE productId = ?
            """,
            (product_id,)
        )

        stock = cursor.fetchone()[0]

        return float(stock or 0)

    finally:
        connection.close()


def get_all_inventory_transactions():
    connection = get_connection()

    try:
        cursor = connection.cursor()

        cursor.execute(
            """
            SELECT
                transactionId,
                productId,
                transactionType,
                referenceId,
                quantity,
                transactionDate,
                notes
            FROM InventoryTransactions
            ORDER BY transactionDate DESC
            """
        )

        columns = [column[0] for column in cursor.description]

        return [
            dict(zip(columns, row))
            for row in cursor.fetchall()
        ]

    finally:
        connection.close()


def get_inventory_transaction(transaction_id):
    connection = get_connection()

    try:
        cursor = connection.cursor()

        cursor.execute(
            """
            SELECT
                transactionId,
                productId,
                transactionType,
                referenceId,
                quantity,
                transactionDate,
                notes
            FROM InventoryTransactions
            WHERE transactionId = ?
            """,
            (transaction_id,)
        )

        row = cursor.fetchone()

        if not row:
            return None

        columns = [column[0] for column in cursor.description]

        return dict(zip(columns, row))

    finally:
        connection.close()


def get_all_stock():
    connection = get_connection()

    try:
        cursor = connection.cursor()

        cursor.execute(
            """
            SELECT
                p.productId,
                p.productName,
                p.unit,
                COALESCE(
                    SUM(
                        CASE
                            WHEN i.transactionType = 'IN'
                                THEN i.quantity
                            WHEN i.transactionType = 'OUT'
                                THEN -i.quantity
                            WHEN i.transactionType = 'ADJUSTMENT'
                                THEN i.quantity
                            ELSE 0
                        END
                    ),
                    0
                ) AS currentStock
            FROM Products p
            LEFT JOIN InventoryTransactions i
                ON p.productId = i.productId
            GROUP BY
                p.productId,
                p.productName,
                p.unit
            ORDER BY p.productId
            """
        )

        columns = [column[0] for column in cursor.description]

        return [
            dict(zip(columns, row))
            for row in cursor.fetchall()
        ]

    finally:
        connection.close()