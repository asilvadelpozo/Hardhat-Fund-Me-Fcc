import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ContractTransaction } from "ethers";
import { ethers } from "hardhat";
import { FundMe } from "../typechain-types";

async function main() {
    const accounts = await ethers.getSigners();
    const deployer: SignerWithAddress = accounts[0];
    const fundMe: FundMe = await ethers.getContract("FundMe", deployer);

    console.log("Funding...");

    const transactionResponse: ContractTransaction = await fundMe.withdraw();
    await transactionResponse.wait(1);

    console.log("Got it back!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
