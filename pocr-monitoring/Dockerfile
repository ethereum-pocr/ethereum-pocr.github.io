FROM node:16.8 as builder

WORKDIR /app
COPY . /app

RUN cd pocr-utils &&  \
    npm ci --verbose && \
    ls -l && \
    npm run build 

RUN cd sc-carbon-footprint && \
    npm ci --verbose && \
    ./build.sh

RUN npm ci --verbose && \
    npm run build

FROM nginx:latest as runtime

COPY --from=builder /app/dist/* /usr/share/nginx/html/
COPY --from=builder /app/dist/* /usr/share/nginx/html/pocr/

RUN mkdir /usr/share/nginx/html/pocr/js && \
    mkdir /usr/share/nginx/html/pocr/css && \
    mkdir /usr/share/nginx/html/pocr/fonts

RUN cp /usr/share/nginx/html/pocr/*.js /usr/share/nginx/html/pocr/js/ && \
    cp /usr/share/nginx/html/pocr/*.map /usr/share/nginx/html/pocr/js/ && \
    cp /usr/share/nginx/html/pocr/*.css /usr/share/nginx/html/pocr/css/ && \
    cp /usr/share/nginx/html/pocr/*.woff /usr/share/nginx/html/pocr/fonts/ && \
    cp /usr/share/nginx/html/pocr/*.woff2 /usr/share/nginx/html/pocr/fonts/ && \
    cp /usr/share/nginx/html/pocr/*.ttf /usr/share/nginx/html/pocr/fonts/
