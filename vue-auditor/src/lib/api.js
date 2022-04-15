// import { DLTNodeApi } from "@saturn-chain/dlt-rest-api";
// import { DLTInterface } from "@saturn-chain/dlt-functions";
import { SmartContracts } from "@saturn-chain/smart-contract";
import combinedFile from "../contracts/combined";

// import { Crypto } from "@saturn-chain/dlt-tx-data-functions";

// import { toNumber, toGWei, toWei } from "./numbers";

// import { AsyncLocalStorage } from "./async-local-storage";

// export const storageNames = {
//     walletAddresses: "bank-visited-wallets",
//     walletTokens: "bank-wallet-tokens",
// };

// const _localStorage = new AsyncLocalStorage(Object.values(storageNames));
// export function storage() {
//     return _localStorage;
// }


// export async function buildDLTInterface(walletAddress, walletPassword) {
//     const chain = "eth";
//     const nodeApi = new DLTNodeApi(window.AppConfig.dltNodeAPIBaseUrl, chain);
//     const custodyApi = await custody(chain);

//     // TODO: To move somewhere else? May need to be passed as a parameter
//     const auth = async (address, api) => {
//         const token = await api.authenticate(address, walletPassword);
//         return token;
//     }

//     const signer = custodyApi.getSigner(walletAddress, auth);
//     const wallet = nodeApi.getWallet(walletAddress, signer);
//     return new DLTInterface(nodeApi, wallet);
// }

// export async function getWallet(walletAddress) {
//     const chain = "eth";
//     const nodeApi = new DLTNodeApi(window.AppConfig.dltNodeAPIBaseUrl, chain);
//     return nodeApi.getWallet(walletAddress);
// }

const governanceAddress = "0x0000000000000000000000000000000000000100";

export function getContractInstance(contractName) {
    const contracts = SmartContracts.load(combinedFile);
    const contract = contracts.get(contractName);
    const instance = contract.createInstance(governanceAddress);
    console.log("Instance", instance);
}