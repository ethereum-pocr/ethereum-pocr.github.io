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

** Start the network

For developers
```sh
docker-compose -f  docker-compose.dev.yml up
```

** If the sources changes build all dockerfiles using
```sh
docker-compose build
```