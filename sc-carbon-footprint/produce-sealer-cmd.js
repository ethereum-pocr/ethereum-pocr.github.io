/**
 * This module is to be used by the sealer from an admin console 
 * with the dev stack installed (node + npm + git repo)
 * to generate eth command to be copy/paste into the sealer console.
 * 
 * Proceed as follow to allow/remove a sealer delegate
 * 1. On the dev console:
 * > node produce-sealer-cmd.js allowDelegate 0xd9e5e579cf3bf25cf9b9b7478eed7c54fc41f902 
 * > node produce-sealer-cmd.js removeDelegate 0xd9e5e579cf3bf25cf9b9b7478eed7c54fc41f902 
 * 2. Copy the output
 * 3. Go to the sealer machine geth console
 * > geth attach
 * 4. Paste the command
 * 
 */


const allContracts = require("./contracts");

const POCRContractNameActual = "Governance"; 


const governanceAddress = "0000000000000000000000000000000000000100";

async function collectDataFunction(target, data) {
  cmd = `eth.sendTransaction({from: eth.coinbase, to:"0x${target}", data:"${data}"})`
  console.log(cmd)
  return {isTx: true, result: "0x"}
}

async function produceCmdLine(method, address) {
  if ( !["allowDelegate", "removeDelegate"].includes(method)) {
    console.error("Not supported method",method)
    process.exit(1);
  }
  if (allContracts.get(POCRContractNameActual)) {
    const POCR = allContracts.get(POCRContractNameActual);
    const instance = await POCR.at(governanceAddress);
    instance[method](collectDataFunction, address)
  } else {
    throw new Error(POCRContractNameActual+" contract not defined in the compilation result");
  }

}

const address = process.argv.pop()
const method = process.argv.pop()
produceCmdLine(method, address)