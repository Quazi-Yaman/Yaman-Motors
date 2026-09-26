import sys
import os

sys.path.insert(
    0,
    os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
)

import purchases
import sales
import invoices
import payments
import inventory

from flask import Flask, jsonify, request
from flask_cors import CORS
from ai.gemini import ask_gemini
from ai.ai_prompts import SYSTEM_PROMPT
from ai.ai_tools import (
    who_do_we_owe,
    revenue_this_month,
    cheapest_vendor,
    customer_transactions
)

from vendors import (
    get_all_vendors,
    get_vendor,
    add_vendor,
    update_vendor,
    deactivate_vendor
)

from customers import (
    get_all_customers,
    get_customer,
    add_customer,
    update_customer,
    deactivate_customer
)

from products import (
    get_all_products,
    get_product,
    add_product,
    update_product,
    deactivate_product
)

from reports import get_business_summary


app = Flask(__name__)
CORS(app)


# =========================================================
# HEALTH CHECK
# =========================================================

@app.get("/api/health")
def health():
    return jsonify({
        "status": "ok",
        "message": "Yaman Motors backend is running"
    })


# =========================================================
# VENDORS
# =========================================================

@app.get("/api/vendors")
def vendors():
    return jsonify(get_all_vendors())


@app.get("/api/vendors/<vendor_id>")
def vendor(vendor_id):
    result = get_vendor(vendor_id)

    if result is None:
        return jsonify({
            "error": "Vendor not found"
        }), 404

    return jsonify(result)


@app.post("/api/vendors")
def create_vendor():
    data = request.get_json() or {}

    result = add_vendor(
        data["vendorId"],
        data["vendorName"],
        data.get("address"),
        data.get("email"),
        data.get("phone"),
        data.get("gstin"),
        data.get("currency", "INR")
    )

    return jsonify({
        "message": "Vendor created",
        "result": result
    }), 201


@app.put("/api/vendors/<vendor_id>")
def edit_vendor(vendor_id):
    data = request.get_json() or {}

    result = update_vendor(
        vendor_id,
        data["vendorName"],
        data.get("address"),
        data.get("email"),
        data.get("phone"),
        data.get("gstin"),
        data.get("currency", "INR")
    )

    return jsonify({
        "message": "Vendor updated",
        "result": result
    })


@app.delete("/api/vendors/<vendor_id>")
def delete_vendor(vendor_id):
    result = deactivate_vendor(vendor_id)

    return jsonify({
        "message": "Vendor deactivated",
        "result": result
    })


# =========================================================
# CUSTOMERS
# =========================================================

@app.get("/api/customers")
def customers():
    return jsonify(get_all_customers())


@app.get("/api/customers/<customer_id>")
def customer(customer_id):
    result = get_customer(customer_id)

    if result is None:
        return jsonify({
            "error": "Customer not found"
        }), 404

    return jsonify(result)


@app.post("/api/customers")
def create_customer():
    data = request.get_json() or {}

    result = add_customer(
        data["customerId"],
        data["customerName"],
        data.get("address"),
        data.get("email"),
        data.get("phone"),
        data.get("gstin")
    )

    return jsonify({
        "message": "Customer created",
        "result": result
    }), 201


@app.put("/api/customers/<customer_id>")
def edit_customer(customer_id):
    data = request.get_json() or {}

    result = update_customer(
        customer_id,
        data["customerName"],
        data.get("address"),
        data.get("email"),
        data.get("phone"),
        data.get("gstin")
    )

    return jsonify({
        "message": "Customer updated",
        "result": result
    })


@app.delete("/api/customers/<customer_id>")
def delete_customer(customer_id):
    result = deactivate_customer(customer_id)

    return jsonify({
        "message": "Customer deactivated",
        "result": result
    })


# =========================================================
# PRODUCTS
# =========================================================

@app.get("/api/products")
def products():
    return jsonify(get_all_products())


@app.get("/api/products/<product_id>")
def product(product_id):
    result = get_product(product_id)

    if result is None:
        return jsonify({
            "error": "Product not found"
        }), 404

    return jsonify(result)


