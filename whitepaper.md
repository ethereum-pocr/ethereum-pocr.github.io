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

Nodes will make efforts in improving the carbon footprint of their IT infrastructure if they are given a financial incentive to do so.   
The **Proof of Carbon Reduction** consensus therefore aims at aligning the reward of a block to the quality of the carbon footprint of the infrastructure.   
This implies that the nodes can proove their level of carbon emission of their infrastructure to the rest of the network in a trustable and public way.   

The consensus intends to put the nodes in competition for the best carbon footprint since the lower the footprint the higer the reward, and the absence of progress on the carbon footprint could disqualify the node from any reward.   
The reward will be denominated in the native crypto currency of this new public blockchain and therefore, like any other shared infrastructure, the reward will gain a monetary value by the increased usage on the infrastructure. So the earning of a node will be higher if the node can demonstrate to run with a better setup than the average of the nodes.

We introduce here the notion of the average footprint of the nodes and we believe this is an important factor of long term success.   
The competition between the nodes will push the actors to favor better ecological equipments and progressively all nodes will improve the footprint by getting these equipments. This global improvement should not stop the competition but set new challenges. As all the nodes improve, the average improve. The best node yesterday can lag behind the average if it stop improving while other do. 
Therefore, we can look at the average footprint of the nodes as the level to beat in this competition that never stop. 

Will we reach a zero footprint impact ? If so we would have achieved something good : An IT infrastructure that has no negative impact on the planet !   
Note that we should therefore exclude carbon compensation scheme in the measurement of the node without preventing actors to compensate if they wish to do so. 



## 3. Calculating the carbon footprint of a node

Let's detail now how the carbon footprint of a node is estimated, recorded, shared and made trustable. 

An IT software cannot (yet) determine by itself the energy, CO2, and other environmental factors that it has an impact on. Therefore the nodes will rely on the expertise of external parties to assess the node infrastructure. 

First, the research suggest that a large part (70%) of the environmental impact of IT infrastructure comes from the construction and shipment of the hardware before it is even first used. Another important part is linked to the management of the end of life of the equipments after it has been put out of use. So it is critical that the node assessment is done on the full lifecycle (construction, shipment, installation, usage, end of life) of the various parts that constitute a node : computer hardware, storage units, network appliances, cooling systems, electricity sources etc.

Then it is important that we can apply consistently the same assessment methodology across all nodes, across multiple data center and geography, and across time. Such a methodology must therefore be designed by experts in this field of research.   

Typically, the footprint of a node will be measured in "greenhouse gas" emissions following the [IPCC 100 years methodology](https://www.ipcc.ch/site/assets/uploads/2018/02/ar4-wg1-chapter2-1.pdf) and be expressed in kg of CO2 equvalent.

**TO BE COMPLETED AFTER THE PARTNER IS SELECTED WITH THE METHOLOGY**

Since nodes themselves, as IT software cannot self assess their setup, since there are financial implications (the blocks rewards) in making this assessment node owners cannot be trusted to self assess their nodes either. So external trustable parties, with at least their names at stake, should be entrusted to analyse the nodes setup.    
As it is important to maintain, as much as possible, a distribution of roles and avoid unique actors and centralization, these parties must be multiple and remain independant and in competition. We will refer to these parties as node auditors or node carbon footprint agency with a role similar to the rating agencies we have in the financial sector. 

These node auditors will be mandated by the node owner to assess their IT infrastructure and must follow the defined methodology and be in a position to demonstrate that the methodology has been followed. Once an assessment is done on a node, they will record in the Blockchain the carbon footprint of the node under their signature (i.e. making a blockchain transaction with their individual private keys). 

Only conformant auditors will be authorized to record the result of an audit in the chain. The community of node owners will have the right to vote in or out an auditor with a majority + 1. Auditors will be encouraged to review the audits of their peers and expose any wrong doing. One additional way to ensure auditors honesty would be to have the auditors set an amount of crypto currency at stake to be allowed to record the result of an audit. If an auditor is voted out it will loose it's stake. If the auditor decide to exit its stake, it can do so only after a given period (to be defined) since it's last audit to give enough time for external actors to eventually expose the auditor. The amount at stake can be defined as a function of the number of audits performed. **TO BE FURTHER DEVELOPPED**. 

Node owners identity will have to be known and be transparent to the community. They cannot be also auditors as it would possibly create a conflict of interests.   
The identity of the node owners should be known because the auditors will need to collect documentation and data and ensure that these are the actual figures of the nodes. 
The identity of the node owners are also expected to be public to enable public display of the nodes activities. Finally, as we will see in the next section the identity of the nodes will be important to decide to allow a new member in the groupe of block builders. 

## 4. Deriving from the proof of authority consensus

This new blockchain wants to offer an alternative to the market by being a public "green blockchain" that has also an important throughput compare to existing public blockchains. The financial sector in particular and many large corporate businesses is looking for such a blockchain since they have taken ESG commitment and they cannot afford to have their name linked to an energy intensive infrastructure.    
In addition, the regulated markets have difficulties to accept working on public infrastructures where the crypto currency can fuel unknown actors that would potentially be suject to sanctions or linked to illegal activities. Therefore, there is a need for an open public infrastructure, yet cleared from disqualified actors for these sectors of businesses.   

The `proof of authority` consensus is designed to only allow a known set of nodes to create blocks. In particular the [clique](https://eips.ethereum.org/EIPS/eip-225) implementation proposed in EIP 255 of the Ethereum community, defined a replacement for the `oroof of work` consensus that would be a good base to implement the `proof of carbon reduction` consensus.

In the clique consensus, nodes are identified by an ethereum address corresponding to the private key with which they will sign their blocks. Nodes do not receive rewards for creating blocks and they are not put in competition. The list of authorized nodes (addresses) are simply requested to create blocks, in turn, at a regular frequency. They are called sealers in this consensus as they simply apply their signature on a block. The other nodes receiving this newly created block will verify that the block is valid and that the sealer is legit, before adding it into their copy of the chain. If the expected sealer did not send a block in the given timeframe, any block is allowed to take its place, ensuring redundancy in case of a node failure.

At the genesis of the chain, a single sealer is enough. It can allow new sealers in the consensus by voting in its address. Each new sealer needs to be voted in by at least N/2 + 1 existing sealers, N being the total number of authorized sealers. Similarly, a node that is not acting positively in the consensus can be voted out by at least N/2 + 1 nodes to be excluded from the consensus.

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
