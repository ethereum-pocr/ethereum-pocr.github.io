import Web3 from "web3";
import { Web3FunctionProvider } from "@saturn-chain/web3-functions";
import allContracts from "sc-carbon-footprint";
import $store from "@/store/index";

export async function getWalletBalance(walletAddress) {
    return await new Web3($store.get("auth/provider")).eth.getBalance(walletAddress);
    // const wallet = new Web3Wallet(Web3, walletAddress);
    // return await wallet.getBalance();
}

export const governanceAddress = "0x0000000000000000000000000000000000000100";

export const auditorGovernanceAddress = "0x0000000000000000000000000000000000000200";

export function getContractInstanceByName(contractName) {
    const contract = allContracts.get(contractName);
    const instance = contract.at(governanceAddress);
    console.log("Instance", instance);
    return instance;
}

export function getContractInstance() {
    return getContractInstanceByName("Governance");
}

export function intf(provider) {
    // TODO (suggestion): This approach work, but why not storing in the "store" the intf result instead of the web3 provider ?
    //      you would save writing the intf(provider)
    return new Web3FunctionProvider(provider, (list) => Promise.resolve(list[0]))
}

export async function readOnlyCall(methodName, ...args) {
    const provider = $store.get("auth/provider");
    const contract = $store.get("auth/contract");
    if (!(methodName in contract)) return Promise.reject(new Error(`Method ${methodName} does not exists in contract`));
    console.log(`In readOnlyCall -> before call of ${methodName} in contract, ${methodName in contract}`);
    const res = await contract[methodName](
        intf(provider).call(),
        ...args
    );
    console.log(`In readOnlyCall -> after call of ${methodName} in contract, ${methodName in contract}`);
    console.dir(res);
    return res;
}

export function writeCall(methodName, ...args) {// return writeCallWithOptions(methodName, {maxGas: 1000000}, ...args);
    return writeCallWithOptions(methodName, {}, ...args);
}

function convertMMErrorMessage(message) {
    if(typeof message !== "string") message = `\n {"message":"invalid error message"}`;
    let split = message.split("\n");
    if(split.length==1) split =  `\n ${JSON.stringify({message})}`.split('\n');
    try {
        const obj = JSON.parse(split.splice(1).join(" "))
        return obj;
    } catch (error) {
        return {
            message: "invalid JSON message"
        }
    }
}

export function writeCallWithOptions(methodName, options, ...args) {
    const provider = $store.get("auth/provider");
    const contract = $store.get("auth/contract");
    if (!(methodName in contract)) return Promise.reject(new Error(`Method ${methodName} does not exists in contract`));

    return new Promise( (resolve, reject)=>{
        // First test the execution with the node using the call approach
        readOnlyCall(methodName, ...args)
        .then(async v=>{
            console.log("Tested call", v)
            resolve(
                // as it succeeded, try executing it as a transaction
                await contract[methodName](
                    intf(provider).send(options),
                    ...args
                )
            )
        })
        .catch(e => {
            const err = convertMMErrorMessage(e.message)
            reject(err)
        })
    });
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