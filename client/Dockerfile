# Stage 1: Build the app
FROM node:20 AS builder

WORKDIR /app

# Install app dependencies
# Only copy lockfiles first to leverage Docker layer caching
COPY package.json package-lock.json* ./

RUN npm ci --force

# Copy the rest of the application source
COPY . .

# Build the Next.js app
RUN npm run build

# Stage 2: Run the app with a lightweight image
FROM node:20-slim AS runner

WORKDIR /app

# Copy only what's needed to run the built app
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.mjs ./next.config.mjs

RUN rm -rf tsconfig.json

ENV NODE_ENV=production
EXPOSE 3000

CMD ["npx", "next", "start"]