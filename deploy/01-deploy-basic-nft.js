const { network } = require("hardhat");
const { developmentChains } = require("../helper-hardhat-config");
const { verify } = require("../utils/verify");

module.exports = async function ({ getNamedAccounts, deployments }) {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();

  // Deploy the contract
  log("-----------------------Deploying BasicNFT!-----------------------");
  const args = [];
  const basicNft = await deploy("BasicNft", {
    from: deployer,
    args: args,
    log: true,
    waitConfirmations: network.config.blockConfirmations || 1,
  });
  log("------------------------BasicNFT Deployed!------------------------");

  // Verify the contract on testnet or mainnet
  if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
    log("------------------------Verifying Contract------------------------");
    await verify(basicNft.address, args);
  }

  log("--------------------------End Of Script---------------------------");
};

module.exports.tags = ["all", "basicnft", "main"];
