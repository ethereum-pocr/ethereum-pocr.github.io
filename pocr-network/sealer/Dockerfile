FROM ubuntu:jammy as base

RUN apt-get update \
  && apt-get install -y curl  \
  && rm -rf /var/lib/apt/lists/*

ARG GITLAB_USER
ARG GITLAB_ACCESS_TOKEN
WORKDIR /root

COPY entrypoint.sh /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]

EXPOSE 8545
EXPOSE 8546
EXPOSE 30303

FROM base as dev

COPY geth /usr/bin/geth
RUN chmod +x /usr/bin/geth

FROM base as runtime 

ARG GITLAB_USER
ARG GITLAB_ACCESS_TOKEN
ARG kerleano_version=dev
#ARG genesis_filename=kerleano.json
ARG genesis_filename=local.json
ARG geth_version=latest

RUN curl -f -u "${GITLAB_USER}:${GITLAB_ACCESS_TOKEN}" -o /root/genesis.json \
    https://gitlab.com/api/v4/projects/34381428/packages/generic/genesis/${kerleano_version}/${genesis_filename}

RUN curl -f -u "${GITLAB_USER}:${GITLAB_ACCESS_TOKEN}" -o "geth-pocr" \
    https://gitlab.com/api/v4/projects/34464473/packages/generic/geth/${geth_version}/geth && \
    chmod +x geth-pocr && mv geth-pocr /usr/bin/geth


