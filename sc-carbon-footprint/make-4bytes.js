const fs = require("fs")

try {
  if (process.argv.length != 3) throw new Error("Give the combined.json to analyse")
  const combinedFile = process.argv[2]

  const combined = JSON.parse(fs.readFileSync(combinedFile, "utf-8"))
  const contracts = combined.contracts
  if (!contracts) throw new Error("Invalid combined.json file. Expecting 'contracts'")
  const hashes = {}

  for (const name in contracts) {
    if (Object.hasOwnProperty.call(contracts, name)) {
      const contract = contracts[name];
      const h = contract.hashes
      if (h) {
        for (const def in h) {
          if (Object.hasOwnProperty.call(h, def)) {
            const key = h[def];
            hashes[key] = def
          }
        }
      }
    }
  }
  console.log(JSON.stringify(hashes, null, 2))
} catch (error) {
  console.error(error.message, ". Exiting with error");
  process.exit(1)
}