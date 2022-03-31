FROM node:16.8 as builder

# Install solidity compiler and put it in the path
RUN curl -L -o file https://github.com/ethereum/solc-bin/raw/gh-pages/linux-amd64/solc-linux-amd64-latest && \
    curl -o solc -L https://github.com/ethereum/solc-bin/raw/gh-pages/linux-amd64/$(cat file) && \
    chmod +x solc && \
    mv solc /bin/solc

# prepare folders
WORKDIR /app
COPY pocr-utils /app/pocr-utils
COPY sc-carbon-footprint /app/sc-carbon-footprint
COPY pocr-monitoring /app/pocr-monitoring

# build the pocr utilities
RUN cd pocr-utils &&  \
    rm -Rf build && \
    npm ci --verbose && \
    ls -l && \
    npm run build 

# build the genesis block smart contract
RUN cd sc-carbon-footprint && \
    npm ci --verbose && \
    ./build.sh

# build the web site
RUN cd pocr-monitoring && \
    npm ci && \
    npm run build

RUN cd pocr-monitoring && \
    mv dist pocr

FROM nginx:latest as runtime

# deploy the website into the target nginx
COPY --from=builder /app/pocr-monitoring/pocr /usr/share/nginx/html/pocr
