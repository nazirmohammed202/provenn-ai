/**
 * Deploy Provenn to the selected Hardhat network.
 *
 * Usage:
 *   npx hardhat run contracts/scripts/deploy.cjs --network monadTestnet
 *
 * Hardhat 2 and Hardhat 3 both expose hre.ethers when the ethers plugin is loaded.
 */
async function main() {
  const hre = require("hardhat");
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
