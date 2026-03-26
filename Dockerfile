FROM node:20-alpine

WORKDIR /app

# Build tools required to compile better-sqlite3 (native Node module)
RUN apk add --no-cache python3 make g++

# Install dependencies first (cached layer)
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# Ensure SQLite data directory exists
RUN mkdir -p /app/data

ENV NODE_ENV=production

# Railway injects PORT at runtime — do not hardcode it here
EXPOSE 3000

CMD sh -c "node_modules/.bin/next start -p $PORT"
