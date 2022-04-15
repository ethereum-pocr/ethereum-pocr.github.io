
NODES="node1 node2"
GENESIS=./genesis/saturndev.json
GETH=/Users/guenole/VSCode/saturn/go-ethereum/build/bin/geth 
$GETH version
for node in $NODES
do
  DATADIR=./$node

  rm -Rf $DATADIR

  $GETH --datadir $DATADIR init $GENESIS
done

