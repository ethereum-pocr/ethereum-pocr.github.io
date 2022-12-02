#!/bin/bash

# initialize the 3 nodes
./init-dev-3.sh

# start bootnode
./bootnode.sh 0</dev/null 2>bootnode.log 1>bootnode.log &
BOOTNODE_PROCESS=$!

# start the 3 nodes
./start-node1.sh 2>node1/geth.log 1>node1/geth.log &
NODE1=$!
./start-node2.sh 2>node2/geth.log 1>node2/geth.log &
NODE2=$!
./start-node3.sh 2>node3/geth.log 1>node3/geth.log &
NODE3=$!

tail -f node1/geth.log &
echo "Press enter to stop the processes"
read 

echo "Terminating processes"

killall bootnode
killall geth