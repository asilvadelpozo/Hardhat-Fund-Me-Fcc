import { FundMe } from "../../typechain-types";
import { ethers, network } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { developmentChains } from "../../helper-hardhat-config";
import { BigNumber } from "ethers";
import { assert } from "chai";

developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", async () => {
          let fundMe: FundMe;
          let deployer: SignerWithAddress;
          const sendValue = ethers.utils.parseEther("0.04");

          beforeEach(async () => {
              const accounts = await ethers.getSigners();
              deployer = accounts[0];
              fundMe = await ethers.getContract("FundMe", deployer);
          });

          it("allows people to fund and withdraw", async () => {
              await fundMe.fund({ value: sendValue });
              await fundMe.withdraw();

              const endingBalance: BigNumber = await fundMe.provider.getBalance(
                  fundMe.address
              );
              assert.isTrue(endingBalance.eq(BigNumber.from(0)));
          });
      });
