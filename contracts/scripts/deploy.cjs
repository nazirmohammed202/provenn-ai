/**
 * Deploy Provenn to the selected Hardhat network.
 *
 * Usage:
 *   npx hardhat run contracts/scripts/deploy.cjs --network monadTestnet
 */
async function main() {
  const hre = require("hardhat");
  const signers = await hre.ethers.getSigners();
  if (!signers.length) {
    throw new Error(
      "No deployer account. Set MANAGED_WALLET_PRIVATE_KEY in .env.local (0x-prefixed) and fund it with Monad testnet MON.",
    );
  }

  const [deployer] = signers;
  console.log("Deploying with:", deployer.address);

  const factory = await hre.ethers.getContractFactory("Provenn");
  const provenn = await factory.deploy();
  if (provenn.waitForDeployment) await provenn.waitForDeployment();
  else await provenn.deployed();

  const address = provenn.getAddress
    ? await provenn.getAddress()
    : provenn.address;
  console.log("Provenn deployed to:", address);
  console.log(
    "Set MONAD_CONTRACT_ADDRESS / NEXT_PUBLIC_MONAD_CONTRACT_ADDRESS to this value.",
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
