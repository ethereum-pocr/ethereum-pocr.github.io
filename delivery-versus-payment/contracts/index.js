const {SmartContracts} = require("@saturn-chain/smart-contract");
const combined = require("./combined.json");
module.exports = SmartContracts.load(combined);
