# Docker build

**requirements**
generate access token with api read rights (`read_api` scopde) and export into env variables `GITLAB_USER` and `GITLAB_ACCESS_TOKEN`.    
Use gitlab personal page to create the token: https://gitlab.com/-/profile/personal_access_tokens.   
Your `GITLAB_USER` is the user without the `@` or alternatively the name of the token you created.

```sh
echo GITLAB_USER=your_gitlab_user >> $HOME/.bashrc 
echo GITLAB_ACCESS_TOKEN=your_gitlab_password >> $HOME/.bashrc
source $HOME/.bashrc
```

** Build monitoring.dockerfile
```sh
docker build -f monitoring.dockerfile -t pocr-mon . 
```

** If you want to keep your blockchain running in the background, use

```go
// to launch your docker-compose in background
docker-compose  -f  docker-compose.dev.yml up -d
```

And then open portainer in your browser http://localhost:9000
At first, initiate Portainer with a login password
You would then have the possibility to view your 3 nodes logs in real time directly in your browser, including possible monitoring services you would add in your network through the docker-compose.

Logs are refreshed auomatically. Your network will be correclty mining if you see the logs
```
INFO [04-04|15:38:08.002] Commit new sealing work                  number=141 sealhash=f2a191..478cdb uncles=0 txs=0 gas=0 fees=0 elapsed="294.288µs"
INFO [04-04|15:38:08.002] Carbon footprint nb nodes                result=0000000000000000000000000000000000000000000000000000000000000000
INFO [04-04|15:38:08.002] No reward for signer                     node=0x6E45c195E12D7FE5e02059F15d59c2c976A9b730 error="no node in PoCR smart contract"
```

** Start the network

For developers
First, remove all previous packages
```sh
docker-compose down
docker rmi -f $(docker images -aq)
```

```sh
docker-compose -f  docker-compose.dev.yml up
```

** If the sources changes build all dockerfiles using
```sh
docker-compose build
```
