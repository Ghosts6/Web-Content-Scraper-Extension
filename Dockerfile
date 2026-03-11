FROM node:18-alpine

# Install Firefox for web-ext runner
RUN apk add --no-cache firefox

WORKDIR /app

COPY app/package*.json ./

RUN npm install

COPY app . 

ARG TARGET_BROWSER
RUN if [ -z "$TARGET_BROWSER" ]; then \
      npm run build; \
    else \
      npm run build:$TARGET_BROWSER; \
    fi

CMD if [ -z "$TARGET_BROWSER" ]; then \
      npm run dev; \
    else \
      npm run dev:$TARGET_BROWSER; \
    fi