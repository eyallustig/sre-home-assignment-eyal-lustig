FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi

FROM node:20-alpine AS app
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY src ./src
RUN chown -R node:node /app
USER node
EXPOSE 3000
CMD ["node", "src/app.js"]
