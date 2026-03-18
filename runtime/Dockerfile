# Фаза 1: Сборка
FROM node:20-alpine AS builder
WORKDIR /app

# Build-time configuration (do not bake secrets into Docker context)
ARG SUPABASE_URL
ARG SUPABASE_KEY
ARG SUPABASE_ANON_KEY_LEGACY
ENV VITE_SUPABASE_URL=$SUPABASE_URL
ENV VITE_SUPABASE_PUBLISHABLE_KEY=$SUPABASE_KEY
ENV VITE_SUPABASE_ANON_KEY_LEGACY=$SUPABASE_ANON_KEY_LEGACY

COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Фаза 2: Production
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY runtime/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
