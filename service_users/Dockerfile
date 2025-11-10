FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npx prisma generate

RUN npx tsc

ENV NODE_ENV=production
EXPOSE 4001
CMD ["node", "dist/index.js"]
