# PoCR network

Prototyping the network of nodes and the Proof of Carbon Reduction consensus

## Nodes

* https://saturn-pocr-1.uksouth.cloudapp.azure.com (sealer :`0x6e45c195e12d7fe5e02059f15d59c2c976a9b730`)
* https://saturn-pocr-2.swedencentral.cloudapp.azure.com (sealer :`0x77fbd81ab0eed10e714b17581663d05c3db1b786`)
* https://saturn-pocr-3.francecentral.cloudapp.azure.com (sealer :`0x256c87a76bae45ed389001dd40030c5c054ca1c0`)

## Explorer
Before being able to use a better explorer let's start with the available online explorer
* https://expedition.dev/?rpcUrl=https://saturn-pocr-3.francecentral.cloudapp.azure.com/rpc
The `rpcUrl` param can be set to any node
* http://pocr-testnet-9e4666.westeurope.cloudapp.azure.com/network
A azure auto deployed version of the [Epirus proposal](https://github.com/web3labs/epirus-free). Has some flaws

Other options would be
- alethio/ethereum-lite-explorer
```sh
docker run --rm -p 8080:80 -e APP_NODE_URL=https://saturn-pocr-2.swedencentral.cloudapp.azure.com/rpc alethio/ethereum-lite-explorer
```

- https://docs.blockscout.com/
Will need to be deployed...

None of these are ideal, in particular in the context of the Proof of Carbon Reduction. The block miner/sealer is often not correctly represented because in Clique the miner field is used for managing the new nodes votes. The actual miner/sealer is actually hidden in its signature that is the last 65bits of the extraData field. Also, We will need to monitor and visualize the node earning and that is very specific to the PoCR consensus.

## Interacting with the Proof of Carbon Reduction Smart Contract
The smart contract is embeded in the genesis block at address `0x0000000000000000000000000000000000000100` and a autogenerated DApp has been produced using the oneclickdapp offer and is available at https://oneclickdapp.com/mimic-annual.

To use it, connect with Metamask of other wallet solution compatible.

## Initialize VM in cloud
Assumption of a IaaS approach to be as independant as possible from the cloud providers specificities

- Span a ubuntu Vm in your cloud provider (here we are using a 1CPU 1Go Mem)

- connect to the main user via ssh (here `vmadmin`)

- create a user for running the node: `geth`
```sh
sudo useradd geth -U --home-dir /node --create-home
```

- install nginx to relay the json rpc access to the node
```sh
sudo apt update
sudo apt install -y apt-transport-https ca-certificates curl software-properties-common
sudo apt install -y nginx
sudo systemctl status nginx
```
Open the firewall of your VM to allow http and https protocols.    
Test by opening the http site to see if nginx is running

- install certbot to get a let's encrypt certificate (in prod a real certificate is needed)
```sh
sudo snap install core; sudo snap refresh core
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot
```

- setup the certificate with let's encrypt
```sh
sudo certbot --nginx
```
Then follow instructions

- configure nginx reverse proxy rules to reach the json rpc interface of geth
   - edit `/etc/nginx/sites-enabled/default` to add in the https section the inclusion of the geth locations
```
    server {

        # SSL configuration
        
        root /var/www/html;

        # Add index.php to the list if you are using PHP
        index index.html index.htm index.nginx-debian.html;
    server_name saturn-pocr-1.uksouth.cloudapp.azure.com; # managed by Certbot


        location / {
                # First attempt to serve request as file, then
                # as directory, then fall back to displaying a 404.
                try_files $uri $uri/ =404;
        }

        include snippets/geth-locations.conf;  # <== Add this line

    listen [::]:443 ssl ipv6only=on; # managed by Certbot
    listen 443 ssl; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/saturn-pocr-1.uksouth.cloudapp.azure.com/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/saturn-pocr-1.uksouth.cloudapp.azure.com/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot

}
```
   - Create the `/etc/nginx/snippets/geth-locations.conf` file as follow
```
  location ^~ /ws {
      proxy_http_version 1.1;
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection "upgrade";
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header Host $http_host;
      proxy_set_header X-NginX-Proxy true;
      proxy_pass   http://127.0.0.1:8546/;
  }

  location ^~ /rpc {
      proxy_http_version 1.1;
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection "upgrade";
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header Host $http_host;
      proxy_set_header X-NginX-Proxy true;
      proxy_pass    http://127.0.0.1:8545/;
  }

```
Save and test the configuration with `nginx -t` or `nginx -T` to also display the conf.    
If ok, restart nginx: `nginx -s reload` 

- Install geth and tools from the standard repo (we will install our customized version after)
```sh
sudo apt-get install software-properties-common
sudo add-apt-repository -y ppa:ethereum/ethereum
sudo apt-get update
sudo apt-get install ethereum
geth version # to test install is ok
```

- download the `geth` customized version with PoCR consensus
```sh
curl --user "download:xfcAusGvj11o1v_dVAgy" -o "geth-pocr" "https://gitlab.com/api/v4/projects/31761764/packages/generic/geth/latest/geth"
``` 

- make it executable and place it in a bin folder
```sh
chmod +x ./geth-pocr
sudo mv ./geth-pocr /usr/local/bin
```

## Notes on the genesis file

* local chain ID for dev: 1804
* testnet chain ID: 1974
* production chain ID : 2606

Block period set to 4 seconds for the moment

Initial sealer who can invite the others (in the extraData): `0x6e45c195e12d7fe5e02059f15d59c2c976a9b730` with the wallet file present in the `keystore` folder and an empty password

Initial crypto generated to start the process: 1CTC provided to a single account `0xcda0bd40e7325f519f31bb3f31f68bc7d4c78903` with the wallet file present in the `keystore` folder and the password being `pocr`

## Run a new node
Connect as `geth` user
Clone this repo in your node to get the necessary files
```sh
cd /node
git clone https://gitlab.com/saturnproject/prototype/pocr-network.git
cp -R pocr-network/genesis .

```

**If it is the first node**:

run the genesis init
```sh
./pocr-network/init-test.sh
```
Launch the node for the initial sealer
```sh
cp -R pocr-network/keystore .
./pocr-network/start-first-node.sh
```
Create the `enode://` url of this new node to be used as a bootnode by the others
```sh
# as root on the VM
cd /var/www/html
/node/pocs-network/enode.sh > enode
```
Then from outside the vm you could curl the enode `curl https://host.name.com/enode`

**For subsequent nodes**:

run the genesis init
```sh
./pocr-network/init-test.sh
```

generate a new account
```sh
geth account new --keystore keystore
# then set a password twice
# then set the password in a file to keep it (not for production!)
echo "your password" > keystore/password.txt 
```

Run the node
```sh
./pocr-network/start-other-node.sh
```
The node should start synchronizing

Declare your node to the network: request N/2+1 nodes to execute from their node a console command:    
They should connect to their node console directly on the node in ipc as follow.
```sh
# replace the address by your new account address
geth attach --exec 'clique.propose("0x77fbd81ab0eed10e714b17581663d05c3db1b786", true)' /node/data/geth.ipc
```

If you don't need the node to mine, but just sync, 
- do not create the account
- do not request the other node to accept your node
- remove the `--mine` from the shell start file 
