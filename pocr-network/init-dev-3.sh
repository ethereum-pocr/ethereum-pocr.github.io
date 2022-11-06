
NODES="node1 node2 node3"
CURDIR=`pwd`
# GENESIS=$CURDIR/genesis/saturndev-sealer1-authorized.json
GENESIS=$CURDIR/genesis/saturndev-all-sealers-authorized.json

# force recompile the smart contracts and inject into the genesis
cd ../sc-carbon-footprint
source ./build.sh
node inject-bytecode.js $GENESIS

GETH=/Users/guenole/VSCode/saturn/github/go-ethereum/build/bin/geth 
$GETH version

cd $CURDIR

for node in $NODES
do
  DATADIR=./$node

  rm -Rf $DATADIR

  $GETH --datadir $DATADIR init $GENESIS
done

