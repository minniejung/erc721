import { expect } from 'chai';
import { ethers } from 'ethers';
import {
  checkNetworkInfo,
  getSigner,
  getContract,
  mint,
  ownerOf,
  balanceOf,
  safeTransferFrom,
  approve,
} from '../web3/ethers';
import { ethers as hre } from 'hardhat';

describe('Erc20 기능 Web3.js 검사', function () {
  const tokenURI = 'https://example.com/metadata/0';
  const wallet = getSigner();
  let recipient: any;

  before(async function () {
    const signers = await hre.getSigners();
    recipient = signers.filter(
      (signer) => signer.address !== wallet.address
    )[0];
  });

  describe('환경 셋팅 검사', function () {
    it('가나슈 네트워크에 정상적으로 연결이 되어야 합니다.', async function () {
      const chainId = (await checkNetworkInfo()).chainId;
      expect(Number(chainId)).to.equal(1337);
    });

    it('getSigner는 Wallet(서명자) 인스턴스를 리턴해야 합니다.', async function () {
      expect(wallet).to.be.instanceOf(ethers.Wallet);
    });

    it('getContract는 컨트랙트 인스턴스를 리턴해야 합니다.', async function () {
      const contract = getContract();
      expect(contract).to.be.instanceOf(ethers.Contract);
    });
  });

  describe('ERC 721 기능 검사', function () {
    it('mint 함수는 인자(address(recipient), string(_tokenURI))를 이용하여 컨트랙트에 NFT를 민팅할 수 있어야 합니다.', async function () {
      const mintNFT = await mint(wallet.address, tokenURI);
      const receipt = await mintNFT.wait();

      const transferEvent = receipt.logs.find(
        (log: any) => log.fragment?.name === 'Transfer'
      );
      expect(transferEvent).to.not.be.undefined;

      const tokenId = Number(transferEvent.args.tokenId);
      const owner = await ownerOf(tokenId);
      expect(owner.toLowerCase()).to.equal(wallet.address.toLowerCase());
    });

    it('ownerOf 함수는 인자(tokenId)를 이용하여 해당 token의 소유자를 리턴해야 합니다.', async function () {
      const owner = await ownerOf(1);
      expect(ethers.isAddress(owner)).to.be.true;
    });

    it('ownerOf 함수는 인자(tokenId)를 이용하여 해당 token의 소유자를 리턴해야 합니다.', async function () {
      const owner = await ownerOf(1);
      expect(ethers.isAddress(owner)).to.be.true;
    });

    it('balanceOf는 컨트랙트에 안자 address가 보유하고 있는 토큰의 양을 리턴해야 합니다.', async function () {
      const balance = await balanceOf(wallet.address);
      expect(Number(balance) > 0).to.be.true;
    });

    it('safeTransferFrom는 컨트랙트의 safeTransferFrom함수를 사용하여 from이 to에게 tokenId에 해당하는 토큰을 전송해야 합니다.', async function () {
      const balance = Number(await balanceOf(wallet.address));
      let receipt: any;

      for (let i = 1; i <= balance; i++) {
        try {
          const transfer = await safeTransferFrom(
            wallet.address,
            recipient.address,
            i
          );
          receipt = await transfer.wait();

          if (receipt.status === 1) {
            break;
          }
        } catch (error) {
          continue;
        }
      }

      const transferEvent = receipt.logs.find(
        (log: any) => log.fragment?.name === 'Transfer'
      );
      const tokenId = Number(transferEvent.args.tokenId);
      const owner = await ownerOf(tokenId);
      expect(owner.toLowerCase()).to.equal(recipient.address.toLowerCase());
    });

    it('approve는 컨트랙트의 approve 함수를 사용하여 from이 to에게 tokenId에 해당하는 토큰을 승인해야 합니다.', async function () {
      const balance = Number(await balanceOf(wallet.address));
      let receipt: any;
      let tokenId: number | null = null;
      let spender: string;

      for (let i = 1; i <= balance; i++) {
        try {
          const approved = await approve(recipient.address, i);
          receipt = await approved.wait();

          if (receipt.status === 1) {
            tokenId = i;
            break;
          }
        } catch (error) {
          continue;
        }
      }

      if (tokenId !== null) {
        const contract = getContract();
        spender = await contract.getApproved(tokenId);
      } else {
        throw new Error('No valid tokenId was approved');
      }

      expect(spender.toLowerCase()).to.equal(recipient.address.toLowerCase());
    });
  });
});
