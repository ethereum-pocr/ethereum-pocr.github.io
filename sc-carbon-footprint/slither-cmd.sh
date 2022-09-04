#!/bin/sh
# executed inside the docker image trailofbits/eth-security-toolbox
cd /share
solc-select use 0.8.13
rm sc-bonds-results.sarif
slither --solc-args='--optimize --base-path=. --include-path=./node_modules' --exclude-informational --exclude-optimization --sarif=sc-bonds-results.sarif /share/src/