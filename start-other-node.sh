FIRST_NODE_ENODE_URL=https://saturn-pocr-1.uksouth.cloudapp.azure.com/enode
BOOTNODE=$(curl -s $FIRST_NODE_ENODE_URL)
# by default will be the first created account - ensure you have only one
COINBASE=$(geth account list --keystore ./keystore/ | grep "#0" | sed -nr 's/^.+\{(.+)\}.+$/\1/p')

DATADIR=/node/data
KEYSTORE=/node/keystore
NET_ID=1974
GETH=geth-pocr
EXT_API='eth,net,web3,clique'
INT_API=$EXT_API,admin,personal,txpool


nohup $GETH --datadir $DATADIR --keystore $KEYSTORE --syncmode 'full' --port 30303 --http --http.addr '0.0.0.0' --http.corsdomain "*" --http.port 8545  --http.vhosts=* --http.api $EXT_API --ws --ws.port 8546 --networkid $NET_ID --miner.gasprice '1000000000' --bootnodes $BOOTNODE  --allow-insecure-unlock --password $KEYSTORE/password.txt --unlock $COINBASE --mine 2>&1 >> /node/geth.log &


