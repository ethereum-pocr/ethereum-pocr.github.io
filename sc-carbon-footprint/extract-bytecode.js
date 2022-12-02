const {bytecode} = require('./extract-bytecode-lib');

const POCRContractNameActual = process.env.POCR_CONTRACT_NAME || "Governance"; 

bytecode(POCRContractNameActual)
.then(console.log);