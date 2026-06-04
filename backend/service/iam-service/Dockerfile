# Stage 1: deps
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts

# Stage 2: build
FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Stage 3: migrator (dev / startup with wait-for-it)
FROM node:20-alpine AS migrator
RUN apk add --no-cache bash
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build
COPY ./wait-for-it.sh /opt/wait-for-it.sh
COPY ./startup.sh /opt/startup.sh
RUN chmod +x /opt/wait-for-it.sh /opt/startup.sh && \
    sed -i 's/\r//g' /opt/wait-for-it.sh /opt/startup.sh
EXPOSE 3001
CMD ["/opt/startup.sh"]

# Stage 4: production
FROM node:20-alpine AS production
WORKDIR /app
RUN addgroup -g 1001 -S nestjs && adduser -S nestjs -u 1001
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json .
USER nestjs
EXPOSE 3001
CMD ["node", "dist/main"]
