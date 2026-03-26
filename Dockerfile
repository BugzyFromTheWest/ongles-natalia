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
ENV PORT=3000

EXPOSE 3000

# Use shell form so $PORT variable is expanded at runtime by Railway
CMD node_modules/.bin/next start -p ${PORT}
