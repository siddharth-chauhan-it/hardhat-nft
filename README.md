# Hardhat NFT

A project to create various types of NFTs, both on-chain and off-chain, testing and deploying NFT smart contracts on Sepolia Testnet using Hardhat. The project uses Chainlink VRF to set the rarity of the mint instance to produce different NFTs from a single smart contract. The project also uses Chainlink Price Feeds to conditionally mint the NFT based on the price of an asset.

## Scope

1. Basic NFT
2. Random IPFS NFT
3. Dynamic SVG NFT

## Coverage

The project covers the following:

- Ethereum
- Smart Contracts
- Solidity Language
- ABI and bytecode
- Interfaces
- EVM Opcodes
- Function Selector
- Function Signature
- `abi.encode` vs `abi.encodePacked`
- Gas Optimizations
- OpenSea.io
- Chainlink VRF
- Chainlink Price Feeds
- IPFS (InterPlanetary File System)
- Pinnata to host NFT Token URIs (metadata)
- Running Scripts on a Local Node
- Adding Scripts to package.json
- Natspec and styling guide for solidity code
- Hardhat for testing and deployment of the contract
- Using the plugin `hardhat-deploy-ethers`
- Mocha for writing unit tests and staging tests
- CoinMarketCap API to get price in gas reporter
- EtherScan API to verify contract programmatically
