FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci --no-audit --progress=false --ignore-scripts || npm install --ignore-scripts

COPY . .

RUN npx prisma generate || true

EXPOSE 3000

CMD ["npm", "run", "dev"]
