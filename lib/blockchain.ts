import {
  createPublicClient,
  createWalletClient,
  http,
  parseAbiItem,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import {
  contractAddress,
  explorerBase,
  monadChain,
  provennAbi,
} from "./chain";
import type { ProofRecord } from "./types";

export {
  contractAddress,
  explorerBase,
  monadChain,
  provennAbi,
} from "./chain";

const hashStoredEvent = parseAbiItem(
  "event HashStored(bytes32 indexed hash, address indexed owner, uint256 timestamp)",
);

export function publicClient() {
  return createPublicClient({ chain: monadChain, transport: http() });
}

export async function getProof(hash: `0x${string}`): Promise<ProofRecord | null> {
  const address = contractAddress();
  if (!address) return null;

  try {
    const client = publicClient();
    const record = await client.readContract({
      address,
      abi: provennAbi,
      functionName: "getRecord",
      args: [hash],
    });
    if (record[1] === BigInt(0)) return null;

    const logs = await client.getLogs({
      address,
      event: hashStoredEvent,
      args: { hash },
    });

    return {
      hash,
      owner: record[2],
      timestamp: Number(record[1]),
      transactionHash: logs.at(-1)?.transactionHash || null,
    };
  } catch {
    return null;
  }
}

export async function storeManagedProof(hash: `0x${string}`): Promise<ProofRecord> {
  const address = contractAddress();
  if (!address || !process.env.MANAGED_WALLET_PRIVATE_KEY) {
    throw new Error("Managed Monad proof is not configured.");
  }

  const existing = await getProof(hash);
  if (existing) return existing;

  const account = privateKeyToAccount(
    process.env.MANAGED_WALLET_PRIVATE_KEY as `0x${string}`,
  );
  const wallet = createWalletClient({
    account,
    chain: monadChain,
    transport: http(),
  });
  const tx = await wallet.writeContract({
    address,
    abi: provennAbi,
    functionName: "storeHash",
    args: [hash],
    chain: monadChain,
    account,
  });

  return {
    hash,
    owner: account.address,
    timestamp: Math.floor(Date.now() / 1000),
    transactionHash: tx,
  };
}
