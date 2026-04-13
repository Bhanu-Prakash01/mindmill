FROM node:18-alpine

WORKDIR /app

RUN apk add --no-cache dumb-init

COPY package*.json ./

RUN npm ci --only=production && npm cache clean --force

COPY . .

RUN mkdir -p uploads && chown -R node:node /app

USER node

EXPOSE 5005

ENV NODE_ENV=production

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5005/health || exit 1

ENTRYPOINT ["dumb-init", "--"]

CMD ["node", "server.js"]
