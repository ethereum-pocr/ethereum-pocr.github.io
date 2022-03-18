# FROM node:16.8 as builder

# WORKDIR /app
# COPY . /app

# RUN cd pocr-utils && \
#     npm install --verbose && \
#     npm run build 

# RUN cd sc-carbon-footprint && \
#     npm install --verbose && \
#     ./build.sh

# RUN npm install --verbose && \
#     npm run build

# FROM nginx:latest as runtime

# COPY --from=builder /app/dist/* /usr/share/nginx/html/

FROM nginx:latest as runtime

RUN mkdir /usr/share/nginx/html/pocr
COPY dist/ /usr/share/nginx/html/pocr/
COPY dist/ /usr/share/nginx/html/
