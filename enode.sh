BOOTNODEKEY=$(bootnode -writeaddress -nodekey /node/data/geth/nodekey)
PUBLIC_IP=$(curl ifconfig.me/ip)
PORT=30303

echo "enode://$BOOTNODEKEY@$PUBLIC_IP:$PORT"