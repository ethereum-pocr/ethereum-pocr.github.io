import web3 from "web3";

export const ROLES = {
  VISITOR : "Visitor",
  AUDITED_NODE : "Audited node",
  NEW_NODE : "New node",
  APPROVED_AUDITOR : "Approved auditor",
  PENDING_AUDITOR : "Auditor",
  USER_CONNECTED : "User",
}

export const CRIPBaseUrl = "https://github.com/ethereum-pocr/CRIPs/blob/main/CRIPS"


export const governanceAddress = "0x0000000000000000000000000000000000000100";
export const totalCRCAddress = "0x0000000000000000000000000000000000000101";
const sessionVariableTotalPocRCoins = "GeneratedPocRTotal";
export const GeneratedCRCTotalHash = web3.utils.keccak256(sessionVariableTotalPocRCoins);