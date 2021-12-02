DATADIR=/node/data
GENESIS=/node/genesis/saturn-test.json

rm -Rf $DATADIR

geth --datadir $DATADIR init $GENESIS
