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

    let transactionHash: string | null = null;
    try {
      const logs = await client.getLogs({
        address,
        event: hashStoredEvent,
        args: { hash },
      });
      transactionHash = logs.at(-1)?.transactionHash || null;
    } catch {
      // Record exists even if log lookup fails (RPC range limits, etc.).
    }

    return {
      hash,
      owner: record[2],
      timestamp: Number(record[1]),
      transactionHash,
    };
  } catch {
    return null;
  }
}

function managedPrivateKey() {
  let key = (process.env.MANAGED_WALLET_PRIVATE_KEY || "").trim();
  if (!key) return null;
  if (!key.startsWith("0x")) key = `0x${key}`;
  if (!/^0x[0-9a-fA-F]{64}$/.test(key)) {
    throw new Error(
      "MANAGED_WALLET_PRIVATE_KEY must be a 0x-prefixed 32-byte hex private key.",
    );
  }
  return key as `0x${string}`;
}

export async function storeManagedProof(
  hash: `0x${string}`,
): Promise<{ proof: ProofRecord; alreadySecured: boolean }> {
  const address = contractAddress();
  const privateKey = managedPrivateKey();
  if (!address || !privateKey) {
    throw new Error("Managed Monad proof is not configured.");
  }

  const existing = await getProof(hash);
  if (existing) return { proof: existing, alreadySecured: true };

  const account = privateKeyToAccount(privateKey);
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
    proof: {
      hash,
      owner: account.address,
      timestamp: Math.floor(Date.now() / 1000),
      transactionHash: tx,
    },
    alreadySecured: false,
  };
}
