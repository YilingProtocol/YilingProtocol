// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {AgentRegistry} from "../src/AgentRegistry.sol";
import {IERC8004Identity} from "../src/interfaces/IERC8004Identity.sol";

/// @dev Mock ERC-8004 Identity Registry for testing
contract MockIdentityRegistry {
    mapping(uint256 => address) private _owners;
    mapping(uint256 => address) private _wallets;
    uint256 private _totalSupply;

    function mint(address to, uint256 agentId) external {
        _owners[agentId] = to;
        _totalSupply++;
    }

    function setAgentWallet(uint256 agentId, address wallet) external {
        _wallets[agentId] = wallet;
    }

    function ownerOf(uint256 agentId) external view returns (address) {
        require(_owners[agentId] != address(0), "Agent not found");
        return _owners[agentId];
    }

    function getAgentWallet(uint256 agentId) external view returns (address) {
        return _wallets[agentId];
    }

    function tokenURI(uint256) external pure returns (string memory) {
        return "https://example.com/agent.json";
    }

    function totalSupply() external view returns (uint256) {
        return _totalSupply;
    }
}

contract AgentRegistryTest is Test {
    AgentRegistry public registry;
    MockIdentityRegistry public mockIdentity;

    address public owner = address(this);
    address public agent1 = makeAddr("agent1");
    address public agent2 = makeAddr("agent2");
    address public stranger = makeAddr("stranger");

    function setUp() public {
        mockIdentity = new MockIdentityRegistry();
        registry = new AgentRegistry(address(mockIdentity));

        // Register agent1 with agentId 1
        mockIdentity.mint(agent1, 1);
        // Register agent2 with agentId 2
        mockIdentity.mint(agent2, 2);
    }

    // ========== Join Ecosystem Tests ==========

    function test_joinEcosystem_asOwner() public {
        vm.prank(agent1);
        registry.joinEcosystem(1);

        assertTrue(registry.isRegisteredAgent(agent1));
        assertEq(registry.getAgentId(agent1), 1);
        assertTrue(registry.hasJoined(1));
        assertEq(registry.totalJoinedAgents(), 1);
    }

    function test_joinEcosystem_asWallet() public {
        address wallet = makeAddr("wallet");
        mockIdentity.setAgentWallet(1, wallet);

        vm.prank(wallet);
        registry.joinEcosystem(1);

        assertTrue(registry.isRegisteredAgent(wallet));
    }

    function test_joinEcosystem_revert_notOwnerOrWallet() public {
        vm.prank(stranger);
        vm.expectRevert("Not agent owner or wallet");
        registry.joinEcosystem(1);
    }

    function test_joinEcosystem_doubleJoin_noDuplicate() public {
        vm.prank(agent1);
        registry.joinEcosystem(1);

        vm.prank(agent1);
        registry.joinEcosystem(1);

        // Should still be 1, not 2
        assertEq(registry.totalJoinedAgents(), 1);
    }

    function test_joinEcosystem_multipleAgents() public {
        vm.prank(agent1);
        registry.joinEcosystem(1);

        vm.prank(agent2);
        registry.joinEcosystem(2);

        assertEq(registry.totalJoinedAgents(), 2);
        assertTrue(registry.isRegisteredAgent(agent1));
        assertTrue(registry.isRegisteredAgent(agent2));
    }

    function test_joinEcosystem_emitsEvent() public {
        vm.expectEmit(true, true, false, false);
        emit AgentRegistry.AgentJoined(1, agent1);

        vm.prank(agent1);
        registry.joinEcosystem(1);
    }

    // ========== View Function Tests ==========

    function test_isRegisteredAgent_notRegistered() public view {
        assertFalse(registry.isRegisteredAgent(stranger));
    }

    function test_getAgentId_notRegistered() public view {
        assertEq(registry.getAgentId(stranger), 0);
    }

    // ========== Admin Tests ==========

    function test_setIdentityRegistry() public {
        MockIdentityRegistry newRegistry = new MockIdentityRegistry();
        registry.setIdentityRegistry(address(newRegistry));
        assertEq(address(registry.identityRegistry()), address(newRegistry));
    }

    function test_setIdentityRegistry_revert_notOwner() public {
        vm.prank(stranger);
        vm.expectRevert(AgentRegistry.NotOwner.selector);
        registry.setIdentityRegistry(address(1));
    }

    function test_setIdentityRegistry_revert_zeroAddress() public {
        vm.expectRevert(AgentRegistry.ZeroAddress.selector);
        registry.setIdentityRegistry(address(0));
    }

    function test_transferOwnership() public {
        registry.transferOwnership(agent1);
        assertEq(registry.owner(), agent1);
    }
}
