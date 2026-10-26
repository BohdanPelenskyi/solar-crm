-- Приходи тепер мають лише «Платіжну інструкцію»: переносимо туди старі рахунки та видаткові.
UPDATE "TransactionAttachment"
SET "type" = 'PAYMENT_ORDER'
WHERE "transactionId" IN (
  SELECT "id" FROM "FinancialTransaction" WHERE "type" = 'INCOME'
);
