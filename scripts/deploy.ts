import { ethers } from 'hardhat';
import { makeAbi } from './abiGenerator';

async function main() {
  const contractName = 'MyNFT';

  console.log(`Deploying contracts`);

  const Contract = await ethers.getContractFactory(contractName);
  const contract = await Contract.deploy();

  await contract.waitForDeployment();

  console.log(`Contract deployed at: ${contract.target}`);
  await makeAbi(`${contractName}`, contract.target);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
