
NODES="node1 node2 node3"
CURDIR=`pwd`
# GENESIS=$CURDIR/genesis/saturndev-sealer1-authorized.json
GENESIS=$CURDIR/genesis/saturndev-all-sealers-authorized.json

# force recompile the smart contracts and inject into the genesis
cd ../sc-carbon-footprint
source ./build.sh

export SEALERS="0x6e45c195e12d7fe5e02059f15d59c2c976a9b730 0x926ed993bf6a57306a7dc5ef2f6c2053da42f85c 0xcda0bd40e7325f519f31bb3f31f68bc7d4c78903"
node prepare-genesis.js $GENESIS

GETH=/Users/guenole/VSCode/saturn/github/go-ethereum/build/bin/geth 
$GETH version

cd $CURDIR

for node in $NODES
do
  DATADIR=./$node

  rm -Rf $DATADIR

  $GETH --datadir $DATADIR init $GENESIS
done