@app.post("/api/products")
def create_product():
    data = request.get_json() or {}

    result = add_product(
        data["productId"],
        data["productName"],
        data.get("category"),
        data.get("productType"),
        data.get("unit"),
        data.get("description"),
        data.get("sellingPrice"),
        data.get("taxRate", 0)
    )

    return jsonify({
        "message": "Product created",
        "result": result
    }), 201


@app.put("/api/products/<product_id>")
def edit_product(product_id):
    data = request.get_json() or {}

    result = update_product(
        product_id,
        data["productName"],
        data.get("category"),
        data.get("productType"),
        data.get("unit"),
        data.get("description"),
        data.get("sellingPrice"),
        data.get("taxRate", 0)
    )

    return jsonify({
        "message": "Product updated",
        "result": result
    })


@app.delete("/api/products/<product_id>")
def delete_product(product_id):
    result = deactivate_product(product_id)

    return jsonify({
        "message": "Product deactivated",
        "result": result
    })


# =========================================================
# REPORTS
# =========================================================

@app.get("/api/reports/summary")
def business_summary():
    return jsonify(get_business_summary())


# =========================================================
# PURCHASE ORDER APIs
# =========================================================

@app.get("/api/purchases")
def get_purchases():
    try:
        return jsonify(
            purchases.get_all_purchase_orders()
        )

    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 500


@app.get("/api/purchases/<po_id>")
def get_purchase(po_id):
    try:
        purchase = purchases.get_purchase_order(po_id)

        if not purchase:
            return jsonify({
                "error": "Purchase order not found"
            }), 404

        return jsonify(purchase)

    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 500


@app.post("/api/purchases")
def create_purchase():
    try:
        data = request.get_json() or {}

        required = [
            "poId",
            "vendorId",
            "orderDate"
        ]

        missing = [
            field
            for field in required
            if not data.get(field)
        ]

        if missing:
            return jsonify({
                "error": f"Missing fields: {', '.join(missing)}"
            }), 400

        result = purchases.create_purchase_order(
            po_id=data["poId"],
            vendor_id=data["vendorId"],
            po_date=data["orderDate"],
            expected_date=data.get("expectedDate"),
            status=data.get("status", "OPEN"),
            notes=data.get("notes")
        )

        if result.get("success") is False:
            return jsonify(result), 400

        return jsonify(result), 201

    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 500


@app.post("/api/purchases/<po_id>/items")
def add_purchase_item(po_id):
    try:
        data = request.get_json() or {}

        required = [
            "productId",
            "quantity",
            "unitPrice"
        ]

        missing = [
            field
            for field in required
            if data.get(field) is None
        ]

        if missing:
            return jsonify({
                "error": f"Missing fields: {', '.join(missing)}"
            }), 400

        result = purchases.add_purchase_order_item(
            po_id=po_id,
            product_id=data["productId"],
            quantity=data["quantity"],
            unit_price=data["unitPrice"],
            tax_rate=data.get("taxRate", 0)
        )

        if result.get("success") is False:
            return jsonify(result), 400

        return jsonify(result), 201

    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 500


@app.put("/api/purchases/<po_id>/status")
def update_purchase_status(po_id):
    try:
        data = request.get_json() or {}

        if not data.get("status"):
            return jsonify({
                "error": "Status is required"
            }), 400

        result = purchases.update_purchase_order_status(
            po_id,
            data["status"]
        )

        if result.get("success") is False:
            return jsonify(result), 404

        return jsonify(result)

    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 500


# =========================================================
# SALES ORDER APIs
# =========================================================

@app.get("/api/sales")
def get_sales():
    try:
        return jsonify(
            sales.get_all_sales_orders()
        )

    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 500


@app.get("/api/sales/<so_id>")
def get_sale(so_id):
    try:
        sale = sales.get_sales_order(so_id)

        if not sale:
            return jsonify({
                "error": "Sales order not found"
            }), 404

        return jsonify(sale)

    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 500


@app.post("/api/sales")
def create_sale():
    try:
        data = request.get_json() or {}

        required = [
            "soId",
            "customerId",
            "orderDate"
        ]

        missing = [
            field
            for field in required
            if not data.get(field)
        ]

        if missing:
            return jsonify({
                "error": f"Missing fields: {', '.join(missing)}"
            }), 400

        result = sales.create_sales_order(
            so_id=data["soId"],
            customer_id=data["customerId"],
            so_date=data["orderDate"],
            expected_date=data.get("expectedDate"),
            status=data.get("status", "OPEN"),
            notes=data.get("notes")
        )

        if result.get("success") is False:
            return jsonify(result), 400

        return jsonify(result), 201

    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 500


