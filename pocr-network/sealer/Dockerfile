# # FROM ubuntu:jammy
# FROM ubuntu:xenial

# RUN apt-get update \
#   && apt-get install -y wget software-properties-common \
#   && rm -rf /var/lib/apt/lists/*

# RUN add-apt-repository -y ppa:ethereum/ethereum

# ARG binary
# RUN apt-get update \
#   && apt-get install -y ethereum

# ENV address=""
# ENV bootnodeId=""
# ENV bootnodeIp=""

# RUN apt-get update && \
#     apt-get install -y build-essential

FROM testgeth

WORKDIR /root
COPY entrypoint.sh /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]

EXPOSE 8545
EXPOSE 8546
EXPOSE 30303

