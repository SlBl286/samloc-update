# Stage 1: Build the React frontend
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json ./
# Install dependencies to run the build
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Run the production backend server
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001

COPY package.json ./
# Install only production dependencies
RUN npm install --production

# Copy server code
COPY server/server.cjs ./server/
# Copy the built dist from the builder stage
COPY --from=builder /app/dist ./dist
# Copy sqlite_base64 template for fallback db initialization
COPY sqllite_base64 ./sqllite_base64

# Create data directory (which will be mounted as a volume)
RUN mkdir -p /data/samloc

EXPOSE 3001

CMD ["node", "server/server.cjs"]