@app.post("/api/sales/<so_id>/items")
def add_sale_item(so_id):
    try:
        data = request.get_json() or {}

        required = [
            "productId",
            "quantity",
            "unitPrice"
        ]

        missing = [
            field
            for field in required
            if data.get(field) is None
        ]

        if missing:
            return jsonify({
                "error": f"Missing fields: {', '.join(missing)}"
            }), 400

        result = sales.add_sales_order_item(
            so_id=so_id,
            product_id=data["productId"],
            quantity=data["quantity"],
            unit_price=data["unitPrice"],
            tax_rate=data.get("taxRate", 0)
        )

        if result.get("success") is False:
            return jsonify(result), 400

        return jsonify(result), 201

    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 500


@app.put("/api/sales/<so_id>/status")
def update_sale_status(so_id):
    try:
        data = request.get_json() or {}

        if not data.get("status"):
            return jsonify({
                "error": "Status is required"
            }), 400

        result = sales.update_sales_order_status(
            so_id,
            data["status"]
        )

        if result.get("success") is False:
            return jsonify(result), 404

        return jsonify(result)

    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 500

# =========================================================
# VENDOR INVOICE APIs
# =========================================================

@app.route("/api/invoices/vendor", methods=["GET"])
def api_get_vendor_invoices():
    try:
        return jsonify(
            invoices.get_all_vendor_invoices()
        )

    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 500


@app.route("/api/invoices/vendor/<invoice_id>", methods=["GET"])
def api_get_vendor_invoice(invoice_id):
    try:
        result = invoices.get_vendor_invoice(invoice_id)

        if result is None:
            return jsonify({
                "error": "Vendor invoice not found"
            }), 404

        return jsonify(result)

    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 500


@app.route("/api/invoices/vendor", methods=["POST"])
def api_create_vendor_invoice():
    try:
        data = request.get_json() or {}

        required = [
            "vendorInvoiceId",
            "vendorId",
            "invoiceNumber",
            "invoiceDate"
        ]

        missing = [
            field
            for field in required
            if not data.get(field)
        ]

        if missing:
            return jsonify({
                "error": f"Missing fields: {', '.join(missing)}"
            }), 400

        result = invoices.create_vendor_invoice(
            invoice_id=data["vendorInvoiceId"],
            vendor_id=data["vendorId"],
            po_id=data.get("poId"),
            invoice_number=data["invoiceNumber"],
            invoice_date=data["invoiceDate"],
            due_date=data.get("dueDate"),
            status=data.get("status", "OPEN"),
            source_file=data.get("sourceFile")
        )

        if result.get("success") is False:
            return jsonify(result), 400

        return jsonify(result), 201

    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 500


@app.route("/api/payments/vendor/advice", methods=["GET"])
def api_get_vendor_payment_advices():
    try:
        result = payments.get_vendor_payment_advices()

        return jsonify(result)

    except Exception as error:
        return jsonify({
            "success": False,
            "message": str(error)
        }), 500



@app.route("/api/invoices/vendor/<invoice_id>/items", methods=["POST"])
def api_add_vendor_invoice_item(invoice_id):
    try:
        data = request.get_json() or {}

        required = [
            "productId",
            "quantity",
            "unitPrice"
        ]

        missing = [
            field
            for field in required
            if data.get(field) is None
        ]

        if missing:
            return jsonify({
                "error": f"Missing fields: {', '.join(missing)}"
            }), 400

        result = invoices.add_vendor_invoice_item(
            invoice_id=invoice_id,
            product_id=data["productId"],
            quantity=data["quantity"],
            unit_price=data["unitPrice"],
            tax_rate=data.get("taxRate", 0)
        )

        if result.get("success") is False:
            return jsonify(result), 400

        return jsonify(result), 201

    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 500


