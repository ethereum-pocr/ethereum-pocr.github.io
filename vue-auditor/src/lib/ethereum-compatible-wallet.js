

/**
 * Test in the window object if the ethereum compatible wallet has been registered
 * @param {{mustBeMetaMask: boolean, silent: boolean, tiemout: number}} options: configure the behavior of the function. Default are  mustBeMetaMask = false, silent = false, timeout = 3000
 * @returns {Promise<Provider|undefined>} returns the web3 compatible provider that also support the following api https://docs.metamask.io/guide/ethereum-provider.html#table-of-contents
 * Does not raise Error
 */
export function detectEthereumProvider({
  mustBeMetaMask = false,
  silent = false,
  timeout = 3000,
} = {}) {
  _validateInputs();
  let handled = false;
  return new Promise((resolve) => {
    // Is the ethereum provider alredy registered ?
    if (window.ethereum) {
      handleEthereum();
    } else {
      // No, then await for the event that says so or the timeout duration
      if (!silent) console.log(
        "detectEthereumProvider - no ethereum yet - wait for event or timeout"
      );
      window.addEventListener("ethereum#initialized", handleEthereum, {
        once: true,
      });
      setTimeout(() => {
        handleEthereum();
      }, timeout);
    }
    function handleEthereum() {
      // Now let's decide what to return
      if (!silent) console.log("detectEthereumProvider - handleEthereum()", handled);
      if (handled) {
        return;
      }
      handled = true;
      window.removeEventListener("ethereum#initialized", handleEthereum);
      const { ethereum } = window;
      if (!silent) console.log(
        "detectEthereumProvider - decide return value",
        ethereum,
        mustBeMetaMask
      );
      if (ethereum && (!mustBeMetaMask || ethereum.isMetaMask)) {
        resolve(ethereum);
      } else {
        const message =
          mustBeMetaMask && ethereum
            ? "Non-MetaMask window.ethereum detected."
            : "Unable to detect window.ethereum.";
        !silent && console.error("detectEthereumProvider:", message);
        resolve(undefined);
      }
    }
  });
  function _validateInputs() {
    if (typeof mustBeMetaMask !== "boolean") {
      throw new Error(
        `detectEthereumProvider: Expected option 'mustBeMetaMask' to be a boolean.`
      );
    }
    if (typeof silent !== "boolean") {
      throw new Error(
        `detectEthereumProvider: Expected option 'silent' to be a boolean.`
      );
    }
    if (typeof timeout !== "number") {
      throw new Error(
        `detectEthereumProvider: Expected option 'timeout' to be a number.`
      );
    }
  }
}

/**
 * Returns the connected node info
 * @param {Provider} provider 
 * @returns {{connected:boolean, chainId?: number, chainIdHex?: string, networkVersion?: number}}
 */
export async function getEthereumProviderChainInfo(provider) {
  if (!provider) return {connected: false};
  const chainId = await provider.request({ method: 'eth_chainId' })
  
  return {
    connected: provider.isConnected(),
    chainId: Number(chainId),
    chainIdHex: `0x${ Number(chainId).toString(16)}`,
    networkVersion: Number(provider.networkVersion),
  }
}

/**
 * 
 * @param {Provider} provider 
 * @param {{timeout: boolean}} options with default {timeout=500 ms} 
 * @returns {Promise<string[]>} an array of account address or an empty array if the wallet is locked. The first address of the array is the selected wallet.
 */
export async function getEthereumProviderConnectedAccounts(provider, {timeout = 500}={}) {
  return new Promise((resolve) => {
    console.log("getEthereumProviderConnectedAccounts", timeout);
    let completed = false;
    // set the timeout to respond in case of blocked call on eth_accounts
    setTimeout(() => {
      if (completed) return;
      console.log("getEthereumProviderConnectedAccounts Timed out");
      completed = true;
      resolve([]);
    }, timeout);
    // submit the request to the wallet
    // this mehod can block on brave wallet, but doesn't on metamask, hence the timeout
    provider
      .request({ method: "eth_accounts" })
      .then((accounts) => {
        if (completed) return;
        console.log("getEthereumProviderConnectedAccounts got a result", accounts);
        completed = true;
        resolve(accounts);
      })
      .catch(() => {
        if (completed) return;
        completed = true;
        resolve([]);
      });
  });
}

