ENODE_URLS="https://saturn-pocr-1.uksouth.cloudapp.azure.com/enode https://saturn-pocr-2.swedencentral.cloudapp.azure.com/enode https://saturn-pocr-3.francecentral.cloudapp.azure.com/enode"

BOOTNODES=""
for url in $ENODE_URLS
do
echo "look for $url"
  BOOTNODES="$(curl -s $url),$BOOTNODES"
done

# by default will be the first created account 
# - ensure you have only one or change the #0 by the appropriate index
# - or replace the value by the account you want to use
COINBASE=$(geth account list --keystore ./keystore/ | grep "#0" | sed -nr 's/^.+\{(.+)\}.+$/\1/p')

DATADIR=/node/data
KEYSTORE=/node/keystore
NET_ID=1974
GETH=geth-pocr
EXT_API='eth,net,web3'
# ipc is enabling all the below by default, no need
INT_API=$EXT_API,admin,personal,txpool,clique
VANITY=$(uname -a |cut -c 1-32)


nohup $GETH --datadir $DATADIR --keystore $KEYSTORE --miner.extradata "$VANITY" --syncmode 'full' --port 30303 --http --http.addr '0.0.0.0' --http.corsdomain "*" --http.port 8545  --http.vhosts=* --http.api $EXT_API --ws --ws.port 8546 --ws.origins=* --networkid $NET_ID --miner.gasprice '1000000000' --bootnodes $BOOTNODES  --allow-insecure-unlock --password $KEYSTORE/password.txt --unlock $COINBASE --mine 2>&1 >> /node/geth.log &