@app.route("/api/invoices/vendor/<invoice_id>/status", methods=["PUT"])
def api_update_vendor_invoice_status(invoice_id):
    try:
        data = request.get_json() or {}

        if not data.get("status"):
            return jsonify({
                "error": "Status is required"
            }), 400

        result = invoices.update_vendor_invoice_status(
            invoice_id,
            data["status"]
        )

        if result.get("success") is False:
            return jsonify(result), 404

        return jsonify(result)

    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 500


# =========================================================
# CUSTOMER INVOICE APIs
# =========================================================

@app.route("/api/invoices/customer", methods=["GET"])
def api_get_customer_invoices():
    try:
        return jsonify(
            invoices.get_all_customer_invoices()
        )

    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 500


@app.route("/api/invoices/customer/<invoice_id>", methods=["GET"])
def api_get_customer_invoice(invoice_id):
    try:
        result = invoices.get_customer_invoice(invoice_id)

        if result is None:
            return jsonify({
                "error": "Customer invoice not found"
            }), 404

        return jsonify(result)

    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 500


@app.route("/api/invoices/customer", methods=["POST"])
def api_create_customer_invoice():
    try:
        data = request.get_json() or {}

        required = [
            "customerInvoiceId",
            "customerId",
            "invoiceNumber",
            "invoiceDate"
        ]

        missing = [
            field
            for field in required
            if not data.get(field)
        ]

        if missing:
            return jsonify({
                "error": f"Missing fields: {', '.join(missing)}"
            }), 400

        result = invoices.create_customer_invoice(
            invoice_id=data["customerInvoiceId"],
            customer_id=data["customerId"],
            so_id=data.get("soId"),
            invoice_number=data["invoiceNumber"],
            invoice_date=data["invoiceDate"],
            due_date=data.get("dueDate"),
            status=data.get("status", "OPEN")
        )

        if result.get("success") is False:
            return jsonify(result), 400

        return jsonify(result), 201

    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 500


@app.route("/api/invoices/customer/<invoice_id>/items", methods=["POST"])
def api_add_customer_invoice_item(invoice_id):
    try:
        data = request.get_json() or {}

        required = [
            "productId",
            "quantity",
            "unitPrice"
        ]

        missing = [
            field
            for field in required
            if data.get(field) is None
        ]

        if missing:
            return jsonify({
                "error": f"Missing fields: {', '.join(missing)}"
            }), 400

        result = invoices.add_customer_invoice_item(
            invoice_id=invoice_id,
            product_id=data["productId"],
            quantity=data["quantity"],
            unit_price=data["unitPrice"],
            tax_rate=data.get("taxRate", 0)
        )

        if result.get("success") is False:
            return jsonify(result), 400

        return jsonify(result), 201

    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 500


@app.route("/api/invoices/customer/<invoice_id>/status", methods=["PUT"])
def api_update_customer_invoice_status(invoice_id):
    try:
        data = request.get_json() or {}

        if not data.get("status"):
            return jsonify({
                "error": "Status is required"
            }), 400

        result = invoices.update_customer_invoice_status(
            invoice_id,
            data["status"]
        )

        if result.get("success") is False:
            return jsonify(result), 404

        return jsonify(result)

    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 500



# ============================================================
# PAYMENT ROUTES
# ============================================================

@app.route("/api/payments/vendor", methods=["GET"])
def api_get_vendor_payments():
    try:
        return jsonify(payments.get_vendor_payments())
    except Exception as error:
        return jsonify({
            "success": False,
            "message": str(error)
        }), 500


@app.route("/api/payments/vendor/<payment_id>", methods=["GET"])
def api_get_vendor_payment(payment_id):
    try:
        result = payments.get_vendor_payment(payment_id)

        if not result:
            return jsonify({
                "success": False,
                "message": "Vendor payment not found"
            }), 404

        return jsonify(result)

    except Exception as error:
        return jsonify({
            "success": False,
            "message": str(error)
        }), 500


