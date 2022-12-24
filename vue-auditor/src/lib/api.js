import Web3 from "web3";
import BigInt from "./bigint-polyfill";
import { Web3FunctionProvider } from "@saturn-chain/web3-functions";
import { Web3CustodyFunctionProvider } from "@saturn-chain/web3-custody-functions";
import { WalletCustodyApiImpl } from "@saturn-chain/wallet-custody-rest-api";
import allContracts from "sc-carbon-footprint";
import $store from "@/store/index";
import { AsyncLocalStorage } from "./async-local-storage";

import { EventEmitter } from "events";

import { governanceAddress } from "./const";

const LocalStorage = new AsyncLocalStorage();


export function getWeb3ProviderFromUrl(url) {
    const web3 = new Web3(url)
    return web3.currentProvider;
}

export async function getWalletBalance(walletAddress) {
    return await $store.get("auth/web3").eth.getBalance(walletAddress);
}


export function getContractInstanceByName(contractName) {
    const contract = allContracts.get(contractName);
    const instance = contract.at(governanceAddress);
    console.log("Instance", instance);
    return instance;
}

export function getContractInstance() {
    return getContractInstanceByName("Governance");
}

export function getCustodyApi() {
    const custodyUrl = $store.get("auth/providerDirect").custodyApiUrl;
    const custody = new WalletCustodyApiImpl(custodyUrl, "eth");
    return custody;    
}

export async function verifyCustodyAuthentication(wallet, password) {
    let savedWallets = (await LocalStorage.getItem("custody.wallets")) || [];
    savedWallets.unshift(wallet);
    savedWallets = [...new Set(savedWallets)];
    LocalStorage.setItem("custody.wallets", savedWallets)
    const api = getCustodyApi();
    const token = await handleMMResponse(api.authenticate(wallet, password));
    return token
}

export async function getCustodyLastWallets() {
    return (await LocalStorage.getItem("custody.wallets")) || [];
}

export function intf(provider) {
    let result = $store.get("auth/intf");
    if (result) return result;
    // TODO (suggestion): This approach work, but why not storing in the "store" the intf result instead of the web3 provider ?
    //      you would save writing the intf(provider)
    if (!provider) provider = $store.get("auth/provider");
    if (!provider) throw new Error("Should not be calling the api functions without a provider connected")
    const model = $store.get("auth/providerModel");
    if (model == "metamask") {
        const web3 = $store.get("auth/web3");
        result = new Web3FunctionProvider(web3, (list) => Promise.resolve(list[0]))
    }
    if (model == "direct") {
        const wallet = $store.get("auth/wallet");
        if (wallet) {
            const custody = getCustodyApi();
            const authFunction = $store.state.auth.walletAuthenticationFunction;
            result = new Web3CustodyFunctionProvider(provider, custody, wallet, authFunction );
        } else {
            // returns a fake identity using any address. Only read function will be available
            result = new Web3FunctionProvider(provider, ()=>Promise.resolve(governanceAddress))
        }
    }
    if (result) {
        // remove the ens that breaks the vue inspector
        result.web3.eth.ens = null;
        $store.set("auth/intf", result);
        return result;
    } 

    throw new Error("should not be calling the api functions without deciding the provider (metamask or direct)")
}

// let __id= 1000;
export function subscribeNewBlocks(web3) {
    if (!web3) web3 = $store.get("auth/web3");
    if (!web3) throw new Error("Should not be calling the api functions without a provider connected")
    // const provider = $store.get("auth/provider");
    const subs = new EventEmitter({captureRejections: true});
    subs.unsubscribe = ()=>{
        if (subs.timer) {
            clearTimeout(subs.timer);
            subs.timer = null;
        }
    }
    const delayMs = 1000;
    
    async function runLoop() {

        if (!subs.props) {
            subs.props = {lastBlock: await web3.eth.getBlockNumber(), lastCheck: Date.now()};
        } else {
            const lastBlock = await web3.eth.getBlockNumber();

            // provider.sendAsync({method:"eth_blockNumber", id: __id++}, (e,r)=>console.log("send Async response", e, r))
            // const r = await provider.request({method:"eth_blockNumber", id: __id++})
            // console.log("Request eth_blockNumber", Number(r));

            const lastCheck = Date.now();
            //console.log("runLoop:", subs.props, {lastBlock, lastCheck});
            if (lastBlock > subs.props.lastBlock) {
                for (let b=subs.props.lastBlock+1; b<=lastBlock; b++) {
                    const block = await web3.eth.getBlock(b, false)
                    subs.emit("data", block);
                }
            }
            subs.timer = subs.props = {lastBlock, lastCheck};
        }

        subs.timer = setTimeout( runLoop , delayMs);
    }

    setTimeout( runLoop , delayMs);
    return subs
}



export async function readOnlyCall(methodName, ...args) {
    return readOnlyCallWithOptions(methodName, { maxGas: 10000000 }, ...args)
}

export async function readOnlyCallWithOptions(methodName, options, ...args) {
    const provider = $store.get("auth/provider");
    const contract = $store.get("auth/contract");
    if (!(methodName in contract)) return Promise.reject(new Error(`Method ${methodName} does not exists in contract`));
    return contract[methodName](
        wrapSend(intf(provider).call(options)), 
        ...args
    );
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

function wrapSend(send) {
    return (target, data) => {
        //console.log("Wrapped sender", target, data);
        return send(target, data)
    }
}

export function writeCallWithOptions(methodName, options, ...args) {
    const wallet = $store.get("auth/wallet");
    if (!wallet) {
        return Promise.reject(new Error("You are not authenticated with a wallet, you cannot update the blockchain"));
    }
    const provider = $store.get("auth/provider");
    const contract = $store.get("auth/contract");
    if (!(methodName in contract)) return Promise.reject(new Error(`Method ${methodName} does not exists in contract`));
    if (options.amount) options.amount=new BigInt(options.amount.toString(10))

    return new Promise( (resolve, reject)=>{
        // First test the execution with the node using the call approach
        readOnlyCallWithOptions(methodName, options, ...args)
        .then(async v=>{
            console.log("Tested call", options, v)
            resolve(
                // as it succeeded, try executing it as a transaction
                await contract[methodName](
                    wrapSend(intf(provider).send(options)),
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

async function collectDataFunction(target, data) {
    const cmd = `eth.sendTransaction({from: eth.coinbase, to:"${target}", data:"${data}"})`
    return {isTx: true, result: cmd}
}
export async function getCallData(methodName, ...args) {
    const contract = $store.get("auth/contract");
    const cmd = await contract[methodName]( collectDataFunction, ...args)
    console.log(cmd)
    return cmd;
}

export async function handleMMResponse(promise, errorCallback) {
    let response = null;
    try {
        $store.set("mmIsOpen", true);
        response = await promise;
    }
    catch (err) {
        let message = err.message;
        // In some cases of lack of gas in the transaction, the err contains a tx info
        if (err.blockHash && err.gasUsed && err.status==false) {
            message = `Not enough gas to complete the transaction: ${err.gasUsed} provided`
        }
        console.warn("Submitted transaction failed with error:", message);
        $store.dispatch("errorFlash", message);
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