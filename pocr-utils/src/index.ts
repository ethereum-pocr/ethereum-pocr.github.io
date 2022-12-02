import {  ecrecover, pubToAddress, rlp, rlphash, toType, TypeOutput } from "ethereumjs-util";

const signatureLength = 64+1;

function removeHexPrefix(hex: string): string {
  if(hex.startsWith('0x')) return hex.substr(2)
  else return hex
}

type HexString = string

export interface JSONRPCBlockDetail {
  difficulty: HexString|number;
  extraData: HexString;
  gasLimit: HexString|number;
  gasUsed: HexString|number;
  hash?: HexString;
  logsBloom:HexString;
  miner: HexString;
  mixHash: HexString;
  nonce: HexString;
  number: HexString|number;
  parentHash: HexString
  receiptsRoot: HexString;
  sha3Uncles: HexString;
  size?: HexString;
  stateRoot: HexString;
  timestamp: HexString|number;
  totalDifficulty?: HexString|number;
  transactions?: any[];
  transactionsRoot: HexString;
  uncles?: HexString[];
  baseFeePerGas?: HexString;
}

function splitExtraData(extraData: HexString): {toBeSigned: Buffer, vanity: Buffer, signature?: Buffer, signers: string[]} {
  let ed = Buffer.from(removeHexPrefix(extraData), "hex");
  if (ed.length < signatureLength) {
    return {toBeSigned: ed, vanity: ed, signers:[]};
  }
  const vanity = ed.slice(0, 32); // Vanity is 32 bytes long
  const toBeSigned = ed.slice(0, ed.length-signatureLength); // all but the signature
  const signature = ed.slice(ed.length-signatureLength);
  // if there are more data in between it is an epoch block with the list of sealers. While we are there let's extract it, it can be useful
  const signers: string[] = [];
  if (ed.length>(32+signatureLength)) {
    const signerData = ed.slice(32, ed.length-signatureLength);
    let i=0;
    while ((i+20)<=signerData.length) { // do we have an address available of data
      const signer = signerData.slice(i, i+20);
      signers.push(`0x${signer.toString("hex")}`);
    }
  }
  return {toBeSigned, vanity, signature, signers};
}

export function cliqueRLPHash(header:JSONRPCBlockDetail): Buffer {
  const {toBeSigned, signature} = splitExtraData(header.extraData);
  if (signature === undefined) {
    throw new Error("Missing signature in extra data");
  }
  const toEncode = [
    toType(header.parentHash, TypeOutput.Buffer),
    toType(header.sha3Uncles, TypeOutput.Buffer),
    toType(header.miner, TypeOutput.Buffer),
    toType(header.stateRoot, TypeOutput.Buffer),
    toType(header.transactionsRoot, TypeOutput.Buffer),
    toType(header.receiptsRoot, TypeOutput.Buffer),
    toType(header.logsBloom, TypeOutput.Buffer),
    toType(header.difficulty, TypeOutput.BN),
    toType(header.number, TypeOutput.BN),
    toType(header.gasLimit, TypeOutput.Number),
    toType(header.gasUsed, TypeOutput.Number),
    toType(header.timestamp, TypeOutput.Number),
    toBeSigned, // only the part without the signature
    toType(header.mixHash, TypeOutput.Buffer),
    toType(header.nonce, TypeOutput.Buffer)
  ]

  if (header.baseFeePerGas) {
    toEncode.push(toType(header.baseFeePerGas, TypeOutput.BN))
  }

  // const encoded = rlp.encode(toEncode);
  const hash = rlphash(toEncode)
  return hash
}

export interface SealerInfo {
  address: HexString;
  vanity: VanityInfo;
  signers?: string[];
}

export interface VanityInfo {
  version?: string;
  client?: string;
  runtime?: string;
  os?: string;
  custom?: string;
}

interface RlpDecoded {
  data: Buffer[]|Buffer;
  remainder: Buffer;
}

export function decodeVanity(vanity: Buffer): VanityInfo {
  const result: VanityInfo= {}
  const decoded: RlpDecoded = rlp.decode(vanity, true) as unknown as RlpDecoded
  if (Array.isArray(decoded.data) ) {
    const fields: Buffer[] = decoded.data;
    if (fields[0].length == 3) {
      result.version = `${fields[0][0]}.${fields[0][1]}.${fields[0][2]}`
    } else {
      result.version = fields[0].toString("utf8")
    }
    if (fields.length >= 2) {
      result.client = fields[1].toString("utf8")
    }
    if (fields.length >= 3) {
      result.runtime = fields[2].toString("utf8")
    }
    if (fields.length >= 4) {
      result.os = fields[3].toString("utf8")
    }
    result.custom = `${result.client||''} ${result.version||''} ${result.runtime||''} ${result.os||''}`
  } else {
    let firstZero = vanity.findIndex(v=>v===0)
    if (firstZero==-1) firstZero = vanity.length
    result.custom = vanity.slice(0,firstZero).toString("ascii");
  }
  return result;
}

export function poaBlockHashToSealerInfo(block: JSONRPCBlockDetail): SealerInfo {
  const {vanity, signature, signers} = splitExtraData(block.extraData);
  if (signature === undefined) {
    throw new Error("Missing signature in extra data");
  }
  
  const r = signature.slice(0, 32);
  const s = signature.slice(32, 64);
  const v = signature[64] + 27;
  const h = cliqueRLPHash(block);
  // console.log("Clique Hash", h.toString("hex"))
  const pk = ecrecover(h, v, r, s);
  let a = pubToAddress(pk)

  const address = "0x"+a.toString("hex");
  // const vanity2 = Buffer.alloc(32, 0)
  // vanity2.write("0123456789abcdef0123456789abcdef")
  const txtVanity = decodeVanity(vanity)
  const si:SealerInfo = {address, vanity:txtVanity};
  if (signers.length>0) si.signers = [...signers];
  return si;
}