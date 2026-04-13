FROM node:18-alpine

WORKDIR /app

COPY app/package*.json ./

RUN npm install

COPY app . 

RUN npm run build:chrome

CMD npm run dev:chrome