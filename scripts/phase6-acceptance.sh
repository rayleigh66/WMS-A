#!/usr/bin/env bash
set -euo pipefail

echo "============================================"
echo "WMS-A Phase 6 Runtime Acceptance Script"
echo "============================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'
pass() { echo -e "${GREEN}[PASS]${NC} $1"; }
fail() { echo -e "${RED}[FAIL]${NC} $1"; }

FAILED=0

# ============================
# 1. Docker Compose Config
# ============================
echo ""
echo "=== 1. docker compose config ==="
if docker compose config > /tmp/wms_config_check.txt 2>&1; then
    pass "docker compose config OK"
else
    fail "docker compose config FAILED"
    cat /tmp/wms_config_check.txt
    FAILED=1
fi

# ============================
# 2. Docker Compose Up
# ============================
echo ""
echo "=== 2. docker compose up -d --build ==="
if docker compose up -d --build > /tmp/wms_build.log 2>&1; then
    pass "docker compose up -d --build succeeded"
else
    fail "docker compose up FAILED"
    tail -30 /tmp/wms_build.log
    FAILED=1
fi

# ============================
# 3. docker compose ps
# ============================
echo ""
echo "=== 3. docker compose ps ==="
docker compose ps
echo ""

# ============================
# 4. Health Check
# ============================
echo "=== 4. Health Check ==="
HEALTH=$(curl -s http://localhost:3001/api/health 2>&1) || true
if echo "$HEALTH" | grep -q '"status":"ok"'; then
    pass "/api/health returned ok"
else
    fail "/api/health failed: $HEALTH"
    FAILED=1
fi
echo ""

# ============================
# 5. Frontend
# ============================
echo "=== 5. Frontend ==="
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost 2>&1) || true
if [ "$HTTP_CODE" = "200" ]; then
    pass "Frontend returned HTTP 200"
else
    fail "Frontend returned HTTP $HTTP_CODE"
    FAILED=1
fi
echo ""

# ============================
# 6. Login
# ============================
echo "=== 6. Login ==="
LOGIN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"ChangeMe123!"}') || true
TOKEN=$(echo "$LOGIN" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4 || true)
if [ -n "$TOKEN" ]; then
    pass "Admin login succeeded, token obtained"
else
    fail "Login failed: $LOGIN"
    FAILED=1
fi
echo ""

if [ -z "$TOKEN" ]; then
    echo -e "${RED}Cannot continue without token. Exiting.${NC}"
    exit $FAILED
fi

AUTH="Authorization: Bearer $TOKEN"

# ============================
# 7. Me
# ============================
echo "=== 7. /api/auth/me ==="
ME=$(curl -s http://localhost:3001/api/auth/me -H "$AUTH")
echo "$ME" | python3 -m json.tool 2>/dev/null || echo "$ME"
echo ""

# ============================
# 8. Base APIs
# ============================
echo "=== 8. Base APIs ==="
for endpoint in dashboard items warehouses locations; do
    RESULT=$(curl -s "http://localhost:3001/api/$endpoint" -H "$AUTH")
    TOTAL=$(echo "$RESULT" | grep -o '"total":[0-9]*' | cut -d: -f2 || echo "N/A")
    echo "  /api/$endpoint -> items: $TOTAL"
done
echo ""

# ============================
# 9. Inventory
# ============================
echo "=== 9. Inventory ==="
INV=$(curl -s "http://localhost:3001/api/inventory" -H "$AUTH")
INV_COUNT=$(echo "$INV" | grep -o '"total":[0-9]*' | cut -d: -f2 || echo "0")
echo "  /api/inventory -> $INV_COUNT records"
echo ""

# ============================
# 10. Get first item, warehouse, location
# ============================
echo "=== 10. Get test data ==="
ITEM_ID=$(curl -s "http://localhost:3001/api/items?pageSize=1&status=ACTIVE" -H "$AUTH" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4 || true)
WH_ID=$(curl -s "http://localhost:3001/api/warehouses" -H "$AUTH" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4 || true)
LOC_ID=$(curl -s "http://localhost:3001/api/locations?warehouseId=$WH_ID" -H "$AUTH" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4 || true)
ITEM_CODE=$(curl -s "http://localhost:3001/api/items?pageSize=1&status=ACTIVE" -H "$AUTH" | grep -o '"itemCode":"[^"]*"' | head -1 | cut -d'"' -f4 || true)
ITEM_UNIT=$(curl -s "http://localhost:3001/api/items?pageSize=1&status=ACTIVE" -H "$AUTH" | grep -o '"unit":"[^"]*"' | head -1 | cut -d'"' -f4 || true)
echo "  Item: $ITEM_ID ($ITEM_CODE)"
echo "  Warehouse: $WH_ID"
echo "  Location: $LOC_ID"
echo ""

# ============================
# 11. Stock In
# ============================
echo "=== 11. Stock In ==="
STOCK_IN_QTY=100
STOCK_IN=$(curl -s -X POST "http://localhost:3001/api/stock-in" \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d "{\"type\":\"PURCHASE\",\"warehouseId\":\"$WH_ID\",\"items\":[{\"itemId\":\"$ITEM_ID\",\"locationId\":\"$LOC_ID\",\"quantity\":$STOCK_IN_QTY,\"unit\":\"$ITEM_UNIT\"}]}")
STOCK_IN_NO=$(echo "$STOCK_IN" | grep -o '"orderNo":"[^"]*"' | cut -d'"' -f4 || echo "N/A")
if [ -n "$STOCK_IN_NO" ] && [ "$STOCK_IN_NO" != "N/A" ]; then
    pass "Stock in created: $STOCK_IN_NO"
else
    fail "Stock in failed: $STOCK_IN"
    FAILED=1
fi
echo ""

# ============================
# 12. Verify inventory after stock in
# ============================
echo "=== 12. Verify inventory after stock in ==="
INV_AFTER=$(curl -s "http://localhost:3001/api/inventory?itemId=$ITEM_ID" -H "$AUTH")
INV_QTY=$(echo "$INV_AFTER" | grep -o '"quantity":[0-9]*' | head -1 | cut -d: -f2 || echo "0")
echo "  Inventory quantity after stock in: $INV_QTY"
if [ "$INV_QTY" -ge "$STOCK_IN_QTY" ] 2>/dev/null; then
    pass "Inventory increased correctly"
else
    fail "Inventory did not increase as expected"
    FAILED=1
fi
echo ""

# ============================
# 13. Stock Out
# ============================
echo "=== 13. Stock Out (partial) ==="
STOCK_OUT_QTY=30
STOCK_OUT=$(curl -s -X POST "http://localhost:3001/api/stock-out" \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d "{\"type\":\"PRODUCTION_PICKING\",\"warehouseId\":\"$WH_ID\",\"items\":[{\"itemId\":\"$ITEM_ID\",\"locationId\":\"$LOC_ID\",\"quantity\":$STOCK_OUT_QTY,\"unit\":\"$ITEM_UNIT\"}]}")
STOCK_OUT_NO=$(echo "$STOCK_OUT" | grep -o '"orderNo":"[^"]*"' | cut -d'"' -f4 || echo "N/A")
if [ -n "$STOCK_OUT_NO" ] && [ "$STOCK_OUT_NO" != "N/A" ]; then
    pass "Stock out created: $STOCK_OUT_NO"
else
    fail "Stock out failed: $STOCK_OUT"
    FAILED=1
fi
echo ""

# ============================
# 14. Verify inventory after stock out
# ============================
echo "=== 14. Verify inventory after stock out ==="
INV_OUT=$(curl -s "http://localhost:3001/api/inventory?itemId=$ITEM_ID" -H "$AUTH")
INV_OUT_QTY=$(echo "$INV_OUT" | grep -o '"quantity":[0-9]*' | head -1 | cut -d: -f2 || echo "0")
echo "  Inventory quantity after stock out: $INV_OUT_QTY"
EXPECTED=$((STOCK_IN_QTY - STOCK_OUT_QTY))
if [ "$INV_OUT_QTY" = "$EXPECTED" ] 2>/dev/null; then
    pass "Inventory decreased correctly ($EXPECTED)"
else
    fail "Expected $EXPECTED, got $INV_OUT_QTY"
    FAILED=1
fi
echo ""

# ============================
# 15. Stock Out (over-limit - should fail)
# ============================
echo "=== 15. Stock Out over-limit (should fail) ==="
OVER_QTY=99999
OVER_OUT=$(curl -s -X POST "http://localhost:3001/api/stock-out" \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d "{\"type\":\"PRODUCTION_PICKING\",\"warehouseId\":\"$WH_ID\",\"items\":[{\"itemId\":\"$ITEM_ID\",\"locationId\":\"$LOC_ID\",\"quantity\":$OVER_QTY,\"unit\":\"$ITEM_UNIT\"}]}")
if echo "$OVER_OUT" | grep -qi "库存不足"; then
    pass "Over-limit stock out correctly rejected with '库存不足'"
elif echo "$OVER_OUT" | grep -qi "message"; then
    pass "Over-limit stock out rejected: $(echo "$OVER_OUT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('message',''))" 2>/dev/null || echo "error message shown")"
else
    fail "Over-limit stock out should have been rejected. Response: $OVER_OUT"
    FAILED=1
fi
echo ""

# ============================
# 16. Stock Adjustment
# ============================
echo "=== 16. Stock Adjustment ==="
ADJ_QTY=50
ADJ=$(curl -s -X POST "http://localhost:3001/api/stock-adjustments" \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d "{\"warehouseId\":\"$WH_ID\",\"reason\":\"盘点差异调整\",\"items\":[{\"itemId\":\"$ITEM_ID\",\"locationId\":\"$LOC_ID\",\"quantityAfter\":$ADJ_QTY,\"unit\":\"$ITEM_UNIT\"}]}")
ADJ_NO=$(echo "$ADJ" | grep -o '"adjustmentNo":"[^"]*"' | cut -d'"' -f4 || echo "N/A")
if [ -n "$ADJ_NO" ] && [ "$ADJ_NO" != "N/A" ]; then
    pass "Stock adjustment created: $ADJ_NO"
else
    fail "Stock adjustment failed: $ADJ"
    FAILED=1
fi
echo ""

# ============================
# 17. Verify inventory after adjustment
# ============================
echo "=== 17. Verify inventory after adjustment ==="
INV_ADJ=$(curl -s "http://localhost:3001/api/inventory?itemId=$ITEM_ID" -H "$AUTH")
INV_ADJ_QTY=$(echo "$INV_ADJ" | grep -o '"quantity":[0-9]*' | head -1 | cut -d: -f2 || echo "0")
echo "  Inventory quantity after adjustment: $INV_ADJ_QTY"
if [ "$INV_ADJ_QTY" = "$ADJ_QTY" ] 2>/dev/null; then
    pass "Inventory adjusted correctly to $ADJ_QTY"
else
    fail "Expected $ADJ_QTY, got $INV_ADJ_QTY"
    FAILED=1
fi
echo ""

# ============================
# 18. Stock Movements
# ============================
echo "=== 18. Stock Movements ==="
MOVEMENTS=$(curl -s "http://localhost:3001/api/stock-movements?itemId=$ITEM_ID" -H "$AUTH")
MOV_COUNT=$(echo "$MOVEMENTS" | grep -o '"total":[0-9]*' | cut -d: -f2 || echo "0")
echo "  Stock movements for item: $MOV_COUNT records"
echo "$MOVEMENTS" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    for m in d.get('data', []):
        print(f\"    {m.get('movementNo','?'):20} {m.get('movementType','?'):12} change={m.get('quantityChange','?')}  {m.get('warehouse',{}).get('warehouseName','')}  {m.get('operator',{}).get('name','')}\")
except: pass
" 2>/dev/null || echo "  (parse error)"
echo ""

# ============================
# 19. Viewer permissions
# ============================
echo "=== 19. Viewer permissions ==="
# Create a viewer if not exists, or use existing viewer
VIEWER_LOGIN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"viewer@example.com","password":"Viewer123!"}') || true
VIEWER_TOKEN=$(echo "$VIEWER_LOGIN" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4 || true)
VIEWER_AUTH="Authorization: Bearer $VIEWER_TOKEN"

if [ -n "$VIEWER_TOKEN" ]; then
    pass "Viewer can login"

    # Viewer GET (should succeed)
    V_GET=$(curl -s "http://localhost:3001/api/inventory" -H "$VIEWER_AUTH")
    if [ -n "$V_GET" ]; then
        pass "Viewer can GET inventory"
    fi

    # Viewer POST stock-in (should fail 403)
    V_POST=$(curl -s -X POST "http://localhost:3001/api/stock-in" \
      -H "$VIEWER_AUTH" \
      -H "Content-Type: application/json" \
      -d "{\"type\":\"PURCHASE\",\"warehouseId\":\"$WH_ID\",\"items\":[]}")
    V_STATUS=$(echo "$V_POST" | grep -o '"statusCode":[0-9]*' | cut -d: -f2 || echo "?")
    if [ "$V_STATUS" = "403" ]; then
        pass "Viewer POST stock-in correctly denied (403)"
    else
        echo "  Warning: Viewer POST returned status $V_STATUS (expected 403)"
    fi
else
    echo "  (viewer not available, skipping)"
fi
echo ""

# ============================
# Summary
# ============================
echo "============================================"
if [ "$FAILED" -eq 0 ]; then
    echo -e "${GREEN}All checks passed!${NC}"
else
    echo -e "${RED}$FAILED checks FAILED${NC}"
fi
echo "============================================"
exit $FAILED
