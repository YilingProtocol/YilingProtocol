// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {AgentRegistry} from "../src/AgentRegistry.sol";
import {ReputationManager} from "../src/ReputationManager.sol";
import {SKCEngine} from "../src/SKCEngine.sol";
import {QueryFactory} from "../src/QueryFactory.sol";

contract DeployScript is Script {
    // ERC-8004 on Monad Testnet
    address constant ERC8004_IDENTITY = 0x8004A818BFB912233c491871b3d84c89A494BD9e;
    address constant ERC8004_REPUTATION = 0x8004B663056A597Dffe9eCcC1965A193B7388713;

    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);

        console.log("Deployer:", deployer);
        console.log("Chain: Monad");
        console.log("ERC-8004 Identity:", ERC8004_IDENTITY);
        console.log("ERC-8004 Reputation:", ERC8004_REPUTATION);

        vm.startBroadcast(deployerKey);

        // 1. Deploy AgentRegistry (uses real ERC-8004 Identity)
        AgentRegistry agentRegistry = new AgentRegistry(ERC8004_IDENTITY);
        console.log("AgentRegistry:", address(agentRegistry));

        // 2. Deploy ReputationManager (uses real ERC-8004 Reputation)
        ReputationManager reputationManager = new ReputationManager(ERC8004_REPUTATION);
        console.log("ReputationManager:", address(reputationManager));

        // 3. Deploy SKCEngine
        SKCEngine skcEngine = new SKCEngine(
            address(agentRegistry),
            address(reputationManager),
            deployer // protocolAPI = deployer (update later when API is deployed)
        );
        console.log("SKCEngine:", address(skcEngine));

        // 4. Deploy QueryFactory
        QueryFactory queryFactory = new QueryFactory(
            address(skcEngine),
            deployer // protocolAPI = deployer (update later)
        );
        console.log("QueryFactory:", address(queryFactory));

        // 5. Authorize SKCEngine to write reputation
        reputationManager.authorizeCaller(address(skcEngine));
        console.log("SKCEngine authorized to write reputation");

        vm.stopBroadcast();

        // Print summary
        console.log("");
        console.log("=== DEPLOYMENT SUMMARY ===");
        console.log("SKC_ENGINE_ADDRESS=", address(skcEngine));
        console.log("QUERY_FACTORY_ADDRESS=", address(queryFactory));
        console.log("AGENT_REGISTRY_ADDRESS=", address(agentRegistry));
        console.log("REPUTATION_MANAGER_ADDRESS=", address(reputationManager));
    }
}
