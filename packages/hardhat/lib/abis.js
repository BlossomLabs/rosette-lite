const { ethers } = require("hardhat");
const { utils } = require("ethers");
const fetch = require("node-fetch");
const Moralis = require("moralis/node");
const etherscanAPI = require("../hardhat.config").etherscan.apiKey.mainnet;
const { fetchImplementationAddress } = require("./proxies");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function getAbiId(address, provider) {
  return utils.keccak256(await provider.getCode(address));
}

function getAbiEntry(provider) {
  return async (address, delay) => {
    if (!address) {
      return [address, "[]"];
    }
    const abiId = await getAbiId(address, provider);
    await sleep(300 * delay);
    let abi = await fetch(
      `https://api.etherscan.io/api?module=contract&action=getabi&address=${address}&apikey=${etherscanAPI}`
    )
      .then((response) => response.json())
      .then((data) => data.result);
    if (!abi.startsWith("[")) {
      console.error(`ERROR: ${abi}`);
      abi = "[]";
    }
    const functions = JSON.parse(abi)
      .filter((fragment) => fragment.type === "function")
      .map((fragment) => ethers.utils.FunctionFragment.from(fragment))
      .reduce(
        (obj, fragment) => ({
          ...obj,
          [ethers.utils.id(fragment.format()).substring(0, 10)]:
            fragment.format("full"),
        }),
        {}
      );
    return Promise.resolve([abiId, functions]);
  };
}

async function saveAbis(contracts) {
  const signer = (await ethers.getSigners())[0];
  const provider = signer.provider;
  let abis = Object.fromEntries(
    await Promise.all(contracts.map(getAbiEntry(provider)))
  );
  const implementationContracts = await Promise.all(
    contracts.map((addr) => {
      return fetchImplementationAddress(addr, provider);
    })
  );
  const implementationContractsUnique = [
    ...new Set(implementationContracts),
  ].filter((a) => a);

  const implementationAbis = Object.fromEntries(
    await Promise.all(implementationContractsUnique.map(getAbiEntry(provider)))
  );

  abis = { ...abis, ...implementationAbis };

  await Moralis.start({
    appId: "wJZ9qgtJDSP45NSTFK8z8f4SxhHubOugiR8HkvG8",
    serverUrl: "https://uokifrvdpjok.usemoralis.com:2053/server",
    masterKey: "HTF7qXhBrct1SjaeivBYrxfMkGqketNrfgiwJObX",
  });

  const ipfsHashes = [];
  const txHashes = [];

  await Promise.all(
    Object.keys(abis).map(async (abiId) => {
      const object = {
        abiId,
        functions: abis[abiId],
      };

      const file = new Moralis.File(`${object.abiId}.json`, {
        base64: Buffer.from(JSON.stringify(object)).toString("base64"),
      });
      await file.saveIPFS({ useMasterKey: true });
      const abiStore = await ethers.getContract("AbiStore", signer);
      const tx = await (
        await abiStore.setABI(object.abiId, `ipfs:${file.hash()}`)
      ).wait();
      ipfsHashes.push(file.hash());
      txHashes.push(tx.transactionHash);
    })
  );
  return [ipfsHashes, txHashes];
}

module.exports = saveAbis;
