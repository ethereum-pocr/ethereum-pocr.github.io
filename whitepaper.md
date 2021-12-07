# Proof of Carbon Reduction Whitepaper

2021 has seen an increase of the financial sector adoption of the public blockchains to host financial instruments and to operate their ownership trasnfer against cash instruments (CBDC, Stable coins ...).

Large institutions, public and private, in Europe and Asia mostly, are investing and are pushing their market to invest in the blockchain sector, considering that the blockchain technology can become progressively a substitute infrastructure for the financial market.

Indeed, public blockchains are an IT infrastructure run by parties with motivations independant of the infrastructure usage.   
This paper is not about discussing the history and background of blockchains, but let's just remind ourself that the main reason why nodes run consistently a consensus based infrastructure is because of their individual interest in earning a crypto currency they can sell to the highest bidder.

In this paper we propose a new consensus at the base of a new public blockchain to embed an incentive to improve the ecological impacts of the IT infrastructure.  

## 1. The problem to solve

The human civilisation is in an era where the ecological impacts of its activities has become a growing concern and this concern is becoming a driving force for multiple policies. These policies are helping but they are often hindered by the additional financial investment that positive ecological impacts takes.   
Human nature is often driven by self interests that sometime coincide with the common interest but sometime doesn't. And it appears that in the ecological situation the global interest is often not aligned with self interest.

In the sole scope of IT infrastructure, the demand for storage, network and computational power is increasing and these services requires energy, rare materials and often use hardware insufficiently recycled. If research and development exists in improving the ecological quality of the infrastructures, we believe it could be increased.

Blockchain technologies, concretized by Satoshi Nakamoto with bitcoin, and improved by Vitalik Butterin with Ethereum, and many others since, have exploited self interest of individual to create a greater good in the form of a shared IT distributed infrastructure used to securely transfer value and run computational and storage logics with no central authority. The self interest leveraged by this type technology is the earning of a new form of asset (called crypto currencies) that obtain a monetary value when sold to those who need to use the IT infrastructure it powers.

This paper will not document, nor explain, the fundamentals of a public blockchain and the readers are directed to the 2 most relevant whitepapers for [Bitcoin](https://bitcoin.org/bitcoin.pdf) and [Ethereum](https://ethereum.org/en/whitepaper/). Plenty of litterature exists on this subject and the reader is expected to understand the principles that construct public blockchains.    
However we have to make a focus on the consensus algorithm that drives the blockchain infrastructures. These algorithms are designed as a set of rules that all individual parties (nodes) in the network must be able to follow independently to construct and propose new blocks and to validate new blocks received from other nodes. It is the collective behaviour of the individual decisions that form the network and the infrastructure and it generally takes the form of a competition. 

The most commonly known consensus is the `Proof of Work` (Bitcoin, Ethereum) where any node is allowed to propose a new block as long as it is has a coherent structure (linked to the head of the chain, valid transactions ...) and has a valid hash that implies a lots of computation. If very robust, the proof of work consensus has a very negative image due to the very high level of energy consumption that nodes must put to participate into the competition of building blocks ([The Energy Consumption of Blockchain Technology: Beyond Myth](https://link.springer.com/article/10.1007/s12599-020-00656-x) ). Beyond the image there is a reality that such technology is not sustainable.

Ethereum is migrating its consensus to the `Proof of Stake` (2022) and other public blockchain are already running on such protocol (Tezos, Polkadot, Hedera). In proof of stake the energy consumption is strongly reduced since the competition to create the block is replaced by a pseudo-random selection of the node base on their stake of crypto currency. Hence the need for redundant calculation of finding a valid block is removed from the consensus lowering the energy consumption by a 100 thousand factor. 

Proof of Stake is indeed a huge progress, yet there is no incentive for the nodes to optimize their energy consumption and use computing hardware that are optimal.

In this whitepaper, we propose to develop a new consensus that will incentivize the the nodes to select the best setup to run their node and enter into a competition for continuous improvement of their hardware, not only on the energy consumption but also in the ecological impact of the lifecycle of the infrastructure they choose to use. We call this consensus the `Proof of Carbon Reduction` or `PoCR`.

## 2. The mechanic of incentivizing carbon footprint reduction 

## 3. Calculating the carbon footprint of a node

Cannot yet be automated and embeded in a consensus, hence required external parties, taking the form of oracle, to feed the info.


## 4. Deriving from the proof of authority consensus

The financial sector requirement for known sealers/miners

## 5. Calculating the reward of a node and the incentive scheme (Tokenomics)

## 6. Monetary policy of the CTC crypto currency

## 7. Implementing the consensus

Starting with the go version (why?)

## 8. Attack vectors and remediations


## 9. Opening to the community

## 10. References

* [The Energy Consumption of Blockchain Technology: Beyond Myth](https://link.springer.com/article/10.1007/s12599-020-00656-x)
* [Energy Footprint of Blockchain Consensus Mechanisms Beyond Proof-of-Work](https://arxiv.org/pdf/2109.03667.pdf)
* [Green-PoW: An Energy-Efficient Blockchain Proof-of-Work Consensus Algorithm](https://arxiv.org/pdf/2007.04086.pdf)
