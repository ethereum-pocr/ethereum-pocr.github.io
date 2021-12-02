# BOOTNODEKEY=$(bootnode -writeaddress -nodekey ./bootnode/key)
# BOOTNODE=enode://$BOOTNODEKEY@127.0.0.1:30390
COINBASE=0x6e45c195e12d7fe5e02059f15d59c2c976a9b730

DATADIR=/node/data
KEYSTORE=/node/keystore
NET_ID=1974
GETH=geth-pocr
EXT_API='eth,net,web3,clique'
INT_API=$EXT_API,admin,personal,txpool


$GETH --datadir $DATADIR --keystore $KEYSTORE --syncmode 'full' --port 30303 --http --http.addr '0.0.0.0' --http.corsdomain "*" --http.port 8545  --http.vhosts=* --http.api $EXT_API --ws --ws.port 8546 --networkid $NET_ID --miner.gasprice '1000000000' --allow-insecure-unlock -unlock $COINBASE --password $KEYSTORE/password.txt --mine

