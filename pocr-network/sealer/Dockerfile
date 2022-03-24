FROM ubuntu:jammy
# FROM ubuntu:xenial

RUN apt-get update \
  && apt-get install -y curl  \
  && rm -rf /var/lib/apt/lists/*

RUN curl --user "download:xfcAusGvj11o1v_dVAgy" -o "geth-pocr" "https://gitlab.com/api/v4/projects/31761764/packages/generic/geth/latest/geth"
RUN chmod +x geth-pocr && mv geth-pocr /usr/bin/geth

WORKDIR /root

# RUN add-apt-repository -y ppa:ethereum/ethereum

# ARG binary
# RUN apt-get update \
#   && apt-get install -y ethereum

ENV address=""
ENV bootnodeId=""
ENV bootnodeIp=""

# RUN apt-get update && \
#     apt-get install -y build-essential

# COPY geth /usr/bin/geth-pocr
# RUN chmod +x /usr/bin/geth-pocr
COPY entrypoint.sh /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]

EXPOSE 8545
EXPOSE 8546
EXPOSE 30303
