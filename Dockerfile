FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --include=dev

COPY . .
RUN npm run build

# ---

FROM node:22-alpine AS runner

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev && npm install drizzle-orm postgres

COPY --from=builder /app/build ./build
COPY drizzle ./drizzle
COPY migrate.js ./migrate.js

ENV NODE_ENV=production
EXPOSE 3000

CMD ["sh", "-c", "node migrate.js && node build/index.js"]
