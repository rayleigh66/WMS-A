# WMS - 仓库管理系统

工厂仓库管理系统，用于管理物料、面料、五金、拉链、包装材料、辅料、半成品、成品的库存流转。

## 技术栈

- 前端：React 19 + TypeScript + Tailwind CSS + Vite + Nginx
- 后端：NestJS + Prisma ORM
- 数据库：PostgreSQL 16
- 部署：Docker Compose

## 快速启动（Docker 一键部署）

```bash
cp .env.example .env
docker compose up -d --build
```

## 默认访问地址

| 服务 | 地址 |
|---|---|
| 前端页面 | http://localhost |
| 后端 API | http://localhost:3001/api |
| 健康检查 | http://localhost:3001/api/health |
| Swagger 文档 | http://localhost:3001/api/docs |

## 默认管理员账号

- 邮箱：admin@example.com
- 密码：ChangeMe123!

**生产部署前必须修改 `DEFAULT_ADMIN_EMAIL`、`DEFAULT_ADMIN_PASSWORD`、`JWT_SECRET`。**

## 修改默认密码

1. 登录后进入系统设置 → 用户管理
2. 或者直接修改 `.env` 中的 `DEFAULT_ADMIN_PASSWORD`，然后：
   ```bash
   docker compose down -v
   docker compose up -d --build
   ```

## 常用命令

```bash
# 查看服务状态
docker compose ps

# 查看所有日志
docker compose logs -f

# 查看后端日志
docker compose logs -f backend

# 查看前端日志
docker compose logs -f frontend

# 重启
docker compose restart

# 停止
docker compose down

# 停止并删除数据库数据
docker compose down -v
```

## 数据重置

```bash
# 谨慎使用 -v 会删除数据库 volume，所有数据丢失
docker compose down -v
docker compose up -d --build
```

## 手动运行后端（开发）

```bash
cd backend
npm install
cp .env.example .env
# 编辑 .env 中的 DATABASE_URL 指向本地 PostgreSQL
npx prisma generate
npx prisma migrate dev
npm run seed
npm run start:dev
```

## 手动运行前端（开发）

```bash
npm install
cp .env.example .env  # 或手动设置 VITE_API_BASE_URL
npm run dev
```

## 目录结构

```
├── backend/            # NestJS 后端 API
├── src/                # React 前端应用
├── docker-compose.yml  # Docker 编排
├── Dockerfile          # 前端 Dockerfile
├── nginx.conf          # Nginx 配置
├── .env.example        # 环境变量模板
└── README.md           # 本文件
```

## 生产部署注意事项

1. 修改 `JWT_SECRET` 为强随机字符串
2. 修改 `DEFAULT_ADMIN_PASSWORD`
3. 修改 `CORS_ORIGIN` 为正式域名
4. 使用强数据库密码
5. 数据库端口 `5432` 建议只绑定 `127.0.0.1` 或取消外部映射
6. 配置 HTTPS（建议在 Nginx 或反向代理层处理）
7. 开启 `NODE_ENV=production` 关闭详细错误堆栈
