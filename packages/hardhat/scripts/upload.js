const saveAbis = require("../lib/abis");

const contracts = [
  "0x13f89adb711c18F8bC218F5E0Ad508784eB8f4E2",
  "0xAf93fCce0548D3124A5fC3045adAf1ddE4e8Bf7e",
  "0x9C5a36AEf5A7b04b0123b2064BD20bc47183e1DC",
  "0x947c0bfA2bf3Ae009275f13F548Ba539d38741C2",
];

async function main() {
  const [ipfsHashes, txHashes] = await saveAbis(contracts);
  ipfsHashes.forEach((ipfsHash, i) =>
    console.log(
      "File stored in " + ipfsHash + " and saved in AbiStore " + txHashes[i]
    )
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
