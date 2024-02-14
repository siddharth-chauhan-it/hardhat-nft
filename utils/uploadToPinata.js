const pinataSDK = require("@pinata/sdk");
const path = require("path");
const fs = require("fs");

const pinataApiKey = process.env.PINATA_API_KEY;
const pinataApiSecret = process.env.PINATA_API_SECRET;
const pinata = new pinataSDK(pinataApiKey, pinataApiSecret); // Setup the pinata

async function storeImages(imagesFilePath) {
  const fullImagesPath = path.resolve(imagesFilePath);
  const files = fs.readdirSync(fullImagesPath);

  console.log("-----------------------Uploading to Pinata!-----------------------");

  let responses = [];
  for (fileIndex in files) {
    console.log(`Uploading ${files[fileIndex]}...`);
    const readableStreamForFile = fs.createReadStream(`${fullImagesPath}/${files[fileIndex]}`);
    try {
      const response = await pinata.pinFileToIPFS(readableStreamForFile, {
        pinataMetadata: {
          name: files[fileIndex],
        },
      });
      responses.push(response);
    } catch (error) {
      console.log(error);
    }
  }
  return { responses, files };
}

async function storeTokenUriMetadata(metadata) {
  try {
    const response = await pinata.pinJSONToIPFS(metadata);
    return response;
  } catch (error) {
    console.log(error);
  }
  return null;
}

module.exports = { storeImages, storeTokenUriMetadata };
