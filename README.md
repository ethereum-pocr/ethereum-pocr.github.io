# Carbon Footprint smart contract

This contract is intended to be deployed into the genesis block to receive the carbon footprint of the nodes: etherbase --> footprint

IMPORTANT: It should not have any constructor nor any initial value - unless one finds how to initialize these value in the genesis block

The contract will reside at address `0x0000000000000000000000000000000000000100` and therefore is initialized by an `alloc` in the genesis.json file

```json
...
alloc: {
  ...
  "0000000000000000000000000000000000000100": {
      "balance": "0x0",
      "code": "0x608060405234801561001057600080fd5b50600436106100625760003560e01c806303b2ec981461006757806313af40351461008357806346c556cc1461009857806379f85816146100ab5780638da5cb5b146100cb578063b6c3dcf8146100f6575b600080fd5b61007060015481565b6040519081526020015b60405180910390f35b610096610091366004610222565b6100ff565b005b6100966100a6366004610244565b610145565b6100706100b9366004610222565b60006020819052908152604090205481565b6003546100de906001600160a01b031681565b6040516001600160a01b03909116815260200161007a565b61007060025481565b6003546001600160a01b0316158061012157506003546001600160a01b031633145b1561014257600380546001600160a01b0319166001600160a01b0383161790555b50565b6001600160a01b03821660009081526020819052604090205480156101ae5780600260008282546101769190610286565b92505081905550600180600082825461018f9190610286565b90915550506001600160a01b0383166000908152602081905260408120555b8115610201576001600160a01b038316600090815260208190526040812083905560018054909182916101e290839061026e565b9250508190555081600260008282546101fb919061026e565b90915550505b505050565b80356001600160a01b038116811461021d57600080fd5b919050565b60006020828403121561023457600080fd5b61023d82610206565b9392505050565b6000806040838503121561025757600080fd5b61026083610206565b946020939093013593505050565b600082198211156102815761028161029d565b500190565b6000828210156102985761029861029d565b500390565b634e487b7160e01b600052601160045260246000fdfea26469706673582212205b00f20927149b4ca8bcff375dac436d3a1d8921b3eaf6e1010c7506c7f2338564736f6c63430008070033"
    },
  ...
}
...
```

The code is the runtime code of the compiled smart contract **and not the binary of the smart contract compilation**

To obtain this code the working method for the moment is to deploy the smart contract in a dev chain, and then run `eth.getCode(deployedAddress)` to get the code.

It seems that a compilation with the `--bin-runtime` flag does not produce the desired result and makes the contract fail at runtime

**TODO** : a small js tool that take a normal build of the contract, deploy it in a `ganache-core` EVM and extract the runtime code to display it / save it in a file / inject it in the genesis.json file.


## For external use 
The smart contract is intended to be use by Carbon Footprint auditors to set the node footprint in the chain 

They will use the `setFootprint(address, value)` function, that should be restricted to only allowed auditors.

Auditors addresses will need to be added by a governance board. To be defined

## From within the PoCR consensus

The consensus written as a variation of clique / PoA uses the smart contract to retrieve 3 values:
- `nbNodes`: the number of declared nodes with a footprint
- `totalFootprint` : the aggregated sum of carbon footprint of all declared nodes
- `footprint(address)` : the carbon footprint of the node identified by its sealing address (the address allowed to seal block in the PoA consensus)

This items are read only call and from within the go implementation is done in a very direct way by directly using the call signatures (so do not change the names) and sending the input to the EVM:

for instance
```go
func (this *CarbonFootprintContract) footprint(ofNode common.Address) (*big.Int, error) {
	addressString := ofNode.String()
	addressString = addressString[2:]

	input := common.Hex2Bytes("79f85816000000000000000000000000"+addressString)
	result, _, err := runtime.Call(this.ContractAddress, input, this.RuntimeConfig)
	if err != nil {
		log.Error("Impossible to get the carbon footprint", "err", err.Error(), "node", ofNode.String(), "block", this.RuntimeConfig.BlockNumber.Int64())
		return nil, err
	} else {
		return common.BytesToHash(result).Big(), nil
	}
}
```