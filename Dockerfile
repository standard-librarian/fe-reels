FROM node:22-alpine AS base

# --- Dependencies ---
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# --- Build ---
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Reels API
ENV VITE_API_BASE_URL=https://staging-services.q84sale.com

# Favorites API (TEST ONLY)
ENV VITE_FAVORITES_API_URL=https://staging-services.q84sale.com/live/index.php
ENV VITE_FAVORITES_API_SECRET=403926033d001b5279df37cbbe5287b7c7c267fa
ENV VITE_FAVORITES_DEVICE_ID=web_user_57f1e6b9-f39e-4fe8-b4e9-9e293ced818f
ENV VITE_FAVORITES_TOKEN=2028376\|VlLqX8V1CnzppQXv0h7wZcWjkwpnzgxXWDczVBkJ
ENV VITE_REELS_USER_ID=1713502

RUN npm run build

# --- Production ---
FROM nginx:alpine AS runner

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]