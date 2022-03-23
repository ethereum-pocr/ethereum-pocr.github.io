#!/bin/bash

set -x

cd /pocr-utils &&  \
    npm install --verbose && \
    npm run build 

cd /sc-carbon-footprint && \
    npm install --verbose && \
    ./build.sh

cd /app/ && \
    npm install --verbose && \
    npm run serve