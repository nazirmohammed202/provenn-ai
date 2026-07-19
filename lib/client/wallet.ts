"use client";

import {
  createWalletClient,
  custom,
  type Address,
  type EIP1193Provider,
} from "viem";
import { provennAbi } from "@/lib/chain";

declare global {
  interface Window {
    ethereum?: EIP1193Provider & {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
    };
  }
}

type ChainConfig = {
  chainId: number;
  chainName: string;
  rpcUrl: string;
  explorerUrl: string;
  contractAddress: Address;
  nativeCurrency: { name: string; symbol: string; decimals: number };
};

async function loadChainConfig(): Promise<ChainConfig> {
  const response = await fetch("/api/chain");
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Monad contract address is not configured.");
  }
  return data;
}

export async function secureWithInjectedWallet(hash: `0x${string}`) {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("No injected wallet found. Install a browser wallet.");
  }

  const config = await loadChainConfig();
  const chain = {
    id: config.chainId,
    name: config.chainName,
    nativeCurrency: config.nativeCurrency,
    rpcUrls: { default: { http: [config.rpcUrl] } },
  } as const;

  const provider = window.ethereum;
  await provider
    .request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: `0x${config.chainId.toString(16)}` }],
    })
    .catch(async () => {
      await provider.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: `0x${config.chainId.toString(16)}`,
            chainName: config.chainName,
            nativeCurrency: config.nativeCurrency,
            rpcUrls: [config.rpcUrl],
            blockExplorerUrls: [config.explorerUrl],
          },
        ],
      });
    });

  const wallet = createWalletClient({
    chain,
    transport: custom(provider),
  });
  const [account] = (await wallet.requestAddresses()) as Address[];
  const tx = await wallet.writeContract({
    address: config.contractAddress,
    abi: provennAbi,
    functionName: "storeHash",
    args: [hash],
    account,
    chain,
  });

  return { transactionHash: tx, owner: account };
}
