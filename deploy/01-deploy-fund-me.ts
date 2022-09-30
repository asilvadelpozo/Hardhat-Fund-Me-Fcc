import { HardhatRuntimeEnvironment } from "hardhat/types";
import { networkConfig, developmentChains } from "../helper-hardhat-config";
import { network } from "hardhat";
import verify from "../utils/verify";

async function deployFunc(hre: HardhatRuntimeEnvironment) {
    const { getNamedAccounts, deployments } = hre;
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();

    let ethUsdPriceFeedAddress;
    if (developmentChains.includes(network.name)) {
        const ethAggregator = await deployments.get("MockV3Aggregator");
        ethUsdPriceFeedAddress = ethAggregator.address;
    } else {
        ethUsdPriceFeedAddress = networkConfig[network.name]["ethUsdPriceFeed"];
    }

    const args = [ethUsdPriceFeedAddress];
    const fundMe = await deploy("FundMe", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: networkConfig[network.name].blockConfirmations || 0,
    });

    if (
        !developmentChains.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        await verify(fundMe.address, args);
    }
    log("------------------------------------------");
}

export default deployFunc;
deployFunc.tags = ["all", "fundMe"];
