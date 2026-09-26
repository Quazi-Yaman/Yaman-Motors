SELECT 'VendorInvoices' AS TableName, COUNT(*) AS Records FROM VendorInvoices
UNION ALL
SELECT 'CustomerInvoices', COUNT(*) FROM CustomerInvoices
UNION ALL
SELECT 'VendorPayments', COUNT(*) FROM VendorPayments
UNION ALL
SELECT 'CustomerPayments', COUNT(*) FROM CustomerPayments
UNION ALL
SELECT 'VendorPaymentAdvices', COUNT(*) FROM VendorPaymentAdvices
UNION ALL
SELECT 'CustomerReceipts', COUNT(*) FROM CustomerReceipts
UNION ALL
SELECT 'InventoryTransactions', COUNT(*) FROM InventoryTransactions
UNION ALL
SELECT 'PurchaseOrders', COUNT(*) FROM PurchaseOrders
UNION ALL
SELECT 'SalesOrders', COUNT(*) FROM SalesOrders
UNION ALL
SELECT 'VendorProducts', COUNT(*) FROM VendorProducts
UNION ALL
SELECT 'Products', COUNT(*) FROM Products
UNION ALL
SELECT 'Vendors', COUNT(*) FROM Vendors
UNION ALL
SELECT 'Customers', COUNT(*) FROM Customers;

USE YamanMotorsDB;
GO

DELETE FROM CustomerReceipts;
DELETE FROM VendorPaymentAdvices;

DELETE FROM CustomerPayments;
DELETE FROM VendorPayments;

DELETE FROM CustomerInvoiceItems;
DELETE FROM CustomerInvoices;

DELETE FROM VendorInvoiceItems;
DELETE FROM VendorInvoices;

DELETE FROM InventoryTransactions;

DELETE FROM Products;
DELETE FROM Vendors;
DELETE FROM Customers;
GO

SELECT 'VendorInvoices' AS TableName, COUNT(*) AS Records FROM VendorInvoices
UNION ALL
SELECT 'CustomerInvoices', COUNT(*) FROM CustomerInvoices
UNION ALL
SELECT 'VendorPayments', COUNT(*) FROM VendorPayments
UNION ALL
SELECT 'CustomerPayments', COUNT(*) FROM CustomerPayments
UNION ALL
SELECT 'VendorPaymentAdvices', COUNT(*) FROM VendorPaymentAdvices
UNION ALL
SELECT 'CustomerReceipts', COUNT(*) FROM CustomerReceipts
UNION ALL
SELECT 'InventoryTransactions', COUNT(*) FROM InventoryTransactions
UNION ALL
SELECT 'Products', COUNT(*) FROM Products
UNION ALL
SELECT 'Vendors', COUNT(*) FROM Vendors
UNION ALL
SELECT 'Customers', COUNT(*) FROM Customers;

USE YamanMotorsDB;
GO

SELECT
    vendorInvoiceId,
    invoiceNumber,
    grandTotal
FROM VendorInvoices
WHERE invoiceNumber = 'TMC-INV-001';
GO

USE YamanMotorsDB;
GO

DELETE FROM VendorInvoiceItems
WHERE vendorInvoiceId = 'VINV-1790071263081';

DELETE FROM VendorInvoices
WHERE vendorInvoiceId = 'VINV-1790071263081';
GO

SELECT *
FROM VendorPaymentAdvices
ORDER BY createdAt DESC;