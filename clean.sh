rm -Rf node1/geth
rm -Rf node2/geth

geth --datadir ./node1 --keystore ./keystore init ./genesis/saturndev.json
geth --datadir ./node2 --keystore ./keystore init ./genesis/saturndev.json
