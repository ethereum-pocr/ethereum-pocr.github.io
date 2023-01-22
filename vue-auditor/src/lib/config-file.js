

export function parseUrl(url, acceptedProtocols) {
  if (acceptedProtocols && !Array.isArray(acceptedProtocols)) acceptedProtocols = [acceptedProtocols];
  if (acceptedProtocols) acceptedProtocols = acceptedProtocols.map(p=>(p.endsWith(":")? p : p+':').toLowerCase());
  
  if (!url) return undefined;
  try {
      const u = new URL(url)
      if (acceptedProtocols) {
          if (!acceptedProtocols.includes(u.protocol)) return undefined
      }
      return u;
  } catch (error) {
      return undefined;
  }
}

export async function cleanUpConfig(config) {
  // Configuration of the internal network is optional and may contains no, one or several networks

  if (config.activate_log) {
    config.activate_log = true;
  } else {
    config.activate_log = false;
  }
  // check the url of the server handling the private keys if not metamask
  if ( !Array.isArray(config.networks)) config.networks = [];
  const explorers = config.explorers||{};
  for (const chainId in explorers) {
    const url = explorers[chainId];
    if (!parseUrl(url, ["http", "https"])) {
      delete explorers[chainId];
    }
  }
  config.explorers = explorers;

  for (const network of config.networks) {
    if (!parseUrl(network.nodeUrl, ["http", "https", "ws", "wss"])) {
      delete network.nodeUrl;
    }
    if (!parseUrl(network.walletCustodyAPIBaseUrl, ["http", "https"])) {
        delete network.walletCustodyAPIBaseUrl
    }
    if (!parseUrl(network.explorerUrl, ["http", "https"])) {
      delete network.explorerUrl;
    }
    if (!network.explorerUrl) { // try to find a url in the explorers field
      if (config.explorers[network.chainID]) {
        network.explorerUrl = config.explorers[network.chainID];
      }
    }
    // may add later some other verifications like the chain id matches the node 
  }
  if (config.networks.length==0) {
    config.networks.push({name: "No network defined in the configuration"})
  }
  return config;
}

export function getDefaultNetwork(config) {
  let result = config.networks.find( n=>n.default );
  if (!result && config.networks.length>0) result = config.networks[0];
  return result;
}

export function changeDefaultNetwork(config, url) {
  for (const network of config.networks) {
    if (network.nodeUrl == url) {
      network.default = true;
    } else {
      network.default = false;
    }
  }
  return config;
}

export function getNetworkList(config) {
  return config.networks;
}

export function getExplorerUrl(config, chainID) {
  if (!config) return undefined;
  if (!chainID) { // assume the default config
    const network = getDefaultNetwork(config)
    if (network && network.chainID) {
      if (network.explorerUrl) return network.explorerUrl;
      else return getExplorerUrl(config, network.chainID);
    } else {
      return undefined;
    }
  } else { // use the chain ID
    if (config.explorers[chainID]) {
      return config.explorers[chainID];
    } 
  }
  return undefined;
}