const Web3 = require("web3");

const { Web3FunctionProvider } = require("@saturn-chain/web3-functions");

const Ganache = require("ganache-core");

const allContracts = require("./contracts");

const POCRContractNameActual = "Governance"; 




async function bytecode() {
  const web3 = new Web3(Ganache.provider() );
  const intf = new Web3FunctionProvider(web3.currentProvider, (list) =>
    Promise.resolve(list[0])
  );
  if (allContracts.get(POCRContractNameActual)) {
    const POCR = allContracts.get(POCRContractNameActual);
    const instance = await POCR.deploy(intf.newi({ maxGas: 3000000 }));
    const code = await web3.eth.getCode(instance.deployedAt)
    console.log(code)
  } else {
    throw new Error(POCRContractNameActual+" contract not defined in the compilation result");
  }

}

bytecode()