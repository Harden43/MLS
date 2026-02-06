FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY node-backend/package*.json ./

# Install dependencies
RUN npm install

# Copy prisma schema and generate client
COPY node-backend/prisma ./prisma
RUN npx prisma generate

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
