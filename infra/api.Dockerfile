# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package locks and configs
COPY package.json package-lock.json ./
COPY tsconfig.json ./

# Copy workspaces
COPY packages/ ./packages/
COPY apps/backend/ ./apps/backend/

# Install all dependencies and build workspaces
RUN npm ci
RUN npm run build

# Stage 2: Runner
FROM node:20-alpine AS runner
WORKDIR /app

COPY package.json package-lock.json ./
COPY tsconfig.json ./

# Copy compiled shared libraries and backend code
COPY --from=builder /app/packages/ ./packages/
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/backend/package.json ./apps/backend/package.json

# Install only production dependencies
RUN npm ci --omit=dev

EXPOSE 3000
CMD ["node", "apps/backend/dist/main"]
