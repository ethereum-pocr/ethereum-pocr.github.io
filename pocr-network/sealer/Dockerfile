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
RUN curl -f -u "${GITLAB_USER}:${GITLAB_ACCESS_TOKEN}" -o "geth-pocr" https://gitlab.com/api/v4/projects/34464473/packages/generic/geth/latest/geth
RUN chmod +x geth-pocr && mv geth-pocr /usr/bin/geth


