const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Provenn", function () {
  async function deploy() {
    const [owner] = await ethers.getSigners();
    const Provenn = await ethers.getContractFactory("Provenn");
    const provenn = await Provenn.deploy();
    await provenn.waitForDeployment();
    const hash = ethers.id("sample-contract-bytes");
    return { provenn, owner, hash };
  }

  it("stores the first proof and emits HashStored", async function () {
    const { provenn, owner, hash } = await deploy();
    const tx = await provenn.storeHash(hash);
    const receipt = await tx.wait();
    const event = receipt.logs
      .map((log) => {
        try {
          return provenn.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find((parsed) => parsed && parsed.name === "HashStored");

    expect(event).to.not.equal(undefined);
    expect(event.args.hash).to.equal(hash);
    expect(event.args.owner).to.equal(owner.address);
    expect(event.args.timestamp > 0n).to.equal(true);
    expect(await provenn.verifyHash(hash)).to.equal(true);

    const record = await provenn.getRecord(hash);
    expect(record[0]).to.equal(hash);
    expect(record[2]).to.equal(owner.address);
  });

  it("rejects duplicate proofs", async function () {
    const { provenn, hash } = await deploy();
    await provenn.storeHash(hash);
    let failed = false;
    try {
      await (await provenn.storeHash(hash)).wait();
    } catch (error) {
      failed = String(error.message || error).includes("Proof already exists");
    }
    expect(failed).to.equal(true);
  });

  it("returns empty record for unknown hashes", async function () {
    const { provenn } = await deploy();
    const unknown = ethers.id("missing");
    const record = await provenn.getRecord(unknown);
    expect(record[1]).to.equal(0n);
    expect(await provenn.verifyHash(unknown)).to.equal(false);
  });
});
