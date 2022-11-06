BOOTNODEKEY=$(bootnode -writeaddress -nodekey ./bootnode/key)
BOOTNODE=enode://$BOOTNODEKEY@127.0.0.1:30390

GETH=/Users/guenole/VSCode/saturn/github/go-ethereum/build/bin/geth 
$GETH version

COINBASE=0x926ed993bf6a57306a7dc5ef2f6c2053da42f85c
AUDITOR=0x3d0a5f7514906c02178c6ce5c4ec33256f08ce58
HTTP_PORT=8503
WS_PORT=8403
APIS=admin,personal,eth,net,web3,txpool,miner,clique
PORT=30312
DATADIR=./node2

CMD="$GETH --verbosity=3 --datadir $DATADIR --keystore ./keystore --syncmode full --port $PORT --nat extip:127.0.0.1 --discovery.port $PORT --http --http.addr localhost --http.corsdomain=* --http.port $HTTP_PORT --http.api $APIS --ws --ws.port $WS_PORT --ws.api $APIS --authrpc.port 0 --bootnodes $BOOTNODE --networkid 1804 --miner.gasprice 1000000000 --allow-insecure-unlock -unlock $COINBASE,$AUDITOR --password ./keystore/password.txt --miner.etherbase $COINBASE --mine"

echo $CMD

$CMD

