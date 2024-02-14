const { ethers, network, getNamedAccounts } = require("hardhat");
const { developmentChains } = require("../helper-hardhat-config");

module.exports = async function () {
  const { deployer } = await getNamedAccounts();

  // Basic NFT
  const basicNft = await ethers.getContract("BasicNft", deployer);
  const basicMintTx = await basicNft.mintNft();
  await basicMintTx.wait(1);
  console.log(`Basic NFT index 0 has tokenURI: ${await basicNft.tokenURI(0)}`);

  // Random IPFS NFT
  const randomIpfsNft = await ethers.getContract("RandomIpfsNft", deployer);
  const mintFee = await randomIpfsNft.getMintFee();
  const randomIpfsNftMintTx = await randomIpfsNft.requestNft({ value: mintFee.toString() });
  const randomIpfsNftMintTxReceipt = await randomIpfsNftMintTx.wait(1);
  // Need to listen for response
  await new Promise(async (resolve, reject) => {
    setTimeout(resolve, 300000); // wait for 5 minutes
    // Setup listener for the event
    randomIpfsNft.once("NftMinted", async () => {
      resolve();
    });
    if (developmentChains.includes(network.name)) {
      const requestId = randomIpfsNftMintTxReceipt.logs[1].args.requestId.toString();
      const vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock", deployer);
      await vrfCoordinatorV2Mock.fulfillRandomWords(requestId, randomIpfsNft.target);
    }
  });
  console.log(`Random IPFS NFT index 0 tokenURI: ${await randomIpfsNft.tokenURI(0)}`);

  // Dynamic SVG NFT
  const highValue = ethers.parseEther("4000");
  const dynamicSvgNft = await ethers.getContract("DynamicSvgNft", deployer);
  const dynamicSvgNftMintTx = await dynamicSvgNft.mintNft(highValue.toString());
  await dynamicSvgNftMintTx.wait(1);
  console.log(`Dynamic SVG NFT index 0 tokenURI: ${await dynamicSvgNft.tokenURI(0)}`);
};

module.exports.tags = ["all", "mint"];
