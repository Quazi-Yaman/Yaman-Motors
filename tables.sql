CREATE DATABASE YamanMotorsDB;
GO

USE YamanMotorsDB;
GO

CREATE TABLE Users (
    userId INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(100) NOT NULL,
    email NVARCHAR(150) NOT NULL UNIQUE,
    status NVARCHAR(20) DEFAULT 'ACTIVE',
    createdAt DATETIME2 DEFAULT GETDATE()
);
GO

CREATE TABLE Vendors (
    vendorId VARCHAR(20) PRIMARY KEY,
    vendorName NVARCHAR(150) NOT NULL,
    address NVARCHAR(300),
    email NVARCHAR(150),
    phone VARCHAR(20),
    gstin VARCHAR(20),
    currency VARCHAR(10) DEFAULT 'INR',
    status NVARCHAR(20) DEFAULT 'ACTIVE',
    createdAt DATETIME2 DEFAULT GETDATE()
);
GO

CREATE TABLE Customers (
    customerId VARCHAR(20) PRIMARY KEY,
    customerName NVARCHAR(150) NOT NULL,
    address NVARCHAR(300),
    email NVARCHAR(150),
    phone VARCHAR(20),
    gstin VARCHAR(20),
    status NVARCHAR(20) DEFAULT 'ACTIVE',
    createdAt DATETIME2 DEFAULT GETDATE()
);
GO

CREATE TABLE Products (
    productId VARCHAR(20) PRIMARY KEY,
    productName NVARCHAR(150) NOT NULL,
    category NVARCHAR(50),
    productType NVARCHAR(50),
    unit NVARCHAR(20),
    description NVARCHAR(300),
    sellingPrice DECIMAL(18,2),
    taxRate DECIMAL(5,2),
    status NVARCHAR(20) DEFAULT 'ACTIVE',
    createdAt DATETIME2 DEFAULT GETDATE()
);
GO

CREATE TABLE VendorProducts (
    vendorProductId INT IDENTITY(1,1) PRIMARY KEY,
    vendorId VARCHAR(20) NOT NULL,
    productId VARCHAR(20) NOT NULL,
    vendorPartNo VARCHAR(50),
    purchasePrice DECIMAL(18,2),
    currency VARCHAR(10) DEFAULT 'INR',
    leadTimeDays INT,
    status NVARCHAR(20) DEFAULT 'ACTIVE',

    FOREIGN KEY (vendorId) REFERENCES Vendors(vendorId),
    FOREIGN KEY (productId) REFERENCES Products(productId)
);
GO

CREATE TABLE PurchaseOrders (
    poId VARCHAR(20) PRIMARY KEY,
    vendorId VARCHAR(20) NOT NULL,
    poDate DATE NOT NULL,
    expectedDate DATE,
    status NVARCHAR(20) DEFAULT 'OPEN',
    subtotal DECIMAL(18,2),
    taxTotal DECIMAL(18,2),
    grandTotal DECIMAL(18,2),
    notes NVARCHAR(500),

    FOREIGN KEY (vendorId) REFERENCES Vendors(vendorId)
);
GO

CREATE TABLE PurchaseOrderItems (
    poItemId INT IDENTITY(1,1) PRIMARY KEY,
    poId VARCHAR(20) NOT NULL,
    productId VARCHAR(20) NOT NULL,
    quantity DECIMAL(18,2) NOT NULL,
    unitPrice DECIMAL(18,2) NOT NULL,
    taxRate DECIMAL(5,2),
    taxAmount DECIMAL(18,2),
    lineTotal DECIMAL(18,2),

    FOREIGN KEY (poId) REFERENCES PurchaseOrders(poId),
    FOREIGN KEY (productId) REFERENCES Products(productId)
);
GO

CREATE TABLE SalesOrders (
    soId VARCHAR(20) PRIMARY KEY,
    customerId VARCHAR(20) NOT NULL,
    soDate DATE NOT NULL,
    expectedDate DATE,
    status NVARCHAR(20) DEFAULT 'OPEN',
    subtotal DECIMAL(18,2),
    taxTotal DECIMAL(18,2),
    grandTotal DECIMAL(18,2),
    notes NVARCHAR(500),

    FOREIGN KEY (customerId) REFERENCES Customers(customerId)
);
GO

