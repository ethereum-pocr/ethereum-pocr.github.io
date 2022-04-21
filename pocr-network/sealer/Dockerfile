FROM ubuntu:jammy as base

RUN apt-get update \
  && apt-get install -y curl  \
  && rm -rf /var/lib/apt/lists/*

RUN groupadd -g 1000 -o geth_group
RUN useradd -r -u 1000 -g geth_group geth_user
RUN mkdir /home/geth_user && chown -R geth_user:geth_group /home/geth_user
WORKDIR /home/geth_user

ARG GITLAB_USER
ARG GITLAB_ACCESS_TOKEN

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
ARG kerleano_version=latest
ARG geth_version=latest

RUN curl -f -u "${GITLAB_USER}:${GITLAB_ACCESS_TOKEN}" -o /home/geth_user/kerleano.json \
    https://gitlab.com/api/v4/projects/34381428/packages/generic/genesis/${kerleano_version}/kerleano.json

RUN curl -f -u "${GITLAB_USER}:${GITLAB_ACCESS_TOKEN}" -o /home/geth_user/local.json \
    https://gitlab.com/api/v4/projects/34381428/packages/generic/genesis/${kerleano_version}/local.json

RUN curl -f -u "${GITLAB_USER}:${GITLAB_ACCESS_TOKEN}" -o "geth-pocr" \
    https://gitlab.com/api/v4/projects/34464473/packages/generic/geth/${geth_version}/geth && \
    chmod +x geth-pocr && mv geth-pocr /usr/bin/geth

USER geth_user
