# WMS - 仓库管理系统

工厂仓库管理系统，用于管理物料、面料、五金、拉链、包装材料、辅料、半成品、成品的库存流转。

## 技术栈

- 前端：React 19 + TypeScript + Tailwind CSS + Vite
- 后端：NestJS + Prisma ORM
- 数据库：PostgreSQL
- 部署：Docker Compose

## 快速启动

```bash
cp .env.example .env
docker compose up -d --build
```

启动后访问：

- 前端页面：http://localhost:3000
- 后端 API：http://localhost:3001/api
- 健康检查：http://localhost:3001/api/health

## 默认管理员账号

- 账号：admin
- 密码：通过环境变量 `DEFAULT_ADMIN_PASSWORD` 设置，默认为 `admin123`

## 修改默认密码

1. 登录后进入系统设置 → 用户管理
2. 或者直接修改 `.env` 中的 `DEFAULT_ADMIN_PASSWORD`，然后重新初始化

## 常用命令

```bash
# 启动
docker compose up -d

# 重启
docker compose restart

# 查看日志
docker compose logs -f

# 停止
docker compose down

# 停止并清除数据
docker compose down -v

# 清空并重新初始化
docker compose down -v
docker compose up -d --build
```

## 目录结构

```
├── frontend/          # React 前端应用
├── backend/           # NestJS 后端 API
├── docker-compose.yml # Docker 编排
├── .env.example       # 环境变量模板
└── README.md          # 本文件
```

## 生产部署注意事项

1. 修改 `JWT_SECRET` 为强随机字符串
2. 修改 `DEFAULT_ADMIN_PASSWORD`
3. 使用强数据库密码
4. 配置 HTTPS
5. 数据库端口不要暴露到公网
6. 开启 NODE_ENV=production 关闭详细错误堆栈
