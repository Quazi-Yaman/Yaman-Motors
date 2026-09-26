# YAMAN MOTORS — Factory ERP System

### SYMBIOSIS AWS CAPSTONE PROJECT — PROJECT 3

A multi-tier Factory Enterprise Resource Planning (ERP) application built using **Python Flask, JavaScript, SQL Server on Amazon RDS, Amazon S3, AWS Lambda, Amazon SES, and Gemini AI**.

The system manages factory operations including vendors, customers, products, purchases, sales, invoices, payments, inventory, reports, and an AI-powered business assistant.

---

## 📌 Project Overview

**YAMAN MOTORS** is a factory ERP system designed to centralize and manage day-to-day business operations.

The application follows a **multi-tier architecture**:

```text
User Browser
     │
     ▼
Presentation Tier
HTML + CSS + JavaScript
     │
     ▼
Application Tier
Python Flask REST API
     │
     ▼
Database Tier
Amazon RDS
SQL Server
```

Additional AWS services are integrated for document storage, automated processing, email delivery, and AI-assisted business queries.

---

## 🎯 Project Objective

The objective of this project is to develop a practical multi-tier business application using AWS infrastructure.

The system demonstrates:

* Multi-tier application architecture
* REST API development
* Cloud database integration
* Cloud object storage
* Serverless automation
* Automated email delivery
* PDF receipt generation
* AI-assisted business queries
* Modular ERP functionality

---

# 🏗️ Architecture

```text
                         ┌──────────────────────┐
                         │      User Browser    │
                         │   HTML/CSS/JavaScript│
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │     Flask Backend    │
                         │    Python REST API   │
                         └──────────┬───────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
                    ▼                               ▼
          ┌──────────────────┐             ┌──────────────────┐
          │   Amazon RDS     │             │    Amazon S3     │
          │   SQL Server     │             │ Receipt Storage  │
          └──────────────────┘             └────────┬─────────┘
                                                     │
                                                     ▼
                                            ┌──────────────────┐
                                            │    AWS Lambda    │
                                            │ Receipt Processor│
                                            └────────┬─────────┘
                                                     │
                                                     ▼
                                            ┌──────────────────┐
                                            │    Amazon SES    │
                                            │  Email Delivery  │
                                            └──────────────────┘


                         AI BUSINESS ASSISTANT
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │     Flask AI API     │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │    Business Tools    │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │    RDS SQL Server    │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │      Gemini AI       │
                         └──────────────────────┘
```

---

# ☁️ AWS Services Used

| AWS Service                 | Purpose                                   |
| --------------------------- | ----------------------------------------- |
| **Amazon RDS – SQL Server** | Main relational database                  |
| **Amazon S3**               | Stores generated receipt PDFs             |
| **AWS Lambda**              | Processes receipt files automatically     |
| **Amazon SES**              | Sends payment receipt emails              |
| **IAM**                     | Controls permissions between AWS services |

---

# 🧩 Application Architecture

## 1. Presentation Tier

The frontend provides the user interface for the ERP system.

Technologies:

* HTML
* CSS
* JavaScript

Main interface modules include:

* Dashboard
* Vendors
* Customers
* Products
* Purchases
* Sales
* Invoices
* Payments
* Inventory
* Reports
* AI Assistant

---

## 2. Application Tier

The application layer is implemented using **Python Flask**.

The backend exposes REST APIs and contains the business functionality required by the ERP.

Main backend modules:

```text
backend/
├── app.py
├── database.py
├── vendors.py
├── customers.py
├── products.py
├── purchases.py
├── sales.py
├── invoices.py
├── payments.py
├── inventory.py
└── reports.py
```

---

## 3. Database Tier

The application uses **Microsoft SQL Server hosted on Amazon RDS**.

The database stores operational ERP data including:

* Customers
* Vendors
* Products
* Purchases
* Sales
* Invoices
* Payments
* Inventory

Database schema and SQL scripts are included in the repository.

---

# 📦 ERP Modules

## Vendors

Manage factory suppliers and vendor information.

## Customers

Maintain customer records and customer-related transactions.

## Products

Manage products, product information, pricing, and inventory-related data.

## Purchases

Manage the purchase workflow:

```text
Vendor
   ↓
Purchase Order
   ↓
Vendor Invoice
   ↓
Inventory Increase
   ↓
Vendor Payment
```

## Sales

Manage the sales workflow:

```text
Customer
   ↓
Sales Order
   ↓
Customer Invoice
   ↓
Inventory Decrease
   ↓
Customer Payment
```

## Invoices

Generate and manage customer and vendor invoice information.

## Payments

Record customer and vendor payments.

## Inventory

Track stock movements resulting from purchases and sales.

## Reports

Provide business reports based on ERP data.

---

# 🧾 Automated Payment Receipt Workflow

