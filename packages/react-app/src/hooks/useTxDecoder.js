import { utils } from "ethers";

import { fetchImplementationAddress } from "../helpers/proxies";

const functions = {};
const abis = {};

// const etherscanAPI = "DNXJA8RX2Q3VZ4URQIWP7Z68CJXQZSC6AW";
// const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

export default function useTxDecoder(provider, readContracts) {
  async function getAbiId(address) {
    if (!address) return null;
    return utils.keccak256(await provider.getCode(address));
  }

  // async function getAbiFromEtherscan(address, delay) {
  //   if (!address) {
  //     return [address, "[]"];
  //   }
  //   if (!abis[address]) {
  //     await sleep(300 * delay);
  //     let abi = await fetch(
  //       `https://api.etherscan.io/api?module=contract&action=getabi&address=${address}&apikey=${etherscanAPI}`,
  //     )
  //       .then(response => response.json())
  //       .then(data => data.result);
  //     if (!abi.startsWith("[")) {
  //       console.error(`ERROR: ${abi}`);
  //       abi = "[]";
  //     }
  //     abis[address] = JSON.parse(abi)
  //       .filter(fragment => fragment.type === "function")
  //       .map(fragment => utils.FunctionFragment.from(fragment))
  //       .reduce(
  //         (obj, fragment) => ({
  //           ...obj,
  //           [utils.id(fragment.format()).substring(0, 10)]: fragment.format("full"),
  //         }),
  //         {},
  //       );
  //   }
  //   return abis[address];
  // }

  async function getAbiFromIPFS(contract, store) {
    if (contract && !abis[contract]) {
      const id = await getAbiId(contract);
      const ipfs = await store.abis(id);
      if (ipfs) {
        abis[contract] = fetch(`https://gateway.moralisipfs.com/ipfs/${ipfs.substring(5)}`)
          .then(data => data.json())
          .then(obj => obj.functions);
      }
    }
    return abis[contract] || {};
  }

  async function getFunctions(contract, store) {
    if (contract && !functions[contract]) {
      const contractFunctions = await getAbiFromIPFS(contract, store);
      const impl = await fetchImplementationAddress(contract, provider);
      const implementationFunctions = await getAbiFromIPFS(impl, store);

      functions[contract] = { ...contractFunctions, ...implementationFunctions };
    }
    return functions[contract] || [];
  }

  async function decode(tx, store) {
    if (!tx) return;
    const functions = await getFunctions(tx.target, store);
    const func = functions[tx.data.substring(0, 10)];

    if (!func) {
      return `Execute 'unknown function (${tx.data.substring(0, 10)})' on ${tx.target}`;
    }
    const f = utils.Fragment.from(func);
    const params = new utils.Interface([func]).decodeFunctionData(f.name, tx.data);
    return `Execute '${f.name}({ ${f.inputs.map((x, i) => `${x.name}: "${params[i]}"`).join(", ")} })' on ${tx.target}`;
  }
  return decode;
}
