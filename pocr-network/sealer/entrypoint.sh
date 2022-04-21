#!/bin/bash

echo $password > ~/.accountpassword

echo "########################### Start init geth node with using /home/geth_user/${genesisFileName:-local.json} #########################################"
geth init /home/geth_user/${genesisFileName:-local.json}
echo "################################### End init geth node with genesis block #################################################"

echo "#################################### Starting geth miner node #################################################"

BOOTNODE_OPTS=""
if [[ -n $bootnodeId ]] && [[ -n $bootnodeIp ]] && [[ -n $bootnodePort ]]
then 
    BOOTNODE_OPTS="--bootnodes enode://$bootnodeId@$bootnodeIp:$bootnodePort"
fi

echo "##################################### bootnode = $BOOTNODE_OPTS ##########################################"

geth $BOOTNODE_OPTS --networkid "$networkId" --verbosity ${verbosity:-1}  --http --http.corsdomain="*" --http.addr "0.0.0.0" --http.port 8545 --http.api "eth,web3,net,admin,debug,miner,personal" --http.corsdomain "*" --ws --ws.addr "0.0.0.0" --ws.port 8546 --ws.api "eth,web3,net,admin,debug,miner,personal" --ws.origins "*" --syncmode full --mine --miner.gasprice 1000000000 --miner.etherbase $address --unlock $address --password ~/.accountpassword --allow-insecure-unlock --keystore ${KEYSTORE_PATH:-/app/keystore}
