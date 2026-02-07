# Cache bust: v4
FROM node:20-alpine

# Install OpenSSL for Prisma and tini for proper signal handling
RUN apk add --no-cache openssl tini

WORKDIR /app

# Copy package files
COPY node-backend/package*.json ./

# Install dependencies - skip postinstall scripts
RUN npm install --ignore-scripts

# Copy prisma schema and generate client
COPY node-backend/prisma ./prisma
RUN npx prisma generate

# Copy source code
COPY node-backend/src ./src
COPY node-backend/tsconfig.json ./
COPY node-backend/views ./views
COPY node-backend/public ./public

# Build TypeScript
RUN npx tsc

# Copy entrypoint script
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

# Use tini as PID 1 for proper signal handling
ENTRYPOINT ["/sbin/tini", "--"]

# Run entrypoint script
CMD ["/app/docker-entrypoint.sh"]
