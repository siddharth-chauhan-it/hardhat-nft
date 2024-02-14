// SPDX-License-Identifier: MIT

pragma solidity ^0.8.8;

import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";
// import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// Error Codes
error RandomIpfsNft__AlreadyInitialized();
error RandomIpfsNft__RangeOutOfBounds();
error RandomIpfsNft__NeedMoreETHSent();
error RandomIpfsNft__TransferFailed();

contract RandomIpfsNft is VRFConsumerBaseV2, ERC721URIStorage, Ownable {
  // Type Declaration
  enum Breed {
    PUG,
    SHIBA_INU,
    ST_BERNARD
  }

  // Chainlink VRF Variables
  VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
  uint64 private immutable i_subscriptionId;
  bytes32 private immutable i_gasLane;
  uint32 private immutable i_callbackGasLimit;
  uint16 private constant REQUEST_CONFIRMATIONS = 3;
  uint32 private constant NUM_WORDS = 1;

  // VRF Helpers
  mapping(uint256 => address) public s_requestIdToSender;

  // NFT Variables
  uint256 public s_tokenCounter;
  uint256 internal constant MAX_CHANCE_VALUE = 100;
  string[] internal s_dogTokenUris;
  uint256 internal immutable i_mintFee;
  bool private s_initialized;

  // Events
  event NftRequested(uint256 indexed requestId, address indexed requester);
  event NftMinted(uint256 indexed tokenId, Breed indexed dogBreed, address indexed minter);

  constructor(
    address vrfCoordinatorV2,
    uint64 subscriptionId,
    bytes32 gasLane,
    uint32 callbackGasLimit,
    string[3] memory dogTokenUris,
    uint256 mintFee
  ) VRFConsumerBaseV2(vrfCoordinatorV2) ERC721("Random IPFS NFT", "RIN") {
    i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinatorV2);
    i_subscriptionId = subscriptionId;
    i_gasLane = gasLane;
    i_callbackGasLimit = callbackGasLimit;
    _initializeContract(dogTokenUris);
    i_mintFee = mintFee;
    s_tokenCounter = 0;
  }

  function requestNft() public payable returns (uint256 requestId) {
    if (msg.value < i_mintFee) {
      revert RandomIpfsNft__NeedMoreETHSent();
    }
    requestId = i_vrfCoordinator.requestRandomWords(
      i_gasLane, // keyHash / gasLane
      i_subscriptionId,
      REQUEST_CONFIRMATIONS,
      i_callbackGasLimit,
      NUM_WORDS
    );
    s_requestIdToSender[requestId] = msg.sender;
    emit NftRequested(requestId, msg.sender);
  }

  function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override {
    address dogOwner = s_requestIdToSender[requestId];
    uint256 newTokenId = s_tokenCounter;
    s_tokenCounter = s_tokenCounter + 1; // Update the token counter
    uint256 moddedRng = randomWords[0] % MAX_CHANCE_VALUE;
    Breed dogBreed = getBreedFromModdedRng(moddedRng);
    _safeMint(dogOwner, newTokenId);
    _setTokenURI(newTokenId, s_dogTokenUris[uint256(dogBreed)]);
    emit NftMinted(newTokenId, dogBreed, dogOwner);
  }

  function withdraw() public onlyOwner {
    uint256 amount = address(this).balance;
    (bool success, ) = payable(msg.sender).call{value: amount}("");
    if (!success) {
      revert RandomIpfsNft__TransferFailed();
    }
  }

  function getBreedFromModdedRng(uint256 moddedRng) public pure returns (Breed) {
    uint256 cumulativeSum = 0;
    uint256[3] memory chanceArray = getChanceArray();

    // Pug = 0 - 9  (10%)
    // Shiba-Inu = 10 - 39  (30%)
    // St. Bernard = 40 = 99 (60%)
    for (uint256 i = 0; i < chanceArray.length; i++) {
      if (moddedRng >= cumulativeSum && moddedRng < chanceArray[i]) {
        return Breed(i);
      }
      cumulativeSum = chanceArray[i];
    }
    revert RandomIpfsNft__RangeOutOfBounds();
  }

  function _initializeContract(string[3] memory dogTokenUris) private {
    if (s_initialized) {
      revert RandomIpfsNft__AlreadyInitialized();
    }
    s_dogTokenUris = dogTokenUris;
    s_initialized = true;
  }

  // View / Pure Functions
  function getChanceArray() public pure returns (uint256[3] memory) {
    return [10, 30, MAX_CHANCE_VALUE];
  }

  function getMintFee() public view returns (uint256) {
    return i_mintFee;
  }

  function getDogTokenUris(uint256 index) public view returns (string memory) {
    return s_dogTokenUris[index];
  }

  function getInitialized() public view returns (bool) {
    return s_initialized;
  }

  function getTokenCounter() public view returns (uint256) {
    return s_tokenCounter;
  }
}
