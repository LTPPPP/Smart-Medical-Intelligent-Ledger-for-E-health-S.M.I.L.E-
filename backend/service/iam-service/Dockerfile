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
RUN apk add --no-cache bash

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun run build

COPY ./wait-for-it.sh /opt/wait-for-it.sh
COPY ./startup.sh /opt/startup.sh

RUN chmod +x /opt/wait-for-it.sh /opt/startup.sh && \
    sed -i 's/\r$//g' /opt/wait-for-it.sh /opt/startup.sh

EXPOSE 3001

CMD ["/opt/startup.sh"]

FROM oven/bun:1-alpine AS production
WORKDIR /app

COPY --from=deps --chown=bun:bun /app/node_modules ./node_modules
COPY --from=build --chown=bun:bun /app/dist ./dist
COPY --chown=bun:bun package.json bun.lock ./

# dist keeps the @auth/* and @/* path aliases; Bun resolves them at runtime
# from tsconfig.json, so map them onto dist/ (src/ is not shipped).
RUN printf '{"compilerOptions":{"baseUrl":".","paths":{"@auth/*":["dist/*"],"@/*":["dist/*"]}}}' > tsconfig.json && \
    chown bun:bun tsconfig.json

USER bun

EXPOSE 3001

CMD ["bun", "run", "dist/main.js"]