FROM node:16.8 as builder

# Build context is the repository root folder
# Install solidity compiler and put it in the path
RUN curl -L -o solc-file https://github.com/ethereum/solc-bin/raw/gh-pages/linux-amd64/list.txt && \
    curl -o solc -L https://github.com/ethereum/solc-bin/raw/gh-pages/linux-amd64/$(grep v0.8.17 solc-file)  && \
    chmod +x solc && \
    mv solc /bin/solc

# prepare folders
WORKDIR /app
COPY pocr-utils /app/pocr-utils
COPY sc-carbon-footprint /app/sc-carbon-footprint
COPY vue-auditor /app/vue-auditor

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
RUN cd vue-auditor && \
    npm ci && \
    npm run build

RUN cd vue-auditor 

FROM nginx:latest as runtime

# deploy the website into the target nginx
COPY --from=builder /app/vue-auditor/dist/ /usr/share/nginx/html/
