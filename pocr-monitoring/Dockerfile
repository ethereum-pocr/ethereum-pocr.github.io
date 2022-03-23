# FROM node:16.8 as dev
FROM ubuntu:xenial as dev

WORKDIR /app

RUN apt-get update && \
    apt-get install gcc g++ make curl software-properties-common -y

RUN curl -sL https://deb.nodesource.com/setup_16.x -o /tmp/setup_nodejs && \
    chmod +x /tmp/setup_nodejs && /tmp/setup_nodejs && \
    apt-get install nodejs -y

RUN add-apt-repository ppa:ethereum/ethereum && \
    apt-get update && \
    apt-get install solc

COPY entrypoint.sh /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]

# RUN cd pocr-utils &&  \
#     npm ci --verbose && \
#     ls -l && \
#     npm run build 

# RUN cd sc-carbon-footprint && \
#     npm ci --verbose && \
#     ./build.sh

# RUN npm ci --verbose && \
#     npm run build

# FROM nginx:latest as runtime

# COPY --from=builder /app/dist/* /usr/share/nginx/html/
# COPY --from=builder /app/dist/* /usr/share/nginx/html/pocr/

# RUN mkdir /usr/share/nginx/html/pocr/js && \
#     mkdir /usr/share/nginx/html/pocr/css && \
#     mkdir /usr/share/nginx/html/pocr/fonts

# RUN cp /usr/share/nginx/html/pocr/*.js /usr/share/nginx/html/pocr/js/ && \
#     cp /usr/share/nginx/html/pocr/*.map /usr/share/nginx/html/pocr/js/ && \
#     cp /usr/share/nginx/html/pocr/*.css /usr/share/nginx/html/pocr/css/ && \
#     cp /usr/share/nginx/html/pocr/*.woff /usr/share/nginx/html/pocr/fonts/ && \
#     cp /usr/share/nginx/html/pocr/*.woff2 /usr/share/nginx/html/pocr/fonts/ && \
#     cp /usr/share/nginx/html/pocr/*.ttf /usr/share/nginx/html/pocr/fonts/
