FROM node:20-alpine

WORKDIR /app

# Copy package files and prisma schema first
COPY node-backend/package*.json ./
COPY node-backend/prisma ./prisma

# Install dependencies (postinstall will now find prisma schema)
RUN npm install

# Copy source code
COPY node-backend/src ./src
COPY node-backend/tsconfig.json ./
COPY node-backend/views ./views
COPY node-backend/public ./public

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 5050

# Start the server
CMD ["node", "dist/index.js"]
