import { parseAbi, type Address } from "viem";

export const provennAbi = parseAbi([
  "function storeHash(bytes32 hash)",
  "function verifyHash(bytes32 hash) view returns (bool)",
  "function getRecord(bytes32 hash) view returns (bytes32,uint256,address)",
  "event HashStored(bytes32 indexed hash,address indexed owner,uint256 timestamp)",
]);

export const monadChain = {
  id: Number(
    process.env.NEXT_PUBLIC_MONAD_CHAIN_ID || process.env.MONAD_CHAIN_ID || 10143,
  ),
  name: "Monad",
  nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
  rpcUrls: {
    default: {
      http: [
        process.env.NEXT_PUBLIC_MONAD_RPC_URL ||
          process.env.MONAD_RPC_URL ||
          "https://testnet-rpc.monad.xyz",
      ],
    },
  },
} as const;

export function contractAddress() {
  let address = (
    process.env.NEXT_PUBLIC_MONAD_CONTRACT_ADDRESS ||
    process.env.MONAD_CONTRACT_ADDRESS ||
    ""
  ).trim();
  if (!address) return undefined;
  if (!address.startsWith("0x")) address = `0x${address}`;
  if (!/^0x[0-9a-fA-F]{40}$/.test(address)) return undefined;
  return address as Address;
}

export function explorerBase() {
  return (
    process.env.NEXT_PUBLIC_MONAD_EXPLORER_URL ||
    process.env.MONAD_EXPLORER_URL ||
    "https://testnet.monadexplorer.com"
  ).replace(/\/$/, "");
}