function errorLike(error) {
  return typeof error.message !== "undefined";
}

/**
 * Ensure the error is properly formatted as bet specification
 * @param {Error | string | any} error that will be converted into an Error 
 * @param {number|undefined} code will be set to the resulting error if defined
 * @param {any|undefined} data will be set to the resulting error if defined
 * @returns 
 */
function providerError(error, code, data) {
  if (!error) return undefined;
  let result = error;
  if (typeof result == "string") result = new Error(result);
  if (!errorLike(result)) result = new Error(result);
  if (typeof !result.code && typeof result.message == "string") {
    try {
      const decoded = JSON.parse(result.message);
      result.code = decoded.code;
      result.data = decoded.data;
      result.message = decoded.message;
    } catch (error) {
      result.code = code || 0;
    }
  }
  if (code) result.code = code;
  if (data) result.data = data;
  return result;
}

/**
 * Request the user to unlock the wallet and returns selected accounts
 * @param {Provider} provider 
 * @param {EventEmitter} notifier an emmiter provided by the caller to request cancellation by emitting the 'cancel' event
 * @returns {Promise<string[]>} the connected account
 * If the wallet is not unlocked then the call remains pending until the `notifier.emit('cancel')` is called. In such case an error is raised with `error.code == 4001`.    
 * It can also raise an error with code `-32602` if there is already a pending request to unlock the wallet by this page or another
 */
export async function unlockEthereumProviderAccounts(provider, notifier) {
  return await new Promise((resolve, reject) => {
    let completed = false;
    // catch the cancel event that can be provided by the user
    notifier.once("cancel", () => {
      if (completed) return;
      completed = true;
      reject(providerError("Cancelled login", 4001));
    });
    provider
      .request({ method: "eth_requestAccounts" })
      .then((accounts) => {
        if (completed) return;
        completed = true;
        resolve(accounts);
      })
      .catch((error) => {
        if (completed) return;
        completed = true;
        reject(providerError(error));
      });
  });
}

/**
 * Request switching to the provided network chainId and if it does not exists try creating the network if the info are provided and an address is provided
 * @param {Provider} provider 
 * @param {{
      chainId: string; 
      chainName?: string;
      nativeCurrency?: {
        name: string;
        symbol: string; 
        decimals: number;
      };
      rpcUrls?: string[];
      blockExplorerUrls?: string[];
      iconUrls?: string[];
    }} network information for selecting the network. If the optional info are not provided, the network won't be created 
 * @param {string|undefined} address the account needed to request the network creation
 * @returns {Promise<void>}
 */
export async function switchEthereumProviderNetwork(provider, network, address) {
  if (!provider) throw providerError("missing a valid provider", -32602);
  if (!network) throw providerError("missing the network parameter", -32602);
  if (!/0x[0-9a-fA-F]+/.test(network.chainId)) throw providerError("missing the network chainId as an hex string (0x123)", -32602);
  try {
    await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: network.chainId }],
    });
  } catch (switchError_) {
    let switchError = providerError(switchError_);
    // in mobile metamask wallet, the error code 4902 is not set but the error message contains the name of the function to use
    if (/wallet_addEthereumChain/.test(switchError.message)) switchError.code = 4902;
    // console.log("Fail switching to the network:", switchError.code, switchError.message, address, network.chainName, "test message", /wallet_addEthereumChain/.test(switchError.message))
    // This error code indicates that the chain has not been added to MetaMask.
    if (switchError.code == 4902) {
      if ( address && network.chainName ) {
        try {
          await provider.request({
            method: 'wallet_addEthereumChain',
            params: [
              network, address
            ],
          });
          
        } catch (addError) {
          // handle "add" error
          // console.log("Fail adding network", addError.message)
          throw providerError(addError);
        }
      } else {
        throw providerError("Cannot switch to the network because it does not exist and the call misses the network info and a valid account", -32602, network)
      }
    }
    // handle other "switch" errors
    // console.log("Fail switching to the network:"+switchError.message)
    throw switchError;
  }
}