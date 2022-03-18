import { expect } from "chai";
import { cliqueRLPHash, JSONRPCBlockDetail, poaBlockHashToSealerInfo } from ".";

describe("Test the BlockHash to sealer address", () => {
  it("should extract the proper address of block 1", () => {

    const sealer = poaBlockHashToSealerInfo(block1);
    expect(sealer.address).to.equals("0x6e45c195e12d7fe5e02059f15d59c2c976a9b730");
    console.log("Sealer: ", sealer)
    // console.log(sealer.vanity.replace(/\x00/g, "-"))
  });
  
  it("should extract the proper address of block 2", () => {

    const sealer = poaBlockHashToSealerInfo(block2);
    expect(sealer.address).to.equals("0x77fbd81ab0eed10e714b17581663d05c3db1b786");
    console.log("Sealer: ", sealer)
  });
  it("should have the correct seal hash of the zero block", () => {

    const hash = cliqueRLPHash(emptyBlock).toString("hex");
    expect(hash).to.equals("993083b9dfa4fba1b0d4127a95ef6dfa9e9494b89c2710d8a69eb92332bf8d2f");
  });
  
});

const block1 = {
  difficulty: "0x2",
  extraData:
    "0xd883010a0e846765746888676f312e31372e33856c696e757800000000000000ad6a93d0b90c48085034e866e9871beb4f68889e7fdaca05148a9fb9458473cb341f43974f957f60f87ea0f6655cfc66b905faec2473fdb724913753f106502e00",
  gasLimit: "0x7a1200",
  gasUsed: "0x0",
  hash: "0xdd24003eccc53e7afbcab048753c621b5ecf62a2541c32db6df4ae8da182e916",
  logsBloom:
    "0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  miner: "0x0000000000000000000000000000000000000000",
  mixHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
  nonce: "0x0000000000000000",
  number: "0x8fb6",
  parentHash:
    "0x5c91d01075e5a8634d581ac666458eeda14cbf1c332bb5b8571f9dd9e96898c7",
  receiptsRoot:
    "0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",
  sha3Uncles:
    "0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347",
  size: "0x260",
  stateRoot:
    "0x0e56ad280412ba4220a986d5c62045e8fb2d2d2076645ccef216bf71236b2ed3",
  timestamp: "0x61ab1c87",
  totalDifficulty: "0x11dfa",
  transactions: [],
  transactionsRoot:
    "0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",
  uncles: [],
};

const block2 = {"difficulty":"0x2","extraData":"0xd883010a0e846765746888676f312e31372e33856c696e757800000000000000d5cd492fbb2f8a04f083104b8cc1cd3af68205cc68bb8513d5dd08582485353e585011628ab5bff54576044aa7044051b230e33700bf564f60f85bffbcbac76001","gasLimit":"0x7a1200","gasUsed":"0x0","hash":"0x58338cd647a117b38c6f4b05ad12b052e0419b2d589892341b3924481837bfa9","logsBloom":"0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000","miner":"0x0000000000000000000000000000000000000000","mixHash":"0x0000000000000000000000000000000000000000000000000000000000000000","nonce":"0x0000000000000000","number":"0x9287","parentHash":"0x01b80e52c1af967a6f3a6b3486f10fe6324dcdec279271328cd7eb1f12e2d896","receiptsRoot":"0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421","sha3Uncles":"0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347","size":"0x260","stateRoot":"0x7faab6c5c2957a335cfa3ea04e36670f1fe3d1d9e0b3465358443f37521b2aef","timestamp":"0x61ab27cb","totalDifficulty":"0x1239c","transactions":[],"transactionsRoot":"0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421","uncles":[]}


function zeros(nb:number): string {
  return '0x'+'0'.repeat(nb);
}
function zeroHash(): string {return zeros(64)}
function zeroAddress(): string {return zeros(40)}

const emptyBlock: JSONRPCBlockDetail = {
  parentHash: zeroHash(),
  sha3Uncles: zeroHash(),
  miner: zeroAddress(),
  stateRoot: zeroHash(),
  transactionsRoot: zeroHash(),
  receiptsRoot: zeroHash(),
  logsBloom: zeros(512),
  difficulty: zeros(1),
  number: zeros(1),
  gasLimit: zeros(1),
  gasUsed: zeros(1),
  timestamp: zeros(1),
  extraData: zeros(194),
  mixHash: zeroHash(),
  nonce: zeros(16),
  baseFeePerGas: zeros(1)
}