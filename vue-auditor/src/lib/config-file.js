

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

  // check the url of the server handling the private keys if not metamask
  if ( !Array.isArray(config.networks)) config.networks = [];
  for (const network of config.networks) {
    if (!parseUrl(network.nodeUrl, ["http", "https", "ws", "wss"])) {
      delete network.nodeUrl;
    }
    if (!parseUrl(network.walletCustodyAPIBaseUrl, ["http", "https"])) {
        delete network.walletCustodyAPIBaseUrl
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