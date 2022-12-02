const Web3 = require("web3");

const { Web3FunctionProvider } = require("@saturn-chain/web3-functions");

const Ganache = require("ganache-core");

const allContracts = require("./contracts");


async function bytecode(contractName) {
  const web3 = new Web3(Ganache.provider() );
  const intf = new Web3FunctionProvider(web3.currentProvider, (list) =>
    Promise.resolve(list[0])
  );
  if (allContracts.get(contractName)) {
    console.error("Processing contract", contractName);
    const POCR = allContracts.get(contractName);
    const instance = await POCR.deploy(intf.newi({ maxGas: 3000000 }));
    const code = await web3.eth.getCode(instance.deployedAt)
    return code;
  } else {
    throw new Error(contractName+" contract not defined in the compilation result");
  }

}

module.exports = {bytecode};