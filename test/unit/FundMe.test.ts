import { deployments, ethers, network } from "hardhat";
import { assert, expect } from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { FundMe, MockV3Aggregator } from "../../typechain-types";
import { BigNumber } from "ethers";
import { developmentChains } from "../../helper-hardhat-config";

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", async () => {
          let fundMe: FundMe;
          let deployer: SignerWithAddress;
          let mockV3Aggregator: MockV3Aggregator;
          const sendValue: BigNumber = ethers.utils.parseEther("1"); // 1 ETH

          beforeEach(async () => {
              const accounts = await ethers.getSigners();
              deployer = accounts[0];
              await deployments.fixture(["all"]);
              fundMe = await ethers.getContract("FundMe", deployer);
              mockV3Aggregator = await ethers.getContract(
                  "MockV3Aggregator",
                  deployer
              );
          });

          describe("constructor", async () => {
              it("sets the aggregator addresses correctly", async () => {
                  const response = await fundMe.getPriceFeed();
                  assert.equal(response, mockV3Aggregator.address);
              });
          });

          describe("fund", async () => {
              it("fails if you don't send enough ETH", async () => {
                  await expect(fundMe.fund()).to.be.revertedWith(
                      "You need to spend more ETH!"
                  );
              });

              it("updated the amount funded data structure", async () => {
                  await fundMe.fund({ value: sendValue });
                  const response = await fundMe.getAddressToAmountFunded(
                      deployer.address
                  );
                  assert.equal(response.toString(), sendValue.toString());
              });

              it("Adds founder to array nof founders", async () => {
                  await fundMe.fund({ value: sendValue });
                  const founder = await fundMe.getFunder(0);
                  assert.equal(founder, deployer.address);
              });
          });

          describe("withdraw", async () => {
              beforeEach(async () => {
                  await fundMe.fund({ value: sendValue });
              });

              it("withdraw ETH from a single founder", async () => {
                  // Given
                  const startingFundMeBalance: BigNumber =
                      await fundMe.provider.getBalance(fundMe.address);
                  const startingDeployerBalance: BigNumber =
                      await fundMe.provider.getBalance(deployer.address);

                  // When
                  const transactionResponse = await fundMe.withdraw();
                  const transactionReceipt = await transactionResponse.wait(1);

                  const { gasUsed, effectiveGasPrice } = transactionReceipt;
                  const gasCost: BigNumber = gasUsed.mul(effectiveGasPrice);

                  const endingFundMeBalance: BigNumber =
                      await fundMe.provider.getBalance(fundMe.address);
                  const endingDeployerBalance: BigNumber =
                      await fundMe.provider.getBalance(deployer.address);

                  // Then
                  assert.isTrue(endingFundMeBalance.eq(BigNumber.from(0)));
                  assert.isTrue(
                      startingFundMeBalance
                          .add(startingDeployerBalance)
                          .eq(endingDeployerBalance.add(gasCost))
                  );
              });

              it("cheaper withdraw ETH from a single founder", async () => {
                  // Given
                  const startingFundMeBalance: BigNumber =
                      await fundMe.provider.getBalance(fundMe.address);
                  const startingDeployerBalance: BigNumber =
                      await fundMe.provider.getBalance(deployer.address);

                  // When
                  const transactionResponse = await fundMe.cheaperWithdraw();
                  const transactionReceipt = await transactionResponse.wait(1);

                  const { gasUsed, effectiveGasPrice } = transactionReceipt;
                  const gasCost: BigNumber = gasUsed.mul(effectiveGasPrice);

                  const endingFundMeBalance: BigNumber =
                      await fundMe.provider.getBalance(fundMe.address);
                  const endingDeployerBalance: BigNumber =
                      await fundMe.provider.getBalance(deployer.address);

                  // Then
                  assert.isTrue(endingFundMeBalance.eq(BigNumber.from(0)));
                  assert.isTrue(
                      startingFundMeBalance
                          .add(startingDeployerBalance)
                          .eq(endingDeployerBalance.add(gasCost))
                  );
              });

              it("withdraw ETH from multiple founders", async () => {
                  // Given
                  const accounts: SignerWithAddress[] =
                      await ethers.getSigners();
                  for (let i = 1; i < 6; i++) {
                      const fundMeConnectedContract: FundMe = await fundMe.connect(
                          accounts[i]
                      );
                      await fundMeConnectedContract.fund({ value: sendValue });
                  }

                  const startingFundMeBalance: BigNumber =
                      await fundMe.provider.getBalance(fundMe.address);
                  const startingDeployerBalance: BigNumber =
                      await fundMe.provider.getBalance(deployer.address);

                  // When
                  const transactionResponse = await fundMe.withdraw();
                  const transactionReceipt = await transactionResponse.wait(1);

                  const { gasUsed, effectiveGasPrice } = transactionReceipt;
                  const gasCost: BigNumber = gasUsed.mul(effectiveGasPrice);

                  const endingFundMeBalance: BigNumber =
                      await fundMe.provider.getBalance(fundMe.address);
                  const endingDeployerBalance: BigNumber =
                      await fundMe.provider.getBalance(deployer.address);

                  // Then
                  assert.isTrue(endingFundMeBalance.eq(BigNumber.from(0)));
                  assert.isTrue(
                      startingFundMeBalance
                          .add(startingDeployerBalance)
                          .eq(endingDeployerBalance.add(gasCost))
                  );

                  await expect(fundMe.getFunder(0)).to.be.reverted;

                  for (let i = 1; i < 6; i++) {
                      const amountForAddress: BigNumber =
                          await fundMe.getAddressToAmountFunded(
                              accounts[i].address
                          );
                      assert.isTrue(amountForAddress.eq(BigNumber.from(0)));
                  }
              });

              it("cheaper withdraw ETH from multiple founders", async () => {
                  // Given
                  const accounts: SignerWithAddress[] =
                      await ethers.getSigners();
                  for (let i = 1; i < 6; i++) {
                      const fundMeConnectedContract: FundMe = await fundMe.connect(
                          accounts[i]
                      );
                      await fundMeConnectedContract.fund({ value: sendValue });
                  }

                  const startingFundMeBalance: BigNumber =
                      await fundMe.provider.getBalance(fundMe.address);
                  const startingDeployerBalance: BigNumber =
                      await fundMe.provider.getBalance(deployer.address);

                  // When
                  const transactionResponse = await fundMe.cheaperWithdraw();
                  const transactionReceipt = await transactionResponse.wait(1);

                  const { gasUsed, effectiveGasPrice } = transactionReceipt;
                  const gasCost: BigNumber = gasUsed.mul(effectiveGasPrice);

                  const endingFundMeBalance: BigNumber =
                      await fundMe.provider.getBalance(fundMe.address);
                  const endingDeployerBalance: BigNumber =
                      await fundMe.provider.getBalance(deployer.address);

                  // Then
                  assert.isTrue(endingFundMeBalance.eq(BigNumber.from(0)));
                  assert.isTrue(
                      startingFundMeBalance
                          .add(startingDeployerBalance)
                          .eq(endingDeployerBalance.add(gasCost))
                  );

                  await expect(fundMe.getFunder(0)).to.be.reverted;

                  for (let i = 1; i < 6; i++) {
                      const amountForAddress: BigNumber =
                          await fundMe.getAddressToAmountFunded(
                              accounts[i].address
                          );
                      assert.isTrue(amountForAddress.eq(BigNumber.from(0)));
                  }
              });

              it("only allows the owner to withdraw", async () => {
                  const accounts: SignerWithAddress[] =
                      await ethers.getSigners();
                  const attacker: SignerWithAddress = accounts[1];
                  const attackerConnectedContract = await fundMe.connect(
                      attacker
                  );

                  await expect(
                      attackerConnectedContract.withdraw()
                  ).to.be.revertedWithCustomError(fundMe, "FundMe__NotOwner");
              });
          });
      });