CREATE TABLE SalesOrderItems (
    soItemId INT IDENTITY(1,1) PRIMARY KEY,
    soId VARCHAR(20) NOT NULL,
    productId VARCHAR(20) NOT NULL,
    quantity DECIMAL(18,2) NOT NULL,
    unitPrice DECIMAL(18,2) NOT NULL,
    taxRate DECIMAL(5,2),
    taxAmount DECIMAL(18,2),
    lineTotal DECIMAL(18,2),

    FOREIGN KEY (soId) REFERENCES SalesOrders(soId),
    FOREIGN KEY (productId) REFERENCES Products(productId)
);
GO

CREATE TABLE VendorInvoices (
    vendorInvoiceId VARCHAR(20) PRIMARY KEY,
    vendorId VARCHAR(20) NOT NULL,
    poId VARCHAR(20),
    invoiceNumber VARCHAR(50) NOT NULL,
    invoiceDate DATE NOT NULL,
    dueDate DATE,
    subtotal DECIMAL(18,2),
    taxTotal DECIMAL(18,2),
    grandTotal DECIMAL(18,2),
    status NVARCHAR(20) DEFAULT 'UNPAID',
    sourceFile NVARCHAR(300),

    FOREIGN KEY (vendorId) REFERENCES Vendors(vendorId),
    FOREIGN KEY (poId) REFERENCES PurchaseOrders(poId)
);
GO

CREATE TABLE VendorInvoiceItems (
    invoiceItemId INT IDENTITY(1,1) PRIMARY KEY,
    vendorInvoiceId VARCHAR(20) NOT NULL,
    productId VARCHAR(20) NOT NULL,
    quantity DECIMAL(18,2) NOT NULL,
    unitPrice DECIMAL(18,2) NOT NULL,
    taxRate DECIMAL(5,2),
    taxAmount DECIMAL(18,2),
    lineTotal DECIMAL(18,2),

    FOREIGN KEY (vendorInvoiceId) REFERENCES VendorInvoices(vendorInvoiceId),
    FOREIGN KEY (productId) REFERENCES Products(productId)
);
GO

CREATE TABLE CustomerInvoices (
    customerInvoiceId VARCHAR(20) PRIMARY KEY,
    customerId VARCHAR(20) NOT NULL,
    soId VARCHAR(20),
    invoiceNumber VARCHAR(50) NOT NULL,
    invoiceDate DATE NOT NULL,
    dueDate DATE,
    subtotal DECIMAL(18,2),
    taxTotal DECIMAL(18,2),
    grandTotal DECIMAL(18,2),
    status NVARCHAR(20) DEFAULT 'UNPAID',

    FOREIGN KEY (customerId) REFERENCES Customers(customerId),
    FOREIGN KEY (soId) REFERENCES SalesOrders(soId)
);
GO

CREATE TABLE CustomerInvoiceItems (
    invoiceItemId INT IDENTITY(1,1) PRIMARY KEY,
    customerInvoiceId VARCHAR(20) NOT NULL,
    productId VARCHAR(20) NOT NULL,
    quantity DECIMAL(18,2) NOT NULL,
    unitPrice DECIMAL(18,2) NOT NULL,
    taxRate DECIMAL(5,2),
    taxAmount DECIMAL(18,2),
    lineTotal DECIMAL(18,2),

    FOREIGN KEY (customerInvoiceId) REFERENCES CustomerInvoices(customerInvoiceId),
    FOREIGN KEY (productId) REFERENCES Products(productId)
);
GO

CREATE TABLE VendorPayments (
    vendorPaymentId VARCHAR(20) PRIMARY KEY,
    vendorId VARCHAR(20) NOT NULL,
    vendorInvoiceId VARCHAR(20) NOT NULL,
    paymentDate DATE NOT NULL,
    amount DECIMAL(18,2) NOT NULL,
    paymentMethod NVARCHAR(30),
    transactionRef VARCHAR(100),
    status NVARCHAR(20) DEFAULT 'COMPLETED',
    notes NVARCHAR(500),

    FOREIGN KEY (vendorId) REFERENCES Vendors(vendorId),
    FOREIGN KEY (vendorInvoiceId) REFERENCES VendorInvoices(vendorInvoiceId)
);
GO

CREATE TABLE CustomerPayments (
    customerPaymentId VARCHAR(20) PRIMARY KEY,
    customerId VARCHAR(20) NOT NULL,
    customerInvoiceId VARCHAR(20) NOT NULL,
    paymentDate DATE NOT NULL,
    amount DECIMAL(18,2) NOT NULL,
    paymentMethod NVARCHAR(30),
    transactionRef VARCHAR(100),
    status NVARCHAR(20) DEFAULT 'COMPLETED',
    notes NVARCHAR(500),

    FOREIGN KEY (customerId) REFERENCES Customers(customerId),
    FOREIGN KEY (customerInvoiceId) REFERENCES CustomerInvoices(customerInvoiceId)
);
GO

