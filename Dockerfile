FROM node:22-slim AS web-builder
WORKDIR /app/web
COPY web/package*.json ./
RUN npm ci
COPY web/ ./
RUN npm run build

FROM node:22-slim
RUN apt-get update && apt-get install -y --no-install-recommends \
    iputils-ping net-tools iproute2 curl \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY dist/ ./dist/
COPY --from=web-builder /app/web/dist ./web/dist/
EXPOSE 3142
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD curl -f http://localhost:3142/ || exit 1
ENTRYPOINT ["node", "dist/index.js"]
CMD ["monitor", "--port", "3142", "--interval", "5"]
