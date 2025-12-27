-- Check if discount column exists in InvoiceLineItem table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'InvoiceLineItem' 
AND column_name = 'discount';



