BOOTNODEKEY=$(bootnode -writeaddress -nodekey ./bootnode/key)
BOOTNODE=enode://$BOOTNODEKEY@127.0.0.1:30390
COINBASE=0x926eD993bF6A57306a7dC5eF2f6C2053DA42F85C

GETH=/Users/guenole/VSCode/saturn/go-ethereum/build/bin/geth 

$GETH --datadir ./node2 --keystore ./keystore --syncmode 'full' --port 30312 --http --http.addr '0.0.0.0' --http.corsdomain "*" --http.port 8503 --http.api 'admin,personal,eth,net,web3,txpool,miner,clique' --bootnodes $BOOTNODE --networkid 1804 --miner.gasprice '1000000000' --miner.etherbase $COINBASE --allow-insecure-unlock -unlock $COINBASE --password ./keystore/password.txt --mine

