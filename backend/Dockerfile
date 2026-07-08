# ---- Build Stage ----
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY prisma/ ./prisma/
RUN npx prisma generate

COPY src/ ./src/
RUN npm run build

# ---- Runtime Stage ----
FROM node:22-alpine

WORKDIR /app

RUN apk add --no-cache postgresql-client

COPY package.json package-lock.json ./
RUN npm ci --only=production

COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY prisma/schema.prisma ./prisma/
COPY docker-entrypoint.sh ./

RUN chmod +x docker-entrypoint.sh

EXPOSE 3001

ENTRYPOINT ["./docker-entrypoint.sh"]
