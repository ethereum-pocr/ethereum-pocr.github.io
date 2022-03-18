FROM node:16.8 as builder

WORKDIR /app
COPY . /app
ENV NODE_OPTIONS=--openssl-legacy-provider

RUN npm install --verbose && \
    npm install --save pocr-utils sc-carbon-footprint && \
    npm run build

FROM nginx:latest as runtime

COPY --from=builder /app/dist/* /usr/share/nginx/html/
