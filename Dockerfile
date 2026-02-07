# Cache bust: v3
FROM node:20-alpine

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

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

# Expose port
EXPOSE 5050

# Start the server
CMD ["node", "dist/index.js"]
