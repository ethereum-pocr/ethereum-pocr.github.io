# Docker build

**requirements**
generate access token with api read rights and export into env variables `GITLAB_USER` and `GITLAB_ACCESS_TOKEN`

```sh
echo GITLAB_USER=your_gitlab_user >> $HOME/.bashrc 
echo GITLAB_ACCESS_TOKEN=your_gitlab_password >> $HOME/.bashrc
source $HOME/.bashrc
```

** Build monitoring.dockerfile
```sh
docker build -f monitoring.dockerfile -t pocr-mon . 
```

** Start the network
```sh
docker-compose up
```

** If the sources changes build all dockerfiles using
```sh
docker-compose build
```