
# Docker build

** Build monitoring.dockerfile
---
```sh
docker build -f monitoring.dockerfile -t pocr-mon . 
```
---

# docker-compose.yml content

In the root of the `pocr-monorepo` folder there is a `docker-compose.yml` that bootstrap many services 

 * geth-bootnode: Used as discovery node for the blockchain and the `Dockerfile` of the service can be found at `pocr-network/bootnode/Dockerfile`

 * sealer-1,2,3: Those are 3 nodes that start `geth` client with `Proof Of Carbon Reduction` and the `Dockerfile`can be found at `pocr-network/sealer/Dockerfile`
 The `Dockerfile` uses `multistage` the default stage `runtime` will download the `geth` built priviously and available in the gitlab and the second stage `dev` is to get `geth` from local machine
 To use `dev` stage update in `.env` file the key `SEALER_TARGET` by `dev` instead of `runtime` and then copy your `geth` binary to `pocr-network/sealer/geth`

 * pocr-monitoring: frontend app that will monitor the network (local or remote) nodes and show the carbon footprint of each and the `CRC` rewards cumulated by each

 * lite-explorer: An opensource solution, to explorer the blocks of the blockchain

 * monitor and dahsboard: An opensource solution to start the ethstats monitor on the network


**.env file** 
This file is used by `docker-compose.yml` to read the default environment variables

**pocr-network/genesis directory**
Everytime the smartcontracts changes the CICD will build and publish 2 genesis files `kerleano.json`and `local.json`, the `sealer` download the genesis of the blockchain (check `pocr-network/sealer/Dockerfile` )  and then use `geth init` with the file downloaded to init the network before the start

**Deprecated**
This directory contains some genesis files used as example to bootstrap the blockchain locally.
Example:
 * `pocr-network/genesis/saturndev-sealer1-authorized.json`: init the network with only `sealer-1` as authorized node to seal blocks in the network
 * `pocr-network/genesis/saturndev-all-sealers-authorized.json`: init the network with all the 3 sealers authorized

You can start the local network with any `genesis` file you want by changing in `.env` file the path to genesis `MOUNT_GENESIS_FILE_PATH=<path_to_genesis_file>` and the network id `NETWORK_ID=<network_id_of_the_genesis>`


# Start/stop the stack

in the root folder there are `start.sh` and `stop.sh` scripts to start and stop the stack.

Those scripts use `docker-compose.yml` to start all or some specific services

By default start.sh will only start portainer if no arguments are passed to the script
---
```sh
./start.sh
```
---

If you want to start all the services (network, monitoring and lb) use `all` as argument
---
```sh
./start.sh all 
```
---

If you want to start just the network use `network` as argument
---
```sh
./start.sh network
```
---

If you want to start just the monitoring use `monitoring` as argument
---
```sh
./start.sh monitoring
```
---

You can also combine arguments if needed, like starting `network`services and `monitoring` services
---
```sh
./start.sh network monitoring
```
---

If you want to run process in background add `-d` option to the start command, example:
---
```sh
# start monitoring in background
./start.sh monitoring -d

# start network in background
./start.sh network -d
```
---

To stop the stack use 
---
```sh
./stop.sh
```
---

# Use the initialized CRC
The account `0x3D0a5f7514906c02178c6Ce5c4ec33256F08Ce58` is initialized with some CRC (6000 for now) in the genesis. To use it you have in the `pocr-network/keystore` folder the json wallet (which password is `password`) or the auditor private key.

# persistance

The `docker-compose` persiste the data of sealers by mounting the volumes to the host using the keys in `.env` file
`MOUNT_DATADIR_NODE_1=./pocr-network/data/node1/`
`MOUNT_DATADIR_NODE_2=./pocr-network/data/node2/`
`MOUNT_DATADIR_NODE_3=./pocr-network/data/node3/`

If you want to reset the blockchain then delete `/pocr-network/data` directory (`rm -rf /pocr-network/data/`)


# apps and access

When you start the stack you can access the diffrent services at the urls bellow:

* Pocr-monitoring: `http://localhost:8081/pocr/`

* ethstats: `http://localhost:8008`

* lite-explorer: `http://localhost:8800`

* rpc endpoints: `http://localhost:8541/`, `http://localhost:8543/` and `http://localhost:8545/`
    if you start the `reverse-proxy` nginx service `lb` you can use `http://localhost/rpc` as a loadbalance url to the 3 rpc endpoints
* ws endpoints: `ws://localhost:8542/`, `http://localhost:8544/` and `http://localhost:8546/`
    if you start the `reverse-proxy` nginx service `lb` you can use `ws://localhost/ws` as a loadbalance url to the 3 ws endpoints

* Portainer: accessible at the url `http://localhost:9000`
    At first, initiate Portainer with a login password
    You would then have the possibility to view your 3 nodes logs in real time directly in your browser, including possible monitoring services you would add in your network through the docker-compose.

    Logs are refreshed auomatically. Your network will be correclty mining if you see the logs
    ---
    ```
    INFO [04-04|15:38:08.002] Commit new sealing work                  number=141 sealhash=f2a191..478cdb uncles=0 txs=0 gas=0 fees=0 elapsed="294.288µs"
    INFO [04-04|15:38:08.002] Carbon footprint nb nodes                result=0000000000000000000000000000000000000000000000000000000000000000
    INFO [04-04|15:38:08.002] No reward for signer                     node=0x6E45c195E12D7FE5e02059F15d59c2c976A9b730 error="no node in PoCR smart contract"
    ```
---


