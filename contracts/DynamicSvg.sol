// SPDX-License-Identifier: MIT

pragma solidity ^0.8.8;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

// Error Codes
error ERC721Metadata__URI_QueryFor_NonExistentToken();

contract DynamicSvgNft is ERC721 {
  // Variables
  uint256 private s_tokenCounter;
  string private i_lowImageURI;
  string private i_highImageURI;
  AggregatorV3Interface internal immutable i_priceFeedAddress;

  // Mappings
  mapping(uint256 => int256) public s_tokenIdToHighValue;

  // Events
  event CreatedNFT(uint256 indexed tokenId, int256 highValue);

  constructor(
    address priceFeedAddress,
    string memory lowSvg,
    string memory highSvg
  ) ERC721("Dynamic SVG NFT", "DSN") {
    s_tokenCounter = 0;
    i_lowImageURI = svgToImageURI(lowSvg);
    i_highImageURI = svgToImageURI(highSvg);
    i_priceFeedAddress = AggregatorV3Interface(priceFeedAddress);
  }

  function svgToImageURI(string memory svg) public pure returns (string memory) {
    string memory baseURL = "data:image/svg+xml;base64,";
    string memory svgBase64Encoded = Base64.encode(bytes(string(abi.encodePacked(svg))));
    return string(abi.encodePacked(baseURL, svgBase64Encoded));
  }

  function mintNft(int256 highValue) public {
    uint256 newTokenId = s_tokenCounter;
    s_tokenIdToHighValue[newTokenId] = highValue;
    _safeMint(msg.sender, newTokenId);
    s_tokenCounter = s_tokenCounter + 1;
    emit CreatedNFT(newTokenId, highValue);
  }

  function _baseURI() internal pure override returns (string memory) {
    return "data:application/json;base64,";
  }

  function tokenURI(uint256 tokenId) public view override returns (string memory) {
    // require(_exists(tokenId), "URI Query for non-existent token");
    if (!_exists(tokenId)) {
      revert ERC721Metadata__URI_QueryFor_NonExistentToken();
    }

    (, int256 price, , , ) = i_priceFeedAddress.latestRoundData();
    string memory imageURI = i_lowImageURI;
    if (price >= s_tokenIdToHighValue[tokenId]) {
      imageURI = i_highImageURI;
    }

    return
      string(
        abi.encodePacked(
          _baseURI(),
          Base64.encode(
            bytes(
              abi.encodePacked(
                '{"name":"',
                name(),
                '", "description":"An NFT that changes based on the Chainlink Feed", ',
                '"attributes": [{"trait_type": "coolness", "value": 100}], "image":"',
                imageURI,
                '"}'
              )
            )
          )
        )
      );
  }

  // View / Pure Functions
  function getLowSVG() public view returns (string memory) {
    return i_lowImageURI;
  }

  function getHighSVG() public view returns (string memory) {
    return i_highImageURI;
  }

  function getPriceFeed() public view returns (AggregatorV3Interface) {
    return i_priceFeedAddress;
  }

  function getTokenCounter() public view returns (uint256) {
    return s_tokenCounter;
  }
}
