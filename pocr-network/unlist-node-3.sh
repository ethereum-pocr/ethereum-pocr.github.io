#!/bin/bash
VALUE=${1:-false}

GETH=/Users/guenole/VSCode/saturn/github/go-ethereum/build/bin/geth 
$GETH version

NODE1_IPC=node1/geth.ipc
NODE2_IPC=node2/geth.ipc

NODE3_ADDRESS=0xcda0bd40e7325f519f31bb3f31f68bc7d4c78903

SCRIPT="clique.propose('$NODE3_ADDRESS', $VALUE)"

$GETH attach --exec "$SCRIPT" $NODE1_IPC
$GETH attach --exec "$SCRIPT" $NODE2_IPC