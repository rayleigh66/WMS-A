ALTER TABLE "items" ADD COLUMN "barcode" TEXT;
CREATE UNIQUE INDEX "items_barcode_key" ON "items"("barcode");

ALTER TABLE "stock_in_orders" ADD COLUMN "request_id" TEXT;
CREATE UNIQUE INDEX "stock_in_orders_request_id_key" ON "stock_in_orders"("request_id");

ALTER TABLE "stock_out_orders" ADD COLUMN "request_id" TEXT;
CREATE UNIQUE INDEX "stock_out_orders_request_id_key" ON "stock_out_orders"("request_id");
