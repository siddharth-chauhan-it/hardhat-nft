const { ethers, network } = require("hardhat");
const { developmentChains, networkConfig } = require("../helper-hardhat-config");
const { verify } = require("../utils/verify");
const { storeImages, storeTokenUriMetadata } = require("../utils/uploadToPinata");

const VRF_SUB_FUND_AMOUNT = ethers.parseEther("2");

const imagesLocation = "./images/randomNft/";

const metadataTemplate = {
  name: "",
  description: "",
  image: "",
  attributes: [
    {
      trait_type: "Cuteness",
      value: "100",
    },
  ],
};

// IPFS Hashes generated using handleTokenUris() function
let tokenUris = [
  "ipfs://QmNgzMdmk2QfYcFDJru6hrzVAif8dFvJ98KijVZhqxVEPB",
  "ipfs://QmVhuk7SmSGv5k6LSh2aF3HSHpTB9NGocLmhg32yq6X1oc",
  "ipfs://QmUwk8R9A42rctULQpRqKHZbNSnnu76ibkg6JxXQhebQRj",
];

module.exports = async function ({ getNamedAccounts, deployments }) {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;

  // Get IPFS hashes for images
  if (process.env.UPLOAD_TO_PINATA == "true") {
    tokenUris = await handleTokenUris();
  }

  let vrfCoordinatorV2Address, subscriptionId;

  if (developmentChains.includes(network.name)) {
    const vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock");
    vrfCoordinatorV2Address = vrfCoordinatorV2Mock.target; // Ethers v6
    const tx = await vrfCoordinatorV2Mock.createSubscription();
    const txReceipt = await tx.wait(1);
    subscriptionId = txReceipt.logs[0].args.subId; // Ethers v6

    // Fund the subscription
    await vrfCoordinatorV2Mock.fundSubscription(subscriptionId, VRF_SUB_FUND_AMOUNT);
  } else {
    vrfCoordinatorV2Address = networkConfig[chainId]["vrfCoordinatorV2"];
    subscriptionId = networkConfig[chainId]["subscriptionId"];
  }

  const gasLane = networkConfig[chainId]["gasLane"];
  const callbackGasLimit = networkConfig[chainId]["callbackGasLimit"];
  const mintFee = networkConfig[chainId]["mintFee"];

  const args = [
    vrfCoordinatorV2Address,
    subscriptionId,
    gasLane,
    callbackGasLimit,
    tokenUris,
    mintFee,
  ];

  // Deploy the contract
  log("-----------------------Deploying RandomIpfsNft!-----------------------");
  const randomIpfsNft = await deploy("RandomIpfsNft", {
    from: deployer,
    args: args,
    log: true,
    waitConfirmations: network.config.blockConfirmations || 1,
  });
  log("------------------------RandomIpfsNft Deployed!------------------------");

  log("------Adding RandomIpfsNft as a consumer of VRFCoordinatorV2Mock!------");
  // Ensure the RandomIpfsNft contract is a valid consumer of the VRFCoordinatorV2Mock contract
  if (developmentChains.includes(network.name)) {
    const vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock");
    await vrfCoordinatorV2Mock.addConsumer(subscriptionId, randomIpfsNft.address);
  }

  // Verify the contract on testnet or mainnet
  if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
    log("------------------------Verifying Contract------------------------");
    await verify(randomIpfsNft.address, args);
  }

  log("---------------------------End Of Script----------------------------");
};

async function handleTokenUris() {
  const tokenUris = [];

  // Upload images to pinata IPFS and get the file hashes from the response
  const { responses: imageUploadResponses, files } = await storeImages(imagesLocation);

  // Create metadata for each response file and add it to the tokenUris array
  for (const imageUploadResponseIndex in imageUploadResponses) {
    let tokenUriMetadata = { ...metadataTemplate };
    tokenUriMetadata.name = files[imageUploadResponseIndex].replace(/\b.png|\b.jpg|\b.jpeg/, "");
    tokenUriMetadata.description = `An adorable ${tokenUriMetadata.name} pup!`;
    tokenUriMetadata.image = `ipfs://${imageUploadResponses[imageUploadResponseIndex].IpfsHash}`;
    console.log(`Uploading ${tokenUriMetadata.name}...`);

    // Store the JSON to pinata/IPFS
    const metadataUploadResponse = await storeTokenUriMetadata(tokenUriMetadata);
    tokenUris.push(`ipfs://${metadataUploadResponse.IpfsHash}`);
  }

  console.log("Token URIs Uploaded...");
  console.log(tokenUris);
  return tokenUris;
}

module.exports.tags = ["all", "randomipfs", "main"];