When a customer payment is processed, the system can generate a PDF receipt and store it in Amazon S3.

```text
Customer Payment
       │
       ▼
   Flask Backend
       │
       ▼
   Generate PDF
       │
       ▼
   Amazon S3
       │
       ▼
   S3 Event Trigger
       │
       ▼
   AWS Lambda
       │
       ▼
   Amazon SES
       │
       ▼
Customer Email
with PDF Receipt
```

This demonstrates the integration of:

**Flask → S3 → Lambda → SES**

---

# 🤖 AI Business Assistant

The ERP includes an AI assistant for business-related questions.

The general workflow is:

```text
User Question
      ↓
Flask AI API
      ↓
Business Tools
      ↓
RDS SQL Server
      ↓
Business Data
      ↓
Gemini AI
      ↓
AI Generated Answer
```

The AI assistant can use business data retrieved from the ERP database to answer operational questions.

---

# 📁 Project Structure

```text
YAMAN-MOTORS/
│
├── ai/
│
├── backend/
│   ├── app.py
│   ├── database.py
│   ├── vendors.py
│   ├── customers.py
│   ├── products.py
│   ├── purchases.py
│   ├── sales.py
│   ├── invoices.py
│   ├── payments.py
│   ├── inventory.py
│   └── reports.py
│
├── frontend/
│
├── lambda/
│
├── documentations/
│
├── extractor-package/
│
├── pypdf-layer/
│
├── reportlab-layer/
│
├── start.py
│
├── tables.sql
│
├── SQLQuery2.sql
│
└── README.md
```

---

# 🛠️ Technologies

### Frontend

* HTML5
* CSS3
* JavaScript

### Backend

* Python
* Flask
* REST APIs

### Database

* Microsoft SQL Server
* Amazon RDS

### Cloud

* Amazon S3
* AWS Lambda
* Amazon SES
* AWS IAM

### AI

* Gemini AI

### PDF

* Python PDF generation libraries
* AWS S3 storage

---

# 🚀 Running the Application

The project includes a Python launcher:

```text
start.py
```

The launcher is used to start the application components locally.

The frontend and Flask backend communicate through the local application environment.

The backend connects to the SQL Server database hosted on Amazon RDS.

> Before running the application, ensure that the required AWS resources and database configuration are available.

---

# 🔐 Security

Sensitive credentials are not intended to be stored directly in source code.

The repository uses `.gitignore` to exclude sensitive/local files such as:

```text
.env
*.pem
*.key
.venv/
venv/
.aws/
__pycache__/
```

AWS IAM permissions should follow the principle of least privilege.

---

# 📸 Screenshots

Screenshots demonstrating the working application and AWS infrastructure will be added to this section.

Recommended evidence:

1. ERP Dashboard
2. Vendor Management
3. Customer Management
4. Product Management
5. Purchase Module
6. Sales Module
7. Invoice Module
8. Payment Module
9. Inventory
10. Reports
11. AI Assistant
12. Amazon RDS
13. Amazon S3 receipt storage
14. AWS Lambda
15. Amazon SES
16. Generated PDF receipt

---

# 📐 Architecture Diagram

The architecture diagram demonstrates the relationship between:

* User
* Frontend
* Flask backend
* Amazon RDS
* Amazon S3
* AWS Lambda
* Amazon SES
* Gemini AI

The final architecture diagram will be included in the project documentation.

---

# 🎓 Symbiosis AWS Capstone Mapping

### Project Category

**Multi-Tier Web Application Deployment**

### Tier Mapping

| Tier              | Implementation           |
| ----------------- | ------------------------ |
| Presentation Tier | HTML, CSS, JavaScript    |
| Application Tier  | Python Flask REST API    |
| Database Tier     | SQL Server on Amazon RDS |

### Additional Cloud Integration

```text
Amazon RDS
     +
Amazon S3
     +
AWS Lambda
     +
Amazon SES
     +
IAM
     +
Gemini AI
```

This project demonstrates a complete multi-tier application with additional cloud services supporting document storage, serverless processing, email delivery, and AI-assisted operations.

---

# 📋 Project Deliverables

The repository is being prepared to include the required project evidence:

* ✅ Source Code
* ✅ README.md
* ⬜ Architecture Diagram
* ⬜ Application Screenshots
* ⬜ AWS Service Evidence
* ⬜ Final Project Documentation

---

# 👨‍💻 Project

**YAMAN MOTORS — Factory ERP System**

**AWS Capstone:** Symbiosis AWS Project 3

**Developer:** Yamania Quazi

**GitHub:** `Quazi-Yaman/Yaman-Motors`

---

# ⚠️ Cost & AWS Resource Note

Amazon RDS is a running AWS resource and can incur charges while the database instance is running.

For development/testing, stop the RDS instance when work is finished and start it again when development resumes.

Other AWS services may also have usage-based charges depending on configuration and usage.

