import { BigInt, Address } from "@graphprotocol/graph-ts";
import {
  AbiStore,
  SetABI,
} from "../generated/AbiStore/AbiStore";
import { ABI, Bytecode } from "../generated/schema";

export function handleSetABI(event: SetABI): void {
  let bytecodeId = event.params.bytecodeId.toHexString();

  let bytecode = Bytecode.load(bytecodeId);

  if (bytecode === null) {
    bytecode = new Bytecode(bytecodeId);
    bytecode.createdAt = event.block.timestamp;
    bytecode.count = BigInt.fromI32(1);
  } else {
    bytecode.count = bytecode.count.plus(BigInt.fromI32(1));
  }

  let abi = new ABI(event.params.abiIpfs);

  abi.content = event.params.abiIpfs;
  abi.createdAt = event.block.timestamp;
  abi.transactionHash = event.transaction.hash.toHex();

  abi.save();
  bytecode.save();
}
