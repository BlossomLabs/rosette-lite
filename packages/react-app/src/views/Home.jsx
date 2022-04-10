import { ethers } from "ethers";
import React, { useState, useEffect } from "react";
import { useTxDecoder } from "../hooks";

const nftxAgent = "0x40d73df4f99bae688ce3c23a01022224fe16c7b2";
const initBlock = 11260978;
const first = 100;
const skip = 0;

/**
 * web3 props can be passed from '../App.jsx' into your local view component for use
 * @param {*} yourLocalBalance balance on current network
 * @param {*} readContracts contracts from current chain already pre-loaded using ethers contract module. More here https://docs.ethers.io/v5/api/contract/contract/
 * @returns react component
 **/
function Home({ mainnetProvider }) {
  const [decodedTxs, setDecodedTxs] = useState([]);
  const decode = useTxDecoder();

  useEffect(() => {
    (async function () {
      if (mainnetProvider && decode) {
        console.log(decode)
        const c = new ethers.Contract(
          nftxAgent,
          ["event Execute(address indexed sender, address indexed target, uint256 ethValue, bytes data)"],
          mainnetProvider,
        );

        const decoded = await Promise.all(
          (
            await c.queryFilter(c.filters.Execute(), initBlock)
          )
            .map(e => ({ target: e.args.target, data: e.args.data }))
            .slice(skip, skip + first)
            .map(decode),
        );
        setDecodedTxs(decoded);
      }
    })();
  }, [mainnetProvider, decode]);

  return (
    <div>
      <h1>Aragon Agent: {nftxAgent}</h1>
      <ul>
        {decodedTxs.map(tx => (
          <li>{tx}</li>
        ))}
      </ul>
    </div>
  );
}

export default Home;
