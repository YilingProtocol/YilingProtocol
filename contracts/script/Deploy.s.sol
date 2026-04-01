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

    // Role addresses — each role has its own wallet
    address constant PROTOCOL_API = 0x68C749cE3B87D1C41164a92DdED086331e0B78a1;
    address constant TREASURY     = 0x0C952bA7Ce073b05c62F49a0a52304057997B351;

    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);

        console.log("Deployer (Owner):", deployer);
        console.log("ProtocolAPI:", PROTOCOL_API);
        console.log("Treasury:", TREASURY);
        console.log("ERC-8004 Identity:", ERC8004_IDENTITY);
        console.log("ERC-8004 Reputation:", ERC8004_REPUTATION);

        vm.startBroadcast(deployerKey);

        // 1. Deploy AgentRegistry
        AgentRegistry agentRegistry = new AgentRegistry(ERC8004_IDENTITY);
        console.log("AgentRegistry:", address(agentRegistry));

        // 2. Deploy ReputationManager
        ReputationManager reputationManager = new ReputationManager(ERC8004_REPUTATION);
        console.log("ReputationManager:", address(reputationManager));

        // 3. Deploy SKCEngine — protocolAPI is separate from owner
        SKCEngine skcEngine = new SKCEngine(
            address(agentRegistry),
            address(reputationManager),
            PROTOCOL_API
        );
        console.log("SKCEngine:", address(skcEngine));

        // 4. Deploy QueryFactory — protocolAPI is separate from owner
        QueryFactory queryFactory = new QueryFactory(
            address(skcEngine),
            PROTOCOL_API
        );
        console.log("QueryFactory:", address(queryFactory));

        // 5. Authorize SKCEngine to write reputation
        reputationManager.authorizeCaller(address(skcEngine));
        console.log("SKCEngine authorized to write reputation");

        vm.stopBroadcast();

        // Print summary
        console.log("");
        console.log("=== DEPLOYMENT SUMMARY ===");
        console.log("OWNER=", deployer);
        console.log("PROTOCOL_API=", PROTOCOL_API);
        console.log("TREASURY=", TREASURY);
        console.log("SKC_ENGINE_ADDRESS=", address(skcEngine));
        console.log("QUERY_FACTORY_ADDRESS=", address(queryFactory));
        console.log("AGENT_REGISTRY_ADDRESS=", address(agentRegistry));
        console.log("REPUTATION_MANAGER_ADDRESS=", address(reputationManager));
    }
}
