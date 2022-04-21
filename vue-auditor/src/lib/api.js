import Web3 from "web3";
// import { Web3Wallet } from "@saturn-chain/web3-custody-functions";
import { SmartContracts } from "@saturn-chain/smart-contract";
import { Web3FunctionProvider } from "@saturn-chain/web3-functions";
import combinedFile from "../contracts/combined";
import $store from "@/store/index";

export async function getWalletBalance(walletAddress) {
    return await new Web3($store.get("auth/provider")).eth.getBalance(walletAddress);
    // const wallet = new Web3Wallet(Web3, walletAddress);
    // return await wallet.getBalance();
}

const governanceAddress = "0x0000000000000000000000000000000000000100";

export function getContractInstanceByName(contractName) {
    const contracts = SmartContracts.load(combinedFile);
    const contract = contracts.get(contractName);
    const instance = contract.createInstance(governanceAddress);
    console.log("Instance", instance);
    return instance;
}

export function getContractInstance() {
    return getContractInstanceByName("Governance");
}

export function intf(provider) {
    return new Web3FunctionProvider(provider, (list) => Promise.resolve(list[0]))
}

export function readOnlyCall(methodName, ...args) {
    const provider = $store.get("auth/provider");
    const contract = $store.get("auth/contract");

    return contract[methodName](
        intf(provider).call(),
        ...args
    );
}

export function writeCall(methodName, ...args) {
    const provider = $store.get("auth/provider");
    const contract = $store.get("auth/contract");

    return contract[methodName](
        intf(provider).send(),
        ...args
    );
}

export function writeCallWithOptions(methodName, options, ...args) {
    const provider = $store.get("auth/provider");
    const contract = $store.get("auth/contract");

    return contract[methodName](
        intf(provider).send(options),
        ...args
    );
}

export async function handleMMResponse(promise, errorCallback) {
    let response = null;
    try {
        $store.set("mmIsOpen", true);
        response = await promise;
    }
    catch (err) {
        console.log(err);
        $store.dispatch("errorFlash", err.message);
        errorCallback && errorCallback(err);
    }
    finally {
        $store.set("mmIsOpen", false);
    }
    return response;
}

// Not used currently but lets you run any arbitrary code and the mmIsOpen flag is handled automatically
// aswell as the error flash production if you decide to trigger an exception.
export async function handleMM(func) {
    try {
        $store.set("mmIsOpen", true);
        await func();
    }
    catch (err) {
        console.log(err);
        $store.dispatch("errorFlash", err.message);
    }
    finally {
        $store.set("mmIsOpen", false);
    }
}