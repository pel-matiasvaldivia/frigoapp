# ── Stage 1: Build React SPA ──────────────────────────────────────────────────
FROM node:18-alpine AS builder

WORKDIR /app

# Copy only manifests first to leverage Docker layer cache
COPY package.json package-lock.json* ./

# Install ONLY production deps, skip audit/fund output
RUN npm install

# Copy source and build
COPY . .
RUN npm run build


# ── Stage 2: Serve with minimal Nginx ─────────────────────────────────────────
FROM nginx:1.25-alpine AS runtime

# Remove default nginx config and default static files
RUN rm -rf /usr/share/nginx/html/* /etc/nginx/conf.d/default.conf

# Copy custom SPA nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
