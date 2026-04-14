-- CreateTable: entities
CREATE TABLE "entities" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "entities_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "entities_name_key" ON "entities"("name");
CREATE UNIQUE INDEX "entities_code_key" ON "entities"("code");

-- AlterTable: users — add entityId (nullable; ADMIN users may have no entity)
ALTER TABLE "users" ADD COLUMN "entityId" TEXT;

ALTER TABLE "users" ADD CONSTRAINT "users_entityId_fkey"
    FOREIGN KEY ("entityId") REFERENCES "entities"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable: customers — add entityId (required; default to first entity for existing rows)
ALTER TABLE "customers" ADD COLUMN "entityId" TEXT;

ALTER TABLE "customers" ADD CONSTRAINT "customers_entityId_fkey"
    FOREIGN KEY ("entityId") REFERENCES "entities"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable: products — add entityId (required)
ALTER TABLE "products" ADD COLUMN "entityId" TEXT;

ALTER TABLE "products" ADD CONSTRAINT "products_entityId_fkey"
    FOREIGN KEY ("entityId") REFERENCES "entities"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable: forecasts — add entityId (required)
ALTER TABLE "forecasts" ADD COLUMN "entityId" TEXT;

ALTER TABLE "forecasts" ADD CONSTRAINT "forecasts_entityId_fkey"
    FOREIGN KEY ("entityId") REFERENCES "entities"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable: revenue_records — add entityId (required)
ALTER TABLE "revenue_records" ADD COLUMN "entityId" TEXT;

ALTER TABLE "revenue_records" ADD CONSTRAINT "revenue_records_entityId_fkey"
    FOREIGN KEY ("entityId") REFERENCES "entities"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable: action_items — add entityId (required)
ALTER TABLE "action_items" ADD COLUMN "entityId" TEXT;

ALTER TABLE "action_items" ADD CONSTRAINT "action_items_entityId_fkey"
    FOREIGN KEY ("entityId") REFERENCES "entities"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable: attachments — add entityId (required)
ALTER TABLE "attachments" ADD COLUMN "entityId" TEXT;

ALTER TABLE "attachments" ADD CONSTRAINT "attachments_entityId_fkey"
    FOREIGN KEY ("entityId") REFERENCES "entities"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
