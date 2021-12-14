BOOTNODEKEY=$(bootnode -writeaddress -nodekey ./bootnode/key)
BOOTNODE=enode://$BOOTNODEKEY@127.0.0.1:30390

GETH=/Users/guenole/VSCode/saturn/go-ethereum/build/bin/geth 
$GETH version

COINBASE=0x926eD993bF6A57306a7dC5eF2f6C2053DA42F85C
HTTP_PORT=8503
PORT=30312
DATADIR=./node2


CMD="$GETH --datadir $DATADIR --keystore ./keystore --syncmode full --port $PORT --http --http.addr localhost --http.corsdomain=* --http.port $HTTP_PORT --http.api admin,personal,eth,net,web3,txpool,miner,clique --bootnodes $BOOTNODE --networkid 1804 --miner.gasprice 1000000000 --allow-insecure-unlock -unlock $COINBASE --miner.etherbase $COINBASE --password ./keystore/password.txt --mine"

echo $CMD

$CMD