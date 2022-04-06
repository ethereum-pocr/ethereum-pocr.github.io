

const fs = require('fs');
const ganache = require("ganache");
const Web3 = require('web3');
const web3 = new Web3(ganache.provider());


async function bytecode () {

    const bytecode = fs.readFileSync('./bytecode/Governance.bin').toString()
    abi = JSON.parse(fs.readFileSync('./bytecode/Governance.abi').toString())
    const Contract = new web3.eth.Contract(abi)
    let addr = (await web3.eth.getAccounts())[0];
    addr = web3.utils.toChecksumAddress(addr);
    let code = 0;
    const instance = await Contract.deploy({data:bytecode}).send({from:addr,gas:15000000})
    .then(async function(newContractInstance){
        code = await web3.eth.getCode(newContractInstance.options.address) 
    });

    console.log(code);
    
};



bytecode()

