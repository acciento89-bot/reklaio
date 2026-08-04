FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json ./
RUN npm install --omit=optional

FROM deps AS migrator
WORKDIR /app
COPY db ./db
COPY scripts ./scripts
CMD ["node", "scripts/migrate.mjs"]

FROM node:22-bookworm-slim AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000
RUN groupadd --system --gid 1001 nodejs && useradd --system --uid 1001 --gid nodejs nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/scripts/reminder-loop.mjs ./scripts/reminder-loop.mjs
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
