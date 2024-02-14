const { network, getNamedAccounts, ethers, deployments } = require("hardhat");
const { developmentChains } = require("../../helper-hardhat-config");
const { assert, expect } = require("chai");

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("Random IPFS NFT Unit Tests", function () {
      let randomIpfsNft, deployer, vrfCoordinatorV2Mock;

      beforeEach(async () => {
        accounts = await ethers.getSigners();
        deployer = accounts[0];
        await deployments.fixture(["mocks", "randomipfs"]);
        randomIpfsNft = await ethers.getContract("RandomIpfsNft");
        vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock", deployer);
      });

      describe("constructor", () => {
        it("Sets starting values correctly", async function () {
          const dogTokenUriZero = await randomIpfsNft.getDogTokenUris(0);
          const isInitialized = await randomIpfsNft.getInitialized();
          assert(dogTokenUriZero.includes("ipfs://"));
          assert.equal(isInitialized, true);
        });
      });

      describe("requestNft", () => {
        it("Fails if payment isn't sent with the request", async function () {
          await expect(randomIpfsNft.requestNft()).to.be.revertedWithCustomError(
            randomIpfsNft,
            "RandomIpfsNft__NeedMoreETHSent",
          );
        });
        it("Reverts if payment amount is less than the mint fee", async function () {
          const fee = await randomIpfsNft.getMintFee();
          await expect(
            randomIpfsNft.requestNft({
              value: fee - ethers.parseEther("0.001"),
            }),
          ).to.be.revertedWithCustomError(randomIpfsNft, "RandomIpfsNft__NeedMoreETHSent");
        });
        it("Emits an event and kicks off a random word request", async function () {
          const fee = await randomIpfsNft.getMintFee();
          await expect(randomIpfsNft.requestNft({ value: fee.toString() })).to.emit(
            randomIpfsNft,
            "NftRequested",
          );
        });
      });
      describe("fulfillRandomWords", () => {
        it("Mints NFT after random number is returned", async function () {
          await new Promise(async (resolve, reject) => {
            randomIpfsNft.once("NftMinted", async (tokenId, breed, minter) => {
              try {
                const tokenUri = await randomIpfsNft.tokenURI(tokenId.toString());
                const tokenCounter = await randomIpfsNft.getTokenCounter();
                const dogUri = await randomIpfsNft.getDogTokenUris(breed.toString());
                assert.equal(tokenUri.toString().includes("ipfs://"), true);
                assert.equal(dogUri.toString(), tokenUri.toString());
                assert.equal(+tokenCounter.toString(), +tokenId.toString() + 1);
                assert.equal(minter, deployer.address);
                resolve();
              } catch (e) {
                console.log(e);
                reject(e);
              }
            });
            try {
              const fee = await randomIpfsNft.getMintFee();
              const requestNftResponse = await randomIpfsNft.requestNft({
                value: fee.toString(),
              });
              const requestNftReceipt = await requestNftResponse.wait(1);
              await vrfCoordinatorV2Mock.fulfillRandomWords(
                requestNftReceipt.logs[1].args.requestId,
                randomIpfsNft.target,
              );
            } catch (e) {
              console.log(e);
              reject(e);
            }
          });
        });
      });
      describe("getBreedFromModdedRng", () => {
        it("Should return pug if moddedRng < 10", async function () {
          const expectedValue = await randomIpfsNft.getBreedFromModdedRng(7);
          assert.equal(0, expectedValue);
        });
        it("Should return shiba-inu if moddedRng is between 10 - 29", async function () {
          const expectedValue = await randomIpfsNft.getBreedFromModdedRng(21);
          assert.equal(1, expectedValue);
        });
        it("Should return st. bernard if moddedRng is between 30 - 99", async function () {
          const expectedValue = await randomIpfsNft.getBreedFromModdedRng(39);
          assert.equal(2, expectedValue);
        });
        it("Should revert if moddedRng > 99", async function () {
          await expect(randomIpfsNft.getBreedFromModdedRng(100)).to.be.revertedWithCustomError(
            randomIpfsNft,
            "RandomIpfsNft__RangeOutOfBounds",
          );
        });
      });
    });
