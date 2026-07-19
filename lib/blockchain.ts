import { createPublicClient, createWalletClient, http, parseAbi, type Address } from "viem";
import { privateKeyToAccount } from "viem/accounts";
export const provennAbi = parseAbi(["function storeHash(bytes32 hash)", "function getRecord(bytes32 hash) view returns (bytes32,uint256,address)", "event HashStored(bytes32 indexed hash,address indexed owner,uint256 timestamp)"]);
const chain = { id: Number(process.env.MONAD_CHAIN_ID || 10143), name: "Monad", nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 }, rpcUrls: { default: { http: [process.env.MONAD_RPC_URL || "https://testnet-rpc.monad.xyz"] } } } as const;
const address = process.env.MONAD_CONTRACT_ADDRESS as Address | undefined;
export async function getProof(hash: `0x${string}`) {
  if (!address) return null; const client = createPublicClient({ chain, transport: http() });
  const r = await client.readContract({ address, abi: provennAbi, functionName: "getRecord", args: [hash] });
  if (r[1] === BigInt(0)) return null;
  const logs = await client.getLogs({ address, event: provennAbi[2], args: { hash } });
  return { hash, owner: r[2], timestamp: Number(r[1]), transactionHash: logs.at(-1)?.transactionHash || null };
}
export async function storeManagedProof(hash: `0x${string}`) {
  if (!address || !process.env.MANAGED_WALLET_PRIVATE_KEY) throw new Error("Managed Monad proof is not configured.");
  const existing = await getProof(hash); if (existing) return existing;
  const account = privateKeyToAccount(process.env.MANAGED_WALLET_PRIVATE_KEY as `0x${string}`);
  const wallet = createWalletClient({ account, chain, transport: http() }); const tx = await wallet.writeContract({ address, abi: provennAbi, functionName: "storeHash", args: [hash] });
  return { hash, owner: account.address, timestamp: Math.floor(Date.now()/1000), transactionHash: tx };
}
