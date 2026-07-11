FROM oven/bun:1-alpine AS deps
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

FROM oven/bun:1-alpine AS build
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun run build

FROM oven/bun:1-alpine AS migrator
RUN apk add --no-cache bash netcat-openbsd postgresql-client

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun run build

COPY startup.sh /opt/startup.sh
RUN chmod +x /opt/startup.sh && \
    sed -i 's/\r$//g' /opt/startup.sh

EXPOSE 8082

CMD ["/opt/startup.sh"]

FROM oven/bun:1-alpine AS production
WORKDIR /app

COPY --from=deps --chown=bun:bun /app/node_modules ./node_modules
COPY --from=build --chown=bun:bun /app/dist ./dist
COPY --chown=bun:bun package.json bun.lock ./

USER bun

EXPOSE 8082

CMD ["bun", "run", "dist/main.js"]