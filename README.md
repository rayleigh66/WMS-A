# WMS-A

WMS-A 是一个用于工厂物料、辅料、半成品和成品库存管理的仓库管理系统。

## 技术栈

- Frontend: React + Vite + TypeScript
- Backend: NestJS + Prisma
- Database: PostgreSQL
- Deployment: Docker Compose

## Docker 一键部署

```bash
cp .env.example .env
docker compose up -d --build
```

## 默认访问地址

| 服务 | 地址 |
| --- | --- |
| 前端页面 | http://localhost |
| 后端 API | http://localhost:3001/api |
| 健康检查 | http://localhost:3001/api/health |
| Swagger 文档 | http://localhost:3001/api/docs |

## 默认管理员

- 邮箱：admin@example.com
- 密码：ChangeMe123!

生产部署前必须修改：

- `DEFAULT_ADMIN_EMAIL`
- `DEFAULT_ADMIN_PASSWORD`
- `JWT_SECRET`

## 常用命令

查看服务：

```bash
docker compose ps
```

查看日志：

```bash
docker compose logs -f
docker compose logs -f backend
docker compose logs -f frontend
```

重启服务：

```bash
docker compose restart
```

停止服务：

```bash
docker compose down
```

重置数据：

```bash
docker compose down -v
docker compose up -d --build
```

注意：`docker compose down -v` 会删除 PostgreSQL volume，生产环境谨慎使用。

## 本地开发

前端：

```bash
npm install
npm run dev
```

后端：

```bash
cd backend
npm install
cp .env.example .env
npx prisma generate
npx prisma migrate dev
npm run seed
npm run start:dev
```

## 生产部署注意事项

- 不要提交 `.env`。
- 修改 `JWT_SECRET`。
- 修改默认管理员密码。
- 生产环境不要把 PostgreSQL 暴露到公网。
- 将 `CORS_ORIGIN` 改为正式域名。
- 建议使用 HTTPS 反向代理。

## 验收命令

```bash
curl http://localhost:3001/api/health
curl -X POST http://localhost:3001/api/auth/login   -H "Content-Type: application/json"   -d '{"email":"admin@example.com","password":"ChangeMe123!"}'
curl -I http://localhost
```
