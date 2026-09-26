import boto3

from database import get_connection

from io import BytesIO
from reportlab.pdfgen import canvas


# =========================================================
# AWS CONFIGURATION
# =========================================================

s3 = boto3.client(
    "s3",
    region_name="ap-south-1"
)

S3_BUCKET = "yaman-motors-frontend"


# =========================================================
# VENDOR PAYMENTS
# =========================================================

def get_vendor_payments():

    conn = get_connection()

    try:
        cursor = conn.cursor()

        cursor.execute("""
            SELECT
                vp.vendorPaymentId,
                vp.vendorId,
                v.vendorName,
                vp.vendorInvoiceId,
                vi.invoiceNumber,
                vp.paymentDate,
                vp.amount,
                vp.paymentMethod,
                vp.transactionRef,
                vp.status,
                vp.notes
            FROM VendorPayments vp
            LEFT JOIN Vendors v
                ON vp.vendorId = v.vendorId
            LEFT JOIN VendorInvoices vi
                ON vp.vendorInvoiceId = vi.vendorInvoiceId
            ORDER BY vp.paymentDate DESC
        """)

        columns = [column[0] for column in cursor.description]

        rows = cursor.fetchall()

        return [
            dict(zip(columns, row))
            for row in rows
        ]

    finally:
        conn.close()


def create_vendor_payment(data):

    conn = get_connection()

    try:
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO VendorPayments (
                vendorPaymentId,
                vendorId,
                vendorInvoiceId,
                paymentDate,
                amount,
                paymentMethod,
                transactionRef,
                status,
                notes
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            data["vendorPaymentId"],
            data["vendorId"],
            data.get("vendorInvoiceId"),
            data["paymentDate"],
            data["amount"],
            data.get("paymentMethod"),
            data.get("transactionRef"),
            data.get("status", "PAID"),
            data.get("notes")
        ))

        conn.commit()

        return {
            "success": True,
            "message": "Vendor payment created successfully"
        }

    finally:
        conn.close()


# =========================================================
# CUSTOMER PAYMENTS
# =========================================================

def get_customer_payments():

    conn = get_connection()

    try:
        cursor = conn.cursor()

        cursor.execute("""
            SELECT
                customerPaymentId,
                customerId,
                customerInvoiceId,
                paymentDate,
                amount,
                paymentMethod,
                transactionRef,
                status,
                notes
            FROM CustomerPayments
            ORDER BY paymentDate DESC
        """)

        columns = [column[0] for column in cursor.description]

        rows = cursor.fetchall()

        return [
            dict(zip(columns, row))
            for row in rows
        ]

    finally:
        conn.close()


def create_customer_payment(data):

    conn = get_connection()

    try:
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO CustomerPayments (
                customerPaymentId,
                customerId,
                customerInvoiceId,
                paymentDate,
                amount,
                paymentMethod,
                transactionRef,
                status,
                notes
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            data["customerPaymentId"],
            data["customerId"],
            data.get("customerInvoiceId"),
            data["paymentDate"],
            data["amount"],
            data.get("paymentMethod"),
            data.get("transactionRef"),
            data.get("status", "PAID"),
            data.get("notes")
        ))

        conn.commit()

        return {
            "success": True,
            "message": "Customer payment created successfully"
        }

    finally:
        conn.close()


# =========================================================
# VENDOR PAYMENT ADVICE PDF
# =========================================================

def generate_vendor_payment_advice_pdf(
    advice_id,
    vendor_name,
    vendor_invoice_number,
    amount_paid,
    remaining_amount
):

    buffer = BytesIO()

    pdf = canvas.Canvas(buffer)

    pdf.setFont("Helvetica-Bold", 18)

    pdf.drawString(
        180,
        800,
        "YAMAN MOTORS"
    )

    pdf.setFont("Helvetica-Bold", 14)

    pdf.drawString(
        170,
        770,
        "Vendor Payment Advice"
    )

    pdf.setFont("Helvetica", 11)

    y = 720

    pdf.drawString(
        80,
        y,
        f"Advice No: {advice_id}"
    )

    y -= 30

    pdf.drawString(
        80,
        y,
        f"Vendor: {vendor_name}"
    )

    y -= 30

    pdf.drawString(
        80,
        y,
        f"Invoice No: {vendor_invoice_number}"
    )

    y -= 50

    pdf.drawString(
        80,
        y,
        f"Amount Paid: Rs. {amount_paid:,.2f}"
    )

    y -= 30

    pdf.drawString(
        80,
        y,
        f"Remaining Amount: Rs. {remaining_amount:,.2f}"
    )

    y -= 60

    pdf.drawString(
        80,
        y,
        "Thank you."
    )

    pdf.save()

    buffer.seek(0)

    return buffer


# =========================================================
# CREATE VENDOR PAYMENT ADVICE
# =========================================================

def create_vendor_payment_advice(
    advice_id,
    vendor_payment_id,
    vendor_id,
    vendor_invoice_id,
    pdf_key=None
):

    conn = get_connection()

    try:

        cursor = conn.cursor()

        # -------------------------------------------------
        # GET PAYMENT
        # -------------------------------------------------

        cursor.execute("""
            SELECT
                amount
            FROM VendorPayments
            WHERE vendorPaymentId = ?
        """, (
            vendor_payment_id,
        ))

        payment = cursor.fetchone()

        if not payment:

            return {
                "success": False,
                "message": "Vendor payment not found"
            }

        amount_paid = float(
            payment[0] or 0
        )

        # -------------------------------------------------
        # GET INVOICE
        # -------------------------------------------------

        cursor.execute("""
            SELECT
                invoiceNumber,
                grandTotal
            FROM VendorInvoices
            WHERE vendorInvoiceId = ?
        """, (
            vendor_invoice_id,
        ))

        invoice = cursor.fetchone()

        if not invoice:

            return {
                "success": False,
                "message": "Vendor invoice not found"
            }

        invoice_number = invoice[0]

        invoice_total = float(
            invoice[1] or 0
        )

        # -------------------------------------------------
        # PREVIOUS PAYMENTS
        # -------------------------------------------------

        cursor.execute("""
            SELECT
                COALESCE(SUM(amount), 0)
            FROM VendorPayments
            WHERE vendorInvoiceId = ?
              AND status = 'PAID'
        """, (
            vendor_invoice_id,
        ))

        previous_paid = float(
            cursor.fetchone()[0] or 0
        )

        remaining_amount = max(
            invoice_total - previous_paid,
            0
        )

        # -------------------------------------------------
        # GET VENDOR
        # -------------------------------------------------

        cursor.execute("""
            SELECT
                vendorName
            FROM Vendors
            WHERE vendorId = ?
        """, (
            vendor_id,
        ))

        vendor = cursor.fetchone()

        if not vendor:

            return {
                "success": False,
                "message": "Vendor not found"
            }

        vendor_name = vendor[0]

        # -------------------------------------------------
        # GENERATE PDF
        # -------------------------------------------------

        pdf_buffer = generate_vendor_payment_advice_pdf(
            advice_id=advice_id,
            vendor_name=vendor_name,
            vendor_invoice_number=invoice_number,
            amount_paid=amount_paid,
            remaining_amount=remaining_amount
        )

        pdf_bytes = pdf_buffer.getvalue()

        # -------------------------------------------------
        # S3 UPLOAD
        # -------------------------------------------------

        if not pdf_key:

            pdf_key = (
                f"receipts/{advice_id}.pdf"
            )

        s3.upload_fileobj(
            BytesIO(pdf_bytes),
            S3_BUCKET,
            pdf_key,
            ExtraArgs={
                "ContentType": "application/pdf"
            }
        )

        # -------------------------------------------------
        # SAVE ADVICE
        # -------------------------------------------------

        cursor.execute("""
            INSERT INTO VendorPaymentAdvices (
                adviceId,
                vendorPaymentId,
                vendorId,
                vendorInvoiceId,
                amountPaid,
                remainingAmount,
                pdfKey
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            advice_id,
            vendor_payment_id,
            vendor_id,
            vendor_invoice_id,
            amount_paid,
            remaining_amount,
            pdf_key
        ))

        conn.commit()

        return {
            "success": True,
            "message": "Vendor payment advice created successfully",
            "adviceId": advice_id,
            "amountPaid": amount_paid,
            "remainingAmount": remaining_amount,
            "pdfKey": pdf_key
        }

    except Exception:

        conn.rollback()

        raise

    finally:

        conn.close()


# =========================================================
# CUSTOMER RECEIPT PDF
# =========================================================

def generate_receipt_pdf(
    receipt_id,
    customer_name,
    customer_email,
    invoice_number,
    amount_received,
    remaining_amount
):

    buffer = BytesIO()

    pdf = canvas.Canvas(buffer)

    pdf.setFont(
        "Helvetica-Bold",
        18
    )

    pdf.drawString(
        180,
        800,
        "YAMAN MOTORS"
    )

    pdf.setFont(
        "Helvetica-Bold",
        14
    )

    pdf.drawString(
        190,
        770,
        "Payment Receipt"
    )

    pdf.setFont(
        "Helvetica",
        11
    )

    y = 720

    pdf.drawString(
        80,
        y,
        f"Receipt No: {receipt_id}"
    )

    y -= 30

    pdf.drawString(
        80,
        y,
        f"Customer: {customer_name}"
    )

    y -= 30

    pdf.drawString(
        80,
        y,
        f"Email: {customer_email}"
    )

    y -= 30

    pdf.drawString(
        80,
        y,
        f"Invoice No: {invoice_number}"
    )

    y -= 50

    pdf.drawString(
        80,
        y,
        f"Amount Received: Rs. {amount_received:,.2f}"
    )

    y -= 30

    pdf.drawString(
        80,
        y,
        f"Remaining Amount: Rs. {remaining_amount:,.2f}"
    )

    y -= 60

    pdf.drawString(
        80,
        y,
        "Thank you for your payment."
    )

    pdf.save()

    buffer.seek(0)

    return buffer


# =========================================================
# CREATE CUSTOMER RECEIPT
# =========================================================

def create_customer_receipt(
    receipt_id,
    customer_payment_id,
    customer_id,
    customer_invoice_id,
    pdf_key=None
):

    conn = get_connection()

    try:

        cursor = conn.cursor()

        # -------------------------------------------------
        # GET CUSTOMER PAYMENT
        # -------------------------------------------------

        cursor.execute("""
            SELECT
                amount
            FROM CustomerPayments
            WHERE customerPaymentId = ?
        """, (
            customer_payment_id,
        ))

        payment = cursor.fetchone()

        if not payment:

            return {
                "success": False,
                "message": "Customer payment not found"
            }

        amount_received = float(
            payment[0] or 0
        )

        # -------------------------------------------------
        # GET CUSTOMER
        # -------------------------------------------------

        cursor.execute("""
            SELECT
                customerName,
                email
            FROM Customers
            WHERE customerId = ?
        """, (
            customer_id,
        ))

        customer = cursor.fetchone()

        if not customer:

            return {
                "success": False,
                "message": "Customer not found"
            }

        customer_name = customer[0]

        customer_email = customer[1]

        # -------------------------------------------------
        # GET CUSTOMER INVOICE
        # -------------------------------------------------

        cursor.execute("""
            SELECT
                invoiceNumber,
                grandTotal
            FROM CustomerInvoices
            WHERE customerInvoiceId = ?
        """, (
            customer_invoice_id,
        ))

        invoice = cursor.fetchone()

        if not invoice:

            return {
                "success": False,
                "message": "Customer invoice not found"
            }

        invoice_number = invoice[0]

        invoice_total = float(
            invoice[1] or 0
        )

        # -------------------------------------------------
        # PREVIOUS RECEIPTS
        # -------------------------------------------------

        cursor.execute("""
            SELECT
                COALESCE(SUM(amountReceived), 0)
            FROM CustomerReceipts
            WHERE customerInvoiceId = ?
        """, (
            customer_invoice_id,
        ))

        previous_received = float(
            cursor.fetchone()[0] or 0
        )

        remaining_amount = max(
            invoice_total - previous_received,
            0
        )

        # -------------------------------------------------
        # GENERATE PDF
        # -------------------------------------------------

        pdf_buffer = generate_receipt_pdf(
            receipt_id=receipt_id,
            customer_name=customer_name,
            customer_email=customer_email,
            invoice_number=invoice_number,
            amount_received=amount_received,
            remaining_amount=remaining_amount
        )

        pdf_bytes = pdf_buffer.getvalue()

        # -------------------------------------------------
        # S3 UPLOAD
        #
        # Lambda is triggered automatically after this.
        # Lambda handles SES email.
        # -------------------------------------------------

        if not pdf_key:

            pdf_key = (
                f"receipts/{receipt_id}.pdf"
            )

        s3.upload_fileobj(
            BytesIO(pdf_bytes),
            S3_BUCKET,
            pdf_key,
            ExtraArgs={
                "ContentType": "application/pdf"
            }
        )

        # -------------------------------------------------
        # SAVE CUSTOMER RECEIPT
        # -------------------------------------------------

        cursor.execute("""
            INSERT INTO CustomerReceipts (
                receiptId,
                customerPaymentId,
                customerId,
                customerInvoiceId,
                amountReceived,
                remainingAmount,
                pdfKey
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            receipt_id,
            customer_payment_id,
            customer_id,
            customer_invoice_id,
            amount_received,
            remaining_amount,
            pdf_key
        ))

        conn.commit()

        return {
            "success": True,
            "message": "Customer receipt created successfully",
            "receiptId": receipt_id,
            "customerPaymentId": customer_payment_id,
            "customerEmail": customer_email,
            "amountReceived": amount_received,
            "remainingAmount": remaining_amount,
            "pdfKey": pdf_key
        }

    except Exception:

        conn.rollback()

        raise

    finally:

        conn.close()
