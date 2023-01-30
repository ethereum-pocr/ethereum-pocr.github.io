const fs = require("fs");
const crypto = require("crypto");
const path = require("path");
const {bytecode} = require("./extract-bytecode-lib");
// takes the bytecode of the governance smart contract from the env variable SMART_CONTRACT_BYTECODE
// takes the target genesis json file from the first param

const governanceAddress = "0000000000000000000000000000000000000100";
const totalCryptoAddress = "0000000000000000000000000000000000000101";
const totalCryptoBytecode = "0x60806040";
// my vanity over 32 bytes
const extraDataVanity = "4775c3a96e6f6cc3a9206465204361646f7564616c206d61646520506f435221";
// the 64+1 r,s,v buffer for the genesis
const extraDataEmptySignature = "0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";

// example structure only
let config = {
  genesisTemplate: "kerleano.json",
  initialSealers: ["0x1311aef86d1db33db945fc488eeff1c6105b9593"],
  initialAuditor: "0x3D0a5f7514906c02178c6Ce5c4ec33256F08Ce58",
  auditorInitialCredit: 25001,
  governanceContract: "GovernanceKerleano",
  chainID: 1804,
  secPerBlock: 4,
  epoch: 151200,
  blockGasLimit: "119000000",
  timestamp: "0x86e1970",
  extraDataVanity: "4775c3a96e6f6cc3a9206465204361646f7564616c206d61646520506f435221"
};

const removeHex = (s) => s.startsWith('0x')?s.slice(2):s

const file = process.argv[process.argv.length-1];
try {
  config = JSON.parse(fs.readFileSync(file))
} catch (error) {
  console.error("Usage ", __filename, "<config.json>");
  console.error("Format of the config file:\n"+JSON.stringify(config, null, 2))
  process.exit(1);
}

async function run() {
  const templateFile = path.join(path.dirname(file), config.genesisTemplate);
  if (!fs.existsSync(templateFile)) {
    console.error("Provided template file does not exists: "+templateFile);
    process.exit(2);
  }
  const genesis = JSON.parse(fs.readFileSync(templateFile));
  
  // build the sealer list with a default value
  const sealers = config.initialSealers
      .map(removeHex) // remove the 0x if present
      .map(s=>s.padEnd(40, '0').slice(0,40)) // force 40 chars = 20 bytes
      .join('').toLowerCase();
  
  if (!genesis.config) {genesis.config = {};}
  if (!genesis.config.clique) {genesis.config.clique = {pocr: true};}

  genesis.config.chainId = config.chainID;
  genesis.config.clique.period = config.secPerBlock;
  genesis.config.clique.epoch = config.epoch;

  genesis.gasLimit = '0x'+Number(config.blockGasLimit).toString(16);
  genesis.timestamp = config.timestamp;

  genesis.extraData = `0x${removeHex(config.extraDataVanity||extraDataVanity)}${sealers}${extraDataEmptySignature}`;
  
  if (!genesis.alloc) {
    genesis.alloc = {};
  }
  
  const _bytecode = await bytecode(config.governanceContract)
  genesis.alloc[governanceAddress] = {
    balance: "0x0",
    code: _bytecode,
  };
  genesis.alloc[totalCryptoAddress] = {
    balance: "0x0",
    code: totalCryptoBytecode,
  };
  genesis.alloc[removeHex(config.initialAuditor)] = {
    balance: '0x'+Number(config.auditorInitialCredit*1000000000*1000000000).toString(16),
  };
  genesis.alloc[totalCryptoAddress] = {
    ...genesis.alloc[totalCryptoAddress],
    balance: genesis.alloc[removeHex(config.initialAuditor)].balance,
  };
  
  // CALCULATE THE NONCE
  let nonce = process.env.GIT_HEAD_HASH;
  if (nonce) {
    nonce = Buffer.from(removeHex(nonce), "hex");
    if (nonce.length==0) nonce = undefined;
  } 
  if (!nonce) {
    nonce = crypto.createHash("sha256").digest(Buffer.from(_bytecode));
  }
  nonce = '0x'+nonce.toString('hex').slice(0,16);
  
  genesis.nonce = nonce;


  return JSON.stringify(genesis, null, 2);
}

// fs.writeFileSync(genesisFile, JSON.stringify(genesis, null, 2));
// console.log("Genesis file updated", genesisFile);

// run and display the json returned
run().then(console.log);