require("@nomicfoundation/hardhat-ethers");

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
      accounts: process.env.MANAGED_WALLET_PRIVATE_KEY
        ? [process.env.MANAGED_WALLET_PRIVATE_KEY]
        : [],
    },
  },
};
