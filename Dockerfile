# Multi-stage build: Node is only needed to compile the app, the final image is just Nginx + static files.

# ---- build stage ----
FROM node:22-alpine AS build
WORKDIR /app
# Copy manifests first so `npm ci` is cached until dependencies change.
COPY package*.json ./
RUN npm ci
COPY . .
# Tests run during the image build: a failing test means no image.
RUN npm test && npm run build

# ---- runtime stage ----
FROM nginx:1.27-alpine
# Default upstream = API published on the Docker host. Override with -e API_UPSTREAM=...
ENV API_UPSTREAM=http://host.docker.internal:7013
# The official nginx image runs envsubst over /etc/nginx/templates/*.template at start-up
# and writes the result to /etc/nginx/conf.d/, which is how API_UPSTREAM reaches the config.
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://localhost/ >/dev/null || exit 1
