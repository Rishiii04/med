FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Build not needed for backend (no build step)

EXPOSE 3000

CMD ["node", "src/server.js"]