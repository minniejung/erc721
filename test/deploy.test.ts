import { expect } from 'chai';
import fs from 'fs';
import path from 'path';
import { ethers } from 'hardhat';
import hardhatConfig from '../hardhat.config';
import { HttpNetworkUserConfig } from 'hardhat/types';

describe('Deploy 검사', function () {
  let mytoken: any;
  let owner: any;
  let otherAccount: any;

  beforeEach(async function () {
    [owner, otherAccount] = await ethers.getSigners();
    const MytokenFactory = await ethers.getContractFactory('MyNFT');

    try {
      mytoken = await MytokenFactory.deploy('MyNFT', 'MNFT');
    } catch (error) {
      mytoken = await (MytokenFactory as any).deploy();
    }

    await mytoken.waitForDeployment();
  });

  describe('환경 셋팅 검사', function () {
    it('@openzeppelin/contracts가 설치되어야 합니다.', function () {
      const packageJsonPath = path.join(__dirname, '../package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

      const dependencies = packageJson.dependencies || {};
      const devDependencies = packageJson.devDependencies || {};

      const isInstalled =
        '@openzeppelin/contracts' in dependencies ||
        '@openzeppelin/contracts' in devDependencies;

      expect(isInstalled).to.be.true;
    });

    it('가나슈 네트워크에 정상적으로 연결이 되어야 합니다.(hardhat.config.ts)', async function () {
      const ganache = hardhatConfig.networks?.ganache as HttpNetworkUserConfig;
      const ganacheUrl = ganache?.url;
      expect(ganacheUrl?.toUpperCase()).to.equal('HTTP://127.0.0.1:7545');
    });
  });

  describe('컨트랙트 구현', function () {
    it('컨트랙트에서 SPDX 주석으로 라이선스가 있어야 합니다.', async function () {
      const contractPath = path.join(__dirname, '../contracts/MyNFT.sol');
      const sourceCode = fs.readFileSync(contractPath, 'utf8');
      expect(sourceCode.match(/\/\/ SPDX-License-Identifier:/)).to.not.be.null;
    });

    it('컨트랙트에서 Solidity 버전이 0.8.0 이상, 0.9.0 미만이어야 합니다.', async function () {
      const contractPath = path.join(__dirname, '../contracts/MyNFT.sol');
      const sourceCode = fs.readFileSync(contractPath, 'utf8');

      const versionMatch = sourceCode.match(/pragma solidity\s+([^;]+);/);
      expect(versionMatch).to.not.be.null;

      const solidityVersion = versionMatch![1].trim();
      const validVersions = ['>=0.8.0 <0.9.0', '^0.8.0'];

      expect(validVersions.includes(solidityVersion)).to.be.true;
    });

    it('컨트랙트에서 @openzeppelin/contracts/token/ERC721/ERC721.sol을 import 해야 합니다.', function () {
      const contractPath = path.join(__dirname, '../contracts/MyNFT.sol');
      const sourceCode = fs.readFileSync(contractPath, 'utf8');
      const importRegex =
        /import\s+["']@openzeppelin\/contracts\/token\/ERC721\/ERC721\.sol["'];/i;
      expect(sourceCode.match(importRegex)).to.not.be.null;
    });

    it('MyNFT 컨트랙트는 ERC721을 상속받아 구현해야 합니다.(is, constructor)', async function () {
      const tokenName = await mytoken.name();
      const tokenSymbol = await mytoken.symbol();

      expect(tokenName.length).to.be.greaterThan(0);
      expect(tokenSymbol.length).to.be.greaterThan(0);
    });

    it('MyNFT 컨트랙트 배포시 constructor의 인자(string memory name_, string memory symbol_)를 받고, ERC721에 전달해줘야 합니다. - ERC721(name_, symbol_)', async function () {
      const tokenName = await mytoken.name();
      const tokenSymbol = await mytoken.symbol();

      expect(tokenName.length).to.be.greaterThan(0);
      expect(tokenSymbol.length).to.be.greaterThan(0);
    });

    it('MyNFT 컨트랙트는 NFT를 민팅해줄 수 있는 mint 함수가 있어야 합니다. - mint 함수는 인자(address(recipient), string(_tokenURI))를 이용하여 구현합니다.', async function () {
      const tokenURI = 'https://example.com/metadata/0';
      const mint = await mytoken.mint(owner.address, tokenURI);
      const receipt = await mint.wait();

      expect(receipt.status).to.equal(1);

      expect(receipt.logs.length).to.be.greaterThan(0);
      expect(receipt.to).to.equal(mytoken.target);
      expect(receipt.from).to.equal(owner.address);
      expect(receipt.blockNumber).to.be.a('number');
      expect(receipt.blockHash).to.be.a('string');
      expect(receipt.gasUsed).to.be.greaterThan(0);

      const tokenId = await mytoken.balanceOf(owner.address);
      expect(Number(tokenId)).to.be.greaterThan(0);

      const storedTokenURI = await mytoken.tokenURI(tokenId);
      expect(storedTokenURI).to.equal(tokenURI);
    });
  });
});
