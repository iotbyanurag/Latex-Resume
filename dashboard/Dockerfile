FROM node:20-alpine AS deps
ARG TARGETPLATFORM
LABEL stage=deps platform=${TARGETPLATFORM}
WORKDIR /app
COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

FROM node:20-alpine AS builder
ARG TARGETPLATFORM
LABEL stage=builder platform=${TARGETPLATFORM}
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
ARG TARGETPLATFORM
LABEL org.opencontainers.image.source="https://github.com/iotbyanurag/Latex-Resume" \
	org.opencontainers.image.description="Resume dashboard (platform=${TARGETPLATFORM})"
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.mjs ./next.config.mjs
COPY --from=builder /app/public ./public
COPY --from=builder /app/app ./app
COPY --from=builder /app/components ./components
COPY --from=builder /app/lib ./lib
COPY --from=builder /app/tailwind.config.ts ./tailwind.config.ts
COPY --from=builder /app/postcss.config.js ./postcss.config.js
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/.eslintrc.json ./.eslintrc.json
COPY --from=builder /app/.next ./.next
EXPOSE 3000
CMD ["npm", "run", "start"]
