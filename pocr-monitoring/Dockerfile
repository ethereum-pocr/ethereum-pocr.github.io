FROM node:latest as builder

WORKDIR /app
COPY . /app
ENV NODE_OPTIONS=--openssl-legacy-provider

RUN npm install --verbose && npm run build

FROM nginx:latest as runtime

COPY --from=builder /app/dist/* /usr/share/nginx/html/
