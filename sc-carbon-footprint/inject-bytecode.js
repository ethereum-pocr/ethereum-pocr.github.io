const fs = require("fs");
const crypto = require("crypto");
const { nodeModuleNameResolver } = require("typescript");

// takes the bytecode of the governance smart contract from the env variable SMART_CONTRACT_BYTECODE
// takes the target genesis json file from the first param

const governanceAddress = "0000000000000000000000000000000000000100";
const totalCryptoAddress = "0000000000000000000000000000000000000101";
const totalCryptoBytecode = "0x60806040";


function injectByteCode(genesisFile, bytecode, nonce) {
  const genesis = JSON.parse(fs.readFileSync(genesisFile, "utf8"));
  if (!genesis.alloc) {
    genesis.alloc = {};
  }
  genesis.alloc[governanceAddress] = {
    balance: "0x0",
    code: bytecode,
  };
  genesis.alloc[totalCryptoAddress] = {
    balance: "0x0",
    code: totalCryptoBytecode,
  };
  
  genesis.nonce = nonce;

  fs.writeFileSync(genesisFile, JSON.stringify(genesis, null, 2));
  console.log("Genesis file updated", genesisFile);
}

const bytecode = process.env.SMART_CONTRACT_BYTECODE
if (!bytecode) {
  console.error("Populate the variable SMART_CONTRACT_BYTECODE with the governance bytecode");
  process.exit(1);
}

let nonce = process.env.GIT_HEAD_HASH;
if (nonce) {
  if (nonce.startsWith("0x")) nonce = nonce.slice(2);
  nonce = Buffer.from(nonce, "hex");
  if (nonce.length==0) nonce = undefined;
} 
if (!nonce) {
  nonce = crypto.createHash("sha256").digest(Buffer.from(bytecode));
}
nonce = '0x'+nonce.toString('hex').slice(0,16);

const file = process.argv[process.argv.length-1];
try {
  JSON.parse(fs.readFileSync(file))
} catch (error) {
  console.error("Usage ", __filename, "<genesis.json>");
  process.exit(1);
}

injectByteCode(file, bytecode, nonce)