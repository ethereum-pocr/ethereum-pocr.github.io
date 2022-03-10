const clientId = "bf96b738-483a-4b00-8147-5bad2acf06ac";

export async function refreshAccessToken(refreshToken) {
  var urlencoded = new URLSearchParams();
  urlencoded.append("grant_type", "refresh_token");
  urlencoded.append(
    "refresh_token",
    refreshToken
  );
  urlencoded.append("client_id", clientId);
  urlencoded.append("scope", "broker.read openid");

  var myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/x-www-form-urlencoded");

  var requestOptions = {
    method: "POST",
    headers: myHeaders,
    body: urlencoded,
    redirect: "follow",
  };


  const res = await fetch("https://trusstee.io/broker/token", requestOptions)
  if (res.ok) {
    return await res.json();
  } else {
    throw new Error("Fail refreshing token "+res.statusText);
  }
}

export async function silentRelogin(currentIssuer) {
  if (!window.Trusstee) throw new Error("Trusstee script not initialized");
  const config = await window.Trusstee.createConfiguration({
    issuer: "https://trusstee.io/broker",
    client_id: clientId,
    idp_hint: currentIssuer
  });
  const tokens = await window.Trusstee.silentOIDCLogin.promise(config);
  return tokens;
}

export async function popupLogin(currentIssuer) {
  if (!window.Trusstee) throw new Error("Trusstee script not initialized");
  const config = await window.Trusstee.createConfiguration({
    issuer: "https://trusstee.io/broker",
    client_id: clientId,
    idp_hint: currentIssuer,
  });
  const tokens = await window.Trusstee.popupOIDCLogin.promise(config);
  return tokens;
}