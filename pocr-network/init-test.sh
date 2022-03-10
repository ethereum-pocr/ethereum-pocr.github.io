DATADIR=/node/data
GENESIS=/node/genesis/saturn-testnet.json

rm -Rf $DATADIR

GETH=geth-pocr

$GETH --datadir $DATADIR init $GENESIS
