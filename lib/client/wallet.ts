"use client";

import {
  createWalletClient,
  custom,
  type Address,
  type EIP1193Provider,
} from "viem";
import { monadChain, provennAbi, contractAddress } from "@/lib/chain";

declare global {
  interface Window {
    ethereum?: EIP1193Provider & {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
    };
  }
}

export async function secureWithInjectedWallet(hash: `0x${string}`) {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("No injected wallet found. Install a browser wallet.");
  }

  const address = contractAddress();
  if (!address) throw new Error("Monad contract address is not configured.");

  const provider = window.ethereum;
  await provider.request({
    method: "wallet_switchEthereumChain",
    params: [{ chainId: `0x${monadChain.id.toString(16)}` }],
  }).catch(async () => {
    await provider.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: `0x${monadChain.id.toString(16)}`,
          chainName: monadChain.name,
          nativeCurrency: monadChain.nativeCurrency,
          rpcUrls: monadChain.rpcUrls.default.http,
          blockExplorerUrls: [
            process.env.NEXT_PUBLIC_MONAD_EXPLORER_URL ||
              "https://testnet.monadexplorer.com",
          ],
        },
      ],
    });
  });

  const wallet = createWalletClient({
    chain: monadChain,
    transport: custom(provider),
  });
  const [account] = (await wallet.requestAddresses()) as Address[];
  const tx = await wallet.writeContract({
    address,
    abi: provennAbi,
    functionName: "storeHash",
    args: [hash],
    account,
    chain: monadChain,
  });

  return { transactionHash: tx, owner: account };
}
