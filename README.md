# Provenn AI

Walletless contract intelligence with optional immutable proof on Monad.

## Stack

- Next.js 16 · TypeScript · Tailwind · shadcn-style UI
- Gemini Flash analysis · Redis TTL retention · Viem / Monad
- Hardhat for `Provenn.sol` compile, test, and deploy

## Setup

```bash
npm install
cp .env.example .env.local
```

Fill at least:

- `GEMINI_API_KEY`
- `COOKIE_SECRET` / `ENCRYPTION_KEY`
- `MONAD_CONTRACT_ADDRESS` + `MANAGED_WALLET_PRIVATE_KEY` (for managed proofs)
- Matching `NEXT_PUBLIC_MONAD_*` values for browser wallet / explorer links
- Optional Turnstile + Upstash Redis credentials

## Scripts

```bash
npm run dev
npm test
npm run contracts:compile
npm run contracts:test
npm run contracts:deploy
```

## Flow

1. Upload PDF / DOCX / TXT → Provenn AI analysis (no wallet required)
2. Review risks, parties, dates, obligations on `/analyze`
3. Secure proof via managed signer (Turnstile + rate limits) or injected wallet
4. Verify a copy on `/verify` against Monad
5. Download the PDF report (updates after a proof exists)
