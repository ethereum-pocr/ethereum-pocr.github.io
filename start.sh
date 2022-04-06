#!/bin/bash

apps="portainer"

for a in "$@"; 
do 
    if [[ "$a" == *"network"* ]] || [[ "$a" == "all" ]]; then
        apps="$apps geth-bootnode sealer-1 sealer-2 sealer-3"
    elif [[ "$a" == *"network"* ]] || [[ "$a" == "all" ]]; then
        apps="$apps geth-bootnode sealer-1 sealer-2 sealer-3"
    elif [[ "$a" == *"monitoring"* ]] || [[ "$a" == "all" ]]; then
        apps="$apps pocr-monitoring lite-explorer monitor dashboard"
    elif [[ "$a" == *"lb"* ]] || [[ "$a" == "all" ]]; then
        apps="$apps reverse-proxy"
    elif [[ "$a" == *"-d"* ]]; then
        apps="$apps -d"
    fi
done


echo "docker-compose up --no-deps --build $apps"
docker-compose up --no-deps --build $apps