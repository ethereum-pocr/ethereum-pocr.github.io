FROM ubuntu:jammy
# FROM ubuntu:xenial

RUN apt-get update \
  && apt-get install -y curl  \
  && rm -rf /var/lib/apt/lists/*

# RUN curl --user "download:xfcAusGvj11o1v_dVAgy" -o "geth-pocr" "https://gitlab.com/api/v4/projects/31761764/packages/generic/geth/latest/geth"

ARG GITLAB_USER
ARG GITLAB_ACCESS_TOKEN

RUN curl -f -u "${GITLAB_USER}:${GITLAB_ACCESS_TOKEN}" -o "geth-pocr" https://gitlab.com/api/v4/projects/34464473/packages/generic/geth/latest/geth
RUN chmod +x geth-pocr && mv geth-pocr /usr/bin/geth

WORKDIR /root

COPY entrypoint.sh /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]

EXPOSE 8545
EXPOSE 8546
EXPOSE 30303

