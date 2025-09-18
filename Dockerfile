FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

COPY package.json package-lock.json* ./
RUN npm ci --only=production

COPY . .

EXPOSE 4000

CMD ["node", "src/server.js"]
