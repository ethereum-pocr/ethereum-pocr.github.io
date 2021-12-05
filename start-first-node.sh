ENODE_URLS="https://saturn-pocr-1.uksouth.cloudapp.azure.com/enode https://saturn-pocr-2.swedencentral.cloudapp.azure.com/enode https://saturn-pocr-3.francecentral.cloudapp.azure.com/enode"

BOOTNODES=""
for url in $ENODE_URLS
do
echo "look for $url"
  BOOTNODES="$(curl -s $url),$BOOTNODES"
done

COINBASE=0x6e45c195e12d7fe5e02059f15d59c2c976a9b730

DATADIR=/node/data
KEYSTORE=/node/keystore
NET_ID=1974
GETH=geth-pocr
EXT_API='eth,net,web3'
# ipc is enabling all the below by default, no need
INT_API=$EXT_API,admin,personal,txpool,clique


nohup $GETH --datadir $DATADIR --keystore $KEYSTORE --syncmode 'full' --port 30303 --http --http.addr '0.0.0.0' --http.corsdomain "*" --http.port 8545  --http.vhosts=* --http.api $EXT_API --ws --ws.port 8546 --ws.origins=* --networkid $NET_ID --miner.gasprice '1000000000' --bootnodes $BOOTNODES  --allow-insecure-unlock -unlock $COINBASE --password $KEYSTORE/password.txt --mine 2>&1 >> /node/geth.log &

