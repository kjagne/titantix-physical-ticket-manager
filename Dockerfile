# Dockerfile for Titantix Physical Ticket Manager
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Build frontend
RUN npm run build

# Expose port
EXPOSE 8080

# Set environment
ENV NODE_ENV=production
ENV PORT=8080

# Start server
CMD ["node", "server.js"]
