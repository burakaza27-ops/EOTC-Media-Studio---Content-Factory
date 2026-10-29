FROM node:20-slim

WORKDIR /app

# Install dependencies needed for general Node.js operation
ENV NODE_ENV=production

# Copy package descriptors
COPY package*.json ./

# Install production dependencies
RUN npm install --omit=dev

# Copy source tree and templates
COPY src/ ./src/
COPY templates/ ./templates/
COPY assets/ ./assets/

# Health check port for cloud platforms
EXPOSE 3000
ENV PORT=3000

CMD ["node", "src/telegram/concierge.js"]
