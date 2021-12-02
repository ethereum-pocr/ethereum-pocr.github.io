DATADIR=/node/data
GENESIS=/node/genesis/saturn-testnet.json

rm -Rf $DATADIR

geth --datadir $DATADIR init $GENESIS
