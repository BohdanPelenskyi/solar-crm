DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TransactionAttachmentType') THEN
    CREATE TYPE "TransactionAttachmentType" AS ENUM ('INVOICE', 'EXPENSE_DOC');
  END IF;
END $$;

ALTER TABLE "TransactionAttachment"
ADD COLUMN IF NOT EXISTS "type" "TransactionAttachmentType" NOT NULL DEFAULT 'INVOICE';

CREATE INDEX IF NOT EXISTS "TransactionAttachment_transactionId_type_idx"
ON "TransactionAttachment"("transactionId", "type");
