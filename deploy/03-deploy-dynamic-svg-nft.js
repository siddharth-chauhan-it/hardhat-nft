const fs = require("fs");
const { ethers, network, getNamedAccounts, deployments } = require("hardhat");
const { developmentChains, networkConfig } = require("../helper-hardhat-config");
const { verify } = require("../utils/verify");

// module.exports = async function ({ getNamedAccounts, deployments }) {
module.exports = async function () {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();

  const chainId = network.config.chainId;
  let ethUsdPriceFeedAddress;

  if (developmentChains.includes(network.name)) {
    const ethUsdAggregator = await ethers.getContract("MockV3Aggregator");
    ethUsdPriceFeedAddress = ethUsdAggregator.target;
  } else {
    ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"];
  }

  const lowSVG = fs.readFileSync("./images/dynamicNFT/frown.svg", { encoding: "utf8" });
  const highSVG = fs.readFileSync("./images/dynamicNFT/happy.svg", { encoding: "utf8" });

  const args = [ethUsdPriceFeedAddress, lowSVG, highSVG];

  // Deploy the contract
  log("-----------------------Deploying DynamicSvgNft!-----------------------");
  const dynamicSvgNft = await deploy("DynamicSvgNft", {
    from: deployer,
    args: args,
    log: true,
    waitConfirmations: network.config.blockConfirmations || 1,
  });
  log("----------------------DynamicSvgNft Deployed!----------------------");

  // Verify the contract on testnet or mainnet
  if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
    log("------------------------Verifying Contract------------------------");
    await verify(dynamicSvgNft.address, args);
  }

  log("---------------------------End Of Script----------------------------");
};

module.exports.tags = ["all", "dynamicsvg", "main"];
