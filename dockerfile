# Dockerfile

FROM node:alpine AS deps

RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json .npmrc ./
RUN npm install --production

FROM node:alpine AS builder
WORKDIR /app

ENV NEXT_PUBLIC_GOOGLE_ANALYTICS='G-WH1PW1XWZ4'

COPY . .
COPY --from=deps /app/node_modules ./node_modules
RUN npm run build && npm prune --production

FROM node:alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV HOSTNAME 0.0.0.0

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
# COPY --from=builder /app/next.config.js ./
# COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
# COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/server.js ./server.js

USER nextjs

EXPOSE 3000

CMD npm run start
