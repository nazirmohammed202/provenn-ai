import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function explorerTxUrl(txHash: string) {
  const base = (
    process.env.NEXT_PUBLIC_MONAD_EXPLORER_URL ||
    process.env.MONAD_EXPLORER_URL ||
    "https://testnet.monadexplorer.com"
  ).replace(/\/$/, "");
  return `${base}/tx/${txHash}`;
}

export function explorerAddressUrl(address: string) {
  const base = (
    process.env.NEXT_PUBLIC_MONAD_EXPLORER_URL ||
    process.env.MONAD_EXPLORER_URL ||
    "https://testnet.monadexplorer.com"
  ).replace(/\/$/, "");
  return `${base}/address/${address}`;
}

export function shortHash(value: string, size = 10) {
  if (value.length <= size * 2) return value;
  return `${value.slice(0, size)}…${value.slice(-6)}`;
}
