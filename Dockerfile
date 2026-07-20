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

# Build-time config. These MUST be declared as ARG: docker silently discards a
# --build-arg that has no matching ARG, so without these the values passed by
# .github/workflows/deploy.yml never reach the build and the defaults below win.
# Vite inlines import.meta.env at build time, so they have to be present here
# rather than at container runtime.

# Reels API. Empty = same origin (production serves the API from its own host).
ARG VITE_API_BASE_URL=""
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Main 4Sale website — "View listing" / "Log in" / chat hand-off links.
ARG VITE_WEB_BASE_URL="https://www.q84sale.com"
ENV VITE_WEB_BASE_URL=$VITE_WEB_BASE_URL

# Favorites API (TEST ONLY)
ARG VITE_FAVORITES_API_URL=https://staging-services.q84sale.com/live/index.php
ENV VITE_FAVORITES_API_URL=$VITE_FAVORITES_API_URL
ARG VITE_FAVORITES_API_SECRET=403926033d001b5279df37cbbe5287b7c7c267fa
ENV VITE_FAVORITES_API_SECRET=$VITE_FAVORITES_API_SECRET
ARG VITE_FAVORITES_DEVICE_ID=web_user_57f1e6b9-f39e-4fe8-b4e9-9e293ced818f
ENV VITE_FAVORITES_DEVICE_ID=$VITE_FAVORITES_DEVICE_ID
ARG VITE_FAVORITES_TOKEN=2028376\|VlLqX8V1CnzppQXv0h7wZcWjkwpnzgxXWDczVBkJ
ENV VITE_FAVORITES_TOKEN=$VITE_FAVORITES_TOKEN
ARG VITE_REELS_USER_ID=1713502
ENV VITE_REELS_USER_ID=$VITE_REELS_USER_ID

RUN npm run build

# --- Production ---
FROM nginx:alpine AS runner

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]