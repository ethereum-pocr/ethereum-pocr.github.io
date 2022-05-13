const fs = require('fs');

const configFilePath = "./dist/config.json"
const replacementMap = {
  "CUSTODY_SVR_URL": "http://localhost:8081",
  "NODE_URL": "ws://kerleano-client.francecentral.cloudapp.azure.com:8546"
}

console.log(`Updating the ${configFilePath} file with the environment vars`)
let content = fs.readFileSync(configFilePath, "utf8");

for (const key in replacementMap) {
  if (Object.hasOwnProperty.call(replacementMap, key)) {
    const currentVal = replacementMap[key];
    if (key in process.env) {
      const regex = new RegExp(currentVal, "gi");
      content = content.replace(regex, process.env[key]);
    } else {
      console.warn("WARN: Missing env variable", key)
    }
  }
}

// console.log(content);

fs.writeFileSync(configFilePath, content, "utf8");