CREATE TABLE VendorPaymentAdvices (
    adviceId VARCHAR(20) PRIMARY KEY,
    vendorPaymentId VARCHAR(20) NOT NULL,
    vendorId VARCHAR(20) NOT NULL,
    vendorInvoiceId VARCHAR(20) NOT NULL,
    amountPaid DECIMAL(18,2) NOT NULL,
    remainingAmount DECIMAL(18,2) DEFAULT 0,
    pdfKey NVARCHAR(300),
    createdAt DATETIME2 DEFAULT GETDATE(),

    FOREIGN KEY (vendorPaymentId) REFERENCES VendorPayments(vendorPaymentId),
    FOREIGN KEY (vendorId) REFERENCES Vendors(vendorId),
    FOREIGN KEY (vendorInvoiceId) REFERENCES VendorInvoices(vendorInvoiceId)
);
GO

CREATE TABLE CustomerReceipts (
    receiptId VARCHAR(20) PRIMARY KEY,
    customerPaymentId VARCHAR(20) NOT NULL,
    customerId VARCHAR(20) NOT NULL,
    customerInvoiceId VARCHAR(20) NOT NULL,
    amountReceived DECIMAL(18,2) NOT NULL,
    remainingAmount DECIMAL(18,2) DEFAULT 0,
    pdfKey NVARCHAR(300),
    createdAt DATETIME2 DEFAULT GETDATE(),

    FOREIGN KEY (customerPaymentId) REFERENCES CustomerPayments(customerPaymentId),
    FOREIGN KEY (customerId) REFERENCES Customers(customerId),
    FOREIGN KEY (customerInvoiceId) REFERENCES CustomerInvoices(customerInvoiceId)
);
GO

CREATE TABLE InventoryTransactions (
    transactionId VARCHAR(20) PRIMARY KEY,
    productId VARCHAR(20) NOT NULL,
    transactionType NVARCHAR(30) NOT NULL,
    referenceId VARCHAR(30),
    quantity DECIMAL(18,2) NOT NULL,
    transactionDate DATETIME2 DEFAULT GETDATE(),
    notes NVARCHAR(500),

    FOREIGN KEY (productId) REFERENCES Products(productId)
);
GO

SELECT TABLE_NAME
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_TYPE = 'BASE TABLE'
ORDER BY TABLE_NAME;
GO

USE YamanMotorsDB;
GO

DELETE FROM PurchaseOrderItems
WHERE poId IN ('PO-000001', 'PO-000002');

DELETE FROM PurchaseOrders
WHERE poId IN ('PO-000001', 'PO-000002');

DELETE FROM Products
WHERE productId = 'ENG001';

DELETE FROM Vendors
WHERE vendorId = 'V001';
GO

SELECT * FROM PurchaseOrders;
SELECT * FROM PurchaseOrderItems;
SELECT * FROM Products WHERE productId = 'ENG001';
SELECT * FROM Vendors WHERE vendorId = 'V001';


USE YamanMotorsDB;
GO

DELETE FROM SalesOrderItems
WHERE soId = 'SO-000001';

DELETE FROM SalesOrders
WHERE soId = 'SO-000001';

DELETE FROM Products
WHERE productId = 'ENG001';

DELETE FROM Customers
WHERE customerId = 'C001';
GO


SELECT * FROM SalesOrders;
SELECT * FROM SalesOrderItems;
SELECT * FROM Products;
SELECT * FROM Customers;
GO

USE YamanMotorsDB;
GO

SELECT
    TABLE_NAME,
    COLUMN_NAME,
    DATA_TYPE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME IN (
    'VendorInvoices',
    'VendorInvoiceItems',
    'CustomerInvoices',
    'CustomerInvoiceItems'
)
ORDER BY
    TABLE_NAME,
    ORDINAL_POSITION;
GO

SELECT
    TABLE_NAME,
    COLUMN_NAME,
    DATA_TYPE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME IN (
    'VendorPayments',
    'CustomerPayments',
    'VendorPaymentAdvices',
    'CustomerReceipts'
)
ORDER BY
    TABLE_NAME,
    ORDINAL_POSITION;

    SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'InventoryTransactions'
ORDER BY ORDINAL_POSITION;

SELECT *
FROM VendorProducts
WHERE productId = 'ENG001';