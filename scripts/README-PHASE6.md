# Phase 6: Docker Runtime Acceptance

执行以下步骤验证 WMS-A Docker 部署。

## 前置条件

- Docker Engine 24+
- Docker Compose v2+
- Git

## 快速验证（自动脚本）

```bash
git clone https://github.com/rayleigh66/WMS-A.git
cd WMS-A
cp .env.example .env
chmod +x scripts/phase6-acceptance.sh
./scripts/phase6-acceptance.sh
```

## 手动验证步骤

### 1. 启动

```bash
cp .env.example .env
docker compose config
docker compose up -d --build
docker compose ps
```

### 2. 健康检查

```bash
curl http://localhost:3001/api/health
```
预期：`{"status":"ok","database":"ok","timestamp":"..."}`

### 3. 前端

```bash
curl -I http://localhost
```
预期：`HTTP/... 200 OK`

### 4. 登录

```bash
curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"ChangeMe123!"}' | python3 -m json.tool
```
保存返回的 `accessToken`。

### 5. 基础数据查询

```bash
TOKEN="<accessToken>"
curl -s http://localhost:3001/api/dashboard -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
curl -s http://localhost:3001/api/items -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
curl -s http://localhost:3001/api/warehouses -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
```

### 6. 入库 → 出库 → 调整 → 流水

见 `scripts/phase6-acceptance.sh` 中的完整流程。

### 7. 权限验证

```bash
# 用 viewer 账号登录
curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"viewer@example.com","password":"Viewer123!"}'

# viewer 应能 GET 但不能 POST
```

## 结果记录

将每一步的输出贴到 Issue #2 评论区。
