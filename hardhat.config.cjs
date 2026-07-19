const fs = require("fs");
const path = require("path");

// Hardhat does not load Next.js .env.local automatically.
function loadEnvFile(filename) {
  const fullPath = path.join(__dirname, filename);
  if (!fs.existsSync(fullPath)) return;
  for (const line of fs.readFileSync(fullPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

loadEnvFile(".env");
loadEnvFile(".env.local");

require("@nomicfoundation/hardhat-ethers");

function deployerAccounts() {
  let key = (process.env.MANAGED_WALLET_PRIVATE_KEY || "").trim();
  if (!key) return [];
  if (!key.startsWith("0x")) key = `0x${key}`;
  // 32-byte secp256k1 key => 64 hex chars + 0x prefix
  if (!/^0x[0-9a-fA-F]{64}$/.test(key)) {
    console.warn(
      "[hardhat] MANAGED_WALLET_PRIVATE_KEY is set but invalid. Expected 0x + 64 hex characters.",
    );
    return [];
  }
  return [key];
}

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.24",
  paths: {
    sources: "./contracts",
    tests: "./test/contracts",
    cache: "./contracts/cache",
    artifacts: "./contracts/artifacts",
  },
  networks: {
    hardhat: {},
    monadTestnet: {
      url: process.env.MONAD_RPC_URL || "https://testnet-rpc.monad.xyz",
      chainId: Number(process.env.MONAD_CHAIN_ID || 10143),
      accounts: deployerAccounts(),
    },
  },
};
