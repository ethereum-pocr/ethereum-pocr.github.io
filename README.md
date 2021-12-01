# PoCR network

Prototyping the network of nodes and the Proof of Carbon Reduction consensus

## Nodes

* https://saturn-pocr-1.uksouth.cloudapp.azure.com

## Initial VM setup in cloud
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
