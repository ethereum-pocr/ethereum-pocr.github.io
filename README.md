# PoCR network

Prototyping the network of nodes and the Proof of Carbon Reduction consensus

## Nodes

* https://saturn-pocr-1.uksouth.cloudapp.azure.com

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
   - edit `/etc/nginx/site-enabled/default` to add in the https section the inclusion of the geth locations
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
copy -R pocr-network/genesis .
copy -R pocr-network/keystore .
```

**If it is the first node**:

run the genesis init
```sh
./pocr-network/init-test.sh
```
Launch the node for the initial sealer
```sh
./pocr-network/start-first-node.sh
```