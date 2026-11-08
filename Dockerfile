ARG NGINX_IMAGE=nginx:1.30.6-alpine
FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts --no-audit --no-fund

COPY . .
RUN npm run build

FROM ${NGINX_IMAGE} AS runtime

ARG APP_REVISION=uncommitted
LABEL org.opencontainers.image.title="Parallel Lines Toolbox" \
      org.opencontainers.image.source="https://github.com/ixiaoyy/parallel-lines-tools" \
      org.opencontainers.image.revision="${APP_REVISION}"

COPY --from=build /app/dist /usr/share/nginx/html
COPY deploy/nginx/default.conf /etc/nginx/conf.d/default.conf

RUN test -s /usr/share/nginx/html/index.html \
    && test -s /usr/share/nginx/html/THIRD_PARTY_NOTICES.txt \
    && test -s /usr/share/nginx/html/release-components.json \
    && test -s /usr/share/nginx/html/toolbox-source-local-20261109.zip

EXPOSE 80

HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -q -O /dev/null http://127.0.0.1/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