@app.route("/api/payments/vendor", methods=["POST"])
def api_create_vendor_payment():
    try:
        data = request.get_json()

        result = payments.create_vendor_payment(
            payment_id=data["vendorPaymentId"],
            vendor_id=data["vendorId"],
            vendor_invoice_id=data["vendorInvoiceId"],
            amount=data["amount"],
            payment_date=data.get("paymentDate"),
            payment_method=data.get("paymentMethod"),
            transaction_ref=data.get("transactionRef"),
            status=data.get("status", "COMPLETED"),
            notes=data.get("notes")
        )

        if not result.get("success"):
            return jsonify(result), 400

        return jsonify(result), 201

    except KeyError as error:
        return jsonify({
            "success": False,
            "message": f"Missing field: {error.args[0]}"
        }), 400

    except Exception as error:
        return jsonify({
            "success": False,
            "message": str(error)
        }), 500


@app.route("/api/payments/vendor/<payment_id>/status", methods=["PUT"])
def api_update_vendor_payment_status(payment_id):
    try:
        data = request.get_json()

        result = payments.update_vendor_payment_status(
            payment_id,
            data["status"]
        )

        if not result.get("success"):
            return jsonify(result), 404

        return jsonify(result)

    except Exception as error:
        return jsonify({
            "success": False,
            "message": str(error)
        }), 500


@app.route("/api/payments/customer", methods=["GET"])
def api_get_customer_payments():
    try:
        return jsonify(payments.get_all_customer_payments())
    except Exception as error:
        return jsonify({
            "success": False,
            "message": str(error)
        }), 500


@app.route("/api/payments/customer/<payment_id>", methods=["GET"])
def api_get_customer_payment(payment_id):
    try:
        result = payments.get_customer_payment(payment_id)

        if not result:
            return jsonify({
                "success": False,
                "message": "Customer payment not found"
            }), 404

        return jsonify(result)

    except Exception as error:
        return jsonify({
            "success": False,
            "message": str(error)
        }), 500


@app.route("/api/payments/customer", methods=["POST"])
def api_create_customer_payment():
    try:
        data = request.get_json()

        result = payments.create_customer_payment(
            payment_id=data["customerPaymentId"],
            customer_id=data["customerId"],
            customer_invoice_id=data["customerInvoiceId"],
            amount=data["amount"],
            payment_date=data.get("paymentDate"),
            payment_method=data.get("paymentMethod"),
            transaction_ref=data.get("transactionRef"),
            status=data.get("status", "COMPLETED"),
            notes=data.get("notes")
        )

        if not result.get("success"):
            return jsonify(result), 400

        return jsonify(result), 201

    except KeyError as error:
        return jsonify({
            "success": False,
            "message": f"Missing field: {error.args[0]}"
        }), 400

    except Exception as error:
        return jsonify({
            "success": False,
            "message": str(error)
        }), 500


@app.route("/api/payments/customer/<payment_id>/status", methods=["PUT"])
def api_update_customer_payment_status(payment_id):
    try:
        data = request.get_json()

        result = payments.update_customer_payment_status(
            payment_id,
            data["status"]
        )

        if not result.get("success"):
            return jsonify(result), 404

        return jsonify(result)

    except Exception as error:
        return jsonify({
            "success": False,
            "message": str(error)
        }), 500


# ============================================================
# PAYMENT ADVICE / CUSTOMER RECEIPT
# ============================================================

@app.route("/api/payments/vendor/advice", methods=["POST"])
def api_create_vendor_payment_advice():
    try:
        data = request.get_json()

        result = payments.create_vendor_payment_advice(
            advice_id=data["adviceId"],
            vendor_payment_id=data["vendorPaymentId"],
            vendor_id=data["vendorId"],
            vendor_invoice_id=data["vendorInvoiceId"],
            pdf_key=data.get("pdfKey")
        )

        if not result.get("success"):
            return jsonify(result), 400

        return jsonify(result), 201

    except KeyError as error:
        return jsonify({
            "success": False,
            "message": f"Missing field: {error.args[0]}"
        }), 400

    except Exception as error:
        return jsonify({
            "success": False,
            "message": str(error)
        }), 500


@app.route("/api/payments/customer/receipt", methods=["POST"])
def api_create_customer_receipt():
    try:
        data = request.get_json()

        result = payments.create_customer_receipt(
            receipt_id=data["receiptId"],
            customer_payment_id=data["customerPaymentId"],
            customer_id=data["customerId"],
            customer_invoice_id=data["customerInvoiceId"],
            pdf_key=data.get("pdfKey")
        )

        if not result.get("success"):
            return jsonify(result), 400

        return jsonify(result), 201

    except KeyError as error:
        return jsonify({
            "success": False,
            "message": f"Missing field: {error.args[0]}"
        }), 400

    except Exception as error:
        return jsonify({
            "success": False,
            "message": str(error)
        }), 500



