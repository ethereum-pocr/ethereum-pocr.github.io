FROM ubuntu:jammy@sha256:62b95dd050572873dbe140d8c5ced653a02f08512585489ed8d7a6ef6ef7a727 as base

RUN apt-get update \
  && apt-get install -y curl  \
  && rm -rf /var/lib/apt/lists/*

RUN groupadd -g 1000 -o geth_group
RUN useradd -r -u 1000 -g geth_group geth_user
RUN mkdir /home/geth_user && chown -R geth_user:geth_group /home/geth_user
WORKDIR /home/geth_user

COPY entrypoint.sh /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]

EXPOSE 8545
EXPOSE 8546
EXPOSE 30303

FROM base as dev

COPY geth /usr/bin/geth
RUN chmod +x /usr/bin/geth

FROM base as runtime 

ARG kerleano_version=v1.0

RUN curl -f -L -o /home/geth_user/kerleano.json \
    https://github.com/ethereum-pocr/ethereum-pocr.github.io/releases/download/${kerleano_version}/kerleano.json

RUN curl -f -L -o /home/geth_user/local.json \
    https://github.com/ethereum-pocr/ethereum-pocr.github.io/releases/download/main/genesis-local.json

RUN curl -f -L -o "geth-pocr" \
    https://github.com/ethereum-pocr/go-ethereum/releases/download/master/geth && \
    chmod +x geth-pocr && mv geth-pocr /usr/bin/geth

USER geth_user