#!/usr/bin/env bash
set -euo pipefail

API="${WMS_API:-http://localhost:3001/api}"
EMAIL="${WMS_ADMIN_EMAIL:-admin@example.com}"
PASSWORD="${WMS_ADMIN_PASSWORD:-ChangeMe123!}"

json() { python3 -c "import json,sys; d=json.load(sys.stdin); print($1)"; }
uuid() { python3 -c 'import uuid; print(uuid.uuid4())'; }
pass() { printf '\033[0;32m[PASS]\033[0m %s\n' "$1"; }
fail() { printf '\033[0;31m[FAIL]\033[0m %s\n' "$1"; exit 1; }

echo "WMS-A Warehouse Pilot acceptance"
LOGIN=$(curl -fsS -X POST "$API/auth/login" -H 'Content-Type: application/json' -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")
TOKEN=$(printf '%s' "$LOGIN" | json 'd["accessToken"]')
AUTH="Authorization: Bearer $TOKEN"

WH=$(curl -fsS "$API/warehouses" -H "$AUTH")
WH_ID=$(printf '%s' "$WH" | json 'next(x["id"] for x in d if x.get("status")=="ACTIVE")')
LOCS=$(curl -fsS "$API/locations?warehouseId=$WH_ID" -H "$AUTH")
LOC_ID=$(printf '%s' "$LOCS" | json 'next(x["id"] for x in d if x.get("status")=="ACTIVE")')

STAMP=$(date +%s)
ITEM_CODE="PILOT-$STAMP"
BARCODE="99$STAMP"
ITEM=$(curl -fsS -X POST "$API/items" -H "$AUTH" -H 'Content-Type: application/json' -d "{\"itemCode\":\"$ITEM_CODE\",\"barcode\":\"$BARCODE\",\"itemName\":\"Warehouse Pilot Test\",\"category\":\"FINISHED_GOODS\",\"unit\":\"件\"}")
ITEM_ID=$(printf '%s' "$ITEM" | json 'd["id"]')
pass "created isolated test SKU $ITEM_CODE"

SCAN=$(curl -fsS "$API/items/scan/$BARCODE" -H "$AUTH")
SCAN_ID=$(printf '%s' "$SCAN" | json 'd["id"]')
[ "$SCAN_ID" = "$ITEM_ID" ] || fail "barcode did not resolve to test SKU"
pass "barcode resolves to SKU"

IN_REQ=$(uuid)
IN_BODY="{\"requestId\":\"$IN_REQ\",\"type\":\"OTHER\",\"warehouseId\":\"$WH_ID\",\"items\":[{\"itemId\":\"$ITEM_ID\",\"locationId\":\"$LOC_ID\",\"quantity\":100,\"unit\":\"件\"}]}"
IN1=$(curl -fsS -X POST "$API/stock-in" -H "$AUTH" -H 'Content-Type: application/json' -d "$IN_BODY")
IN2=$(curl -fsS -X POST "$API/stock-in" -H "$AUTH" -H 'Content-Type: application/json' -d "$IN_BODY")
NO1=$(printf '%s' "$IN1" | json 'd["orderNo"]')
NO2=$(printf '%s' "$IN2" | json 'd["orderNo"]')
[ "$NO1" = "$NO2" ] || fail "idempotent retry created two stock-in orders"
pass "duplicate stock-in request returns original order"

INV=$(curl -fsS "$API/inventory?itemId=$ITEM_ID" -H "$AUTH")
QTY=$(printf '%s' "$INV" | json 'float(d["data"][0]["quantity"])')
[ "$QTY" = "100.0" ] || fail "expected inventory 100 after retry, got $QTY"
pass "retry did not double inventory"

REQ_A=$(uuid); REQ_B=$(uuid)
BODY_A="{\"requestId\":\"$REQ_A\",\"type\":\"SALES\",\"warehouseId\":\"$WH_ID\",\"items\":[{\"itemId\":\"$ITEM_ID\",\"locationId\":\"$LOC_ID\",\"quantity\":80,\"unit\":\"件\"}]}"
BODY_B="{\"requestId\":\"$REQ_B\",\"type\":\"SALES\",\"warehouseId\":\"$WH_ID\",\"items\":[{\"itemId\":\"$ITEM_ID\",\"locationId\":\"$LOC_ID\",\"quantity\":80,\"unit\":\"件\"}]}"

curl -sS -o /tmp/wms_out_a.json -w '%{http_code}' -X POST "$API/stock-out" -H "$AUTH" -H 'Content-Type: application/json' -d "$BODY_A" > /tmp/wms_out_a.code &
PID_A=$!
curl -sS -o /tmp/wms_out_b.json -w '%{http_code}' -X POST "$API/stock-out" -H "$AUTH" -H 'Content-Type: application/json' -d "$BODY_B" > /tmp/wms_out_b.code &
PID_B=$!
wait "$PID_A" || true; wait "$PID_B" || true
CODE_A=$(cat /tmp/wms_out_a.code); CODE_B=$(cat /tmp/wms_out_b.code)
SUCCESS=0
[ "$CODE_A" = "201" ] && SUCCESS=$((SUCCESS+1))
[ "$CODE_B" = "201" ] && SUCCESS=$((SUCCESS+1))
[ "$SUCCESS" -eq 1 ] || fail "expected exactly one concurrent stock-out success; got HTTP $CODE_A and $CODE_B"
pass "concurrent stock-out cannot oversell"

INV=$(curl -fsS "$API/inventory?itemId=$ITEM_ID" -H "$AUTH")
QTY=$(printf '%s' "$INV" | json 'float(d["data"][0]["quantity"])')
[ "$QTY" = "20.0" ] || fail "expected final inventory 20, got $QTY"
pass "final inventory is 20"

echo "All warehouse pilot acceptance checks passed."