@app.route("/api/inventory", methods=["GET"])
def get_inventory_transactions():
    try:
        return jsonify(inventory.get_all_inventory_transactions())
    except Exception as error:
        return jsonify({"success": False, "error": str(error)}), 500


@app.route("/api/inventory/<transaction_id>", methods=["GET"])
def get_inventory_transaction(transaction_id):
    try:
        result = inventory.get_inventory_transaction(transaction_id)

        if not result:
            return jsonify({
                "success": False,
                "error": "Inventory transaction not found"
            }), 404

        return jsonify(result)

    except Exception as error:
        return jsonify({"success": False, "error": str(error)}), 500


@app.route("/api/inventory", methods=["POST"])
def create_inventory_transaction():
    try:
        data = request.get_json()

        result = inventory.add_inventory_transaction(
            transaction_id=data["transactionId"],
            product_id=data["productId"],
            transaction_type=data["transactionType"],
            quantity=data["quantity"],
            reference_id=data.get("referenceId"),
            transaction_date=data.get("transactionDate"),
            notes=data.get("notes")
        )

        return jsonify(result), 201

    except Exception as error:
        return jsonify({
            "success": False,
            "error": str(error)
        }), 400


@app.route("/api/inventory/stock/<product_id>", methods=["GET"])
def get_product_stock(product_id):
    try:
        stock = inventory.get_product_stock(product_id)

        return jsonify({
            "success": True,
            "productId": product_id,
            "currentStock": stock
        })

    except Exception as error:
        return jsonify({
            "success": False,
            "error": str(error)
        }), 500


@app.route("/api/inventory/stock", methods=["GET"])
def get_all_stock():
    try:
        return jsonify(inventory.get_all_stock())
    except Exception as error:
        return jsonify({
            "success": False,
            "error": str(error)
        }), 500



# ============================================================
# AI ASSISTANT
# ============================================================

@app.route("/api/ai/chat", methods=["POST"])
def ai_chat():

    try:
        data = request.get_json() or {}
        question = (data.get("question") or "").strip()

        if not question:
            return jsonify({
                "success": False,
                "error": "Please enter a question."
            }), 400

        q = question.lower()
        business_data = {}

        # Vendor outstanding
        if (
            "owe" in q
            or "vendor outstanding" in q
            or "pay vendor" in q
            or "vendors do we owe" in q
        ):
            business_data = {
                "type": "vendor_outstanding",
                "data": who_do_we_owe()
            }

        # Revenue
        elif (
            "revenue" in q
            or "sales this month" in q
            or "sales this month" in q
        ):
            business_data = {
                "type": "monthly_revenue",
                "data": revenue_this_month()
            }

        # Cheapest vendor
        elif "cheapest" in q or "lowest price" in q:
            words = question.split()
            product = words[-1].strip("?.!,")
            
            business_data = {
                "type": "cheapest_vendor",
                "data": cheapest_vendor(product)
            }

        # Customer transactions
        elif "transaction" in q or "transactions" in q:
            business_data = {
                "type": "customer_transactions",
                "data": customer_transactions(question)
            }

        else:
            business_data = {
                "type": "general",
                "data": {
                    "message": (
                        "No specific business tool matched this question."
                    )
                }
            }

        prompt = f"""
{SYSTEM_PROMPT}

User question:
{question}

Verified backend business data:
{business_data}

Answer the user's question using the verified data above.
"""

        answer = ask_gemini(prompt)

        return jsonify({
            "success": True,
            "answer": answer,
            "data": business_data
        })

    except Exception as error:

        print("AI ERROR:", error)

        return jsonify({
            "success": False,
            "error": str(error)
        }), 500

# =========================================================
# START SERVER
# =========================================================

if __name__ == "__main__":
    print("========================================")
    print(" YAMAN MOTORS BACKEND")
    print(" http://localhost:5000")
    print("========================================")

    app.run(
        host="127.0.0.1",
        port=5000,
        debug=False
    )