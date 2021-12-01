BOOTNODEKEY=$(bootnode -writeaddress -nodekey ./bootnode/key)
BOOTNODE=enode://$BOOTNODEKEY@127.0.0.1:30390
COINBASE=0x6e45c195e12d7fe5e02059f15d59c2c976a9b730

GETH=/Users/guenole/VSCode/saturn/go-ethereum/build/bin/geth 

$GETH --datadir ./node1 --keystore ./keystore --syncmode 'full' --port 30311 --http --http.addr '0.0.0.0' --http.corsdomain "*" --http.port 8502 --http.api 'admin,personal,eth,net,web3,txpool,miner,clique' --bootnodes $BOOTNODE --networkid 1804 --miner.gasprice '1000000000' --allow-insecure-unlock -unlock $COINBASE --password ./keystore/password.txt --mine

