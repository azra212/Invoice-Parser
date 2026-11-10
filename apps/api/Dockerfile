FROM node:22-bookworm-slim

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps ./apps
COPY packages ./packages

RUN npm ci

ENV NODE_ENV=production
EXPOSE 3000

CMD ["npm", "run", "start", "-w", "@invoice-parser/api"]
