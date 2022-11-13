BOOTNODEKEY=$(bootnode -writeaddress -nodekey ./bootnode/key)
BOOTNODE=enode://$BOOTNODEKEY@127.0.0.1:30390

GETH=/Users/guenole/VSCode/saturn/github/go-ethereum/build/bin/geth 
$GETH version

NAME="Dev Node 3"
COINBASE=0xcda0bd40e7325f519f31bb3f31f68bc7d4c78903
AUDITOR=0x3d0a5f7514906c02178c6ce5c4ec33256f08ce58
HTTP_PORT=8504
WS_PORT=8404
APIS=admin,personal,eth,net,web3,txpool,miner,clique
PORT=30313
DATADIR=./node3

CMD="$GETH --verbosity=3 --datadir $DATADIR --keystore ./keystore --syncmode full --port $PORT --nat extip:127.0.0.1 --discovery.port $PORT --http --http.addr localhost --http.corsdomain=* --http.port $HTTP_PORT --http.api $APIS --ws --ws.port $WS_PORT --ws.api $APIS --authrpc.port 0 --bootnodes $BOOTNODE --networkid 1804 --miner.gasprice 1000000000 --allow-insecure-unlock -unlock $COINBASE,$AUDITOR --password ./keystore/password.txt --miner.etherbase $COINBASE --mine"

echo $CMD

$CMD --miner.extradata="$NAME"

