# ── Stage 1: Install dependencies ─────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts

# ── Stage 2: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ── Stage 3: Dev/Migrator (has ts-node for migration/seed commands) ──────────
FROM node:20-alpine AS migrator
RUN apk add --no-cache bash netcat-openbsd postgresql-client
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build
COPY startup.sh /opt/startup.sh
RUN chmod +x /opt/startup.sh && sed -i 's/\r//g' /opt/startup.sh
EXPOSE 8082
CMD ["/opt/startup.sh"]

# ── Stage 4: Production ───────────────────────────────────────────────────────
FROM node:20-alpine AS production
WORKDIR /app

RUN addgroup -g 1001 -S nestjs && \
    adduser -S nestjs -u 1001

COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json .

USER nestjs

EXPOSE 8082

CMD ["node", "dist/main"]
