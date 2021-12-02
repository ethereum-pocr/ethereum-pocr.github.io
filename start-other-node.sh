FIRST_NODE_ENODE_URL=https://saturn-pocr-1.uksouth.cloudapp.azure.com/enode
BOOTNODE=$(curl -s $FIRST_NODE_ENODE_URL)
#COINBASE=by default will be the first created account - ensure you have only one

DATADIR=/node/data
KEYSTORE=/node/keystore
NET_ID=1974
GETH=geth-pocr
EXT_API='eth,net,web3,clique'
INT_API=$EXT_API,admin,personal,txpool


$GETH --datadir $DATADIR --keystore $KEYSTORE --syncmode 'full' --port 30303 --http --http.addr '0.0.0.0' --http.corsdomain "*" --http.port 8545  --http.vhosts=* --http.api $EXT_API --ws --ws.port 8546 --networkid $NET_ID --miner.gasprice '1000000000' --bootnodes $BOOTNODE --mine

