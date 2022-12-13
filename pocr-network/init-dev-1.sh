
NODES="node1"
CURDIR=`pwd`
GENESIS_CONF=$CURDIR/genesis/local-conf.json
GENESIS=$CURDIR/genesis/saturndev-sealer1-authorized.json
COINBASE=0x6e45c195e12d7fe5e02059f15d59c2c976a9b730
# GENESIS=$CURDIR/genesis/saturndev-all-sealers-authorized.json

# force recompile the smart contracts and inject into the genesis
cd ../sc-carbon-footprint
source ./build.sh

export SEALERS="${COINBASE}"
node prepare-genesis.js $GENESIS_CONF > $GENESIS

GETH=/Users/guenole/VSCode/saturn/github/go-ethereum/build/bin/geth 
$GETH version

cd $CURDIR

for node in $NODES
do
  DATADIR=./$node

  rm -Rf $DATADIR

  $GETH --datadir $DATADIR init $GENESIS
done

