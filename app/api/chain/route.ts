import { NextResponse } from "next/server";
import { contractAddress, explorerBase, monadChain } from "@/lib/chain";

export async function GET() {
  const address = contractAddress();
  if (!address) {
    return NextResponse.json(
      { error: "Monad contract address is not configured." },
      { status: 503 },
    );
  }

  return NextResponse.json({
    chainId: monadChain.id,
    chainName: monadChain.name,
    rpcUrl: monadChain.rpcUrls.default.http[0],
    explorerUrl: explorerBase(),
    contractAddress: address,
    nativeCurrency: monadChain.nativeCurrency,
  });
}
