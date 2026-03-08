FROM node:18-alpine

# Install Firefox for web-ext runner
RUN apk add --no-cache firefox

WORKDIR /app

COPY app/package*.json ./

RUN npm install

COPY app . 

RUN npm run build

CMD ["npm", "run", "dev"]