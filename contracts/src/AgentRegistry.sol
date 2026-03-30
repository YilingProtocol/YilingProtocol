// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.24;

import {IERC8004Identity} from "./interfaces/IERC8004Identity.sol";

/// @title AgentRegistry
/// @notice Manages agent access to Yiling Protocol via ERC-8004 Identity
/// @dev Agents must have a valid ERC-8004 identity to participate
contract AgentRegistry {
    // --- State ---
    IERC8004Identity public identityRegistry;
    address public owner;

    // wallet address → agentId mapping (cached after first interaction)
    mapping(address => uint256) private _walletToAgent;
    // agentId → whether this agent has joined Yiling ecosystem
    mapping(uint256 => bool) private _joinedAgents;
    // total number of agents that have joined
    uint256 public totalJoinedAgents;

    // --- Events ---
    event AgentJoined(uint256 indexed agentId, address indexed agentWallet);
    event IdentityRegistryUpdated(address indexed oldRegistry, address indexed newRegistry);
    event OwnershipTransferred(address indexed oldOwner, address indexed newOwner);

    // --- Errors ---
    error NotOwner();
    error ZeroAddress();
    error AgentNotRegistered();
    error InvalidAgentId();

    // --- Modifiers ---
    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    constructor(address _identityRegistry) {
        require(_identityRegistry != address(0), "Zero address");
        identityRegistry = IERC8004Identity(_identityRegistry);
        owner = msg.sender;
    }

    // --- Core Functions ---

    /// @notice Verify and register an agent's wallet with their ERC-8004 identity
    /// @param agentId The agent's ERC-8004 token ID
    function joinEcosystem(uint256 agentId) external {
        // Verify the caller owns or is the wallet for this agentId
        address agentOwner = identityRegistry.ownerOf(agentId);
        address agentWallet = _getAgentWallet(agentId);

        require(
            msg.sender == agentOwner || msg.sender == agentWallet,
            "Not agent owner or wallet"
        );

        _walletToAgent[msg.sender] = agentId;

        if (!_joinedAgents[agentId]) {
            _joinedAgents[agentId] = true;
            totalJoinedAgents++;
            emit AgentJoined(agentId, msg.sender);
        }
    }

    /// @notice Check if an address is a registered agent
    /// @param wallet The wallet address to check
    /// @return True if the wallet belongs to a registered agent
    function isRegisteredAgent(address wallet) external view returns (bool) {
        uint256 agentId = _walletToAgent[wallet];
        if (agentId == 0) return false;
        return _joinedAgents[agentId];
    }

    /// @notice Get the agentId for a wallet address
    /// @param wallet The wallet address
    /// @return The ERC-8004 agent ID (0 if not registered)
    function getAgentId(address wallet) external view returns (uint256) {
        return _walletToAgent[wallet];
    }

    /// @notice Check if an agentId has joined the ecosystem
    /// @param agentId The ERC-8004 agent ID
    /// @return True if the agent has joined
    function hasJoined(uint256 agentId) external view returns (bool) {
        return _joinedAgents[agentId];
    }

    // --- Admin Functions ---

    /// @notice Update the ERC-8004 Identity Registry address
    function setIdentityRegistry(address _newRegistry) external onlyOwner {
        if (_newRegistry == address(0)) revert ZeroAddress();
        address old = address(identityRegistry);
        identityRegistry = IERC8004Identity(_newRegistry);
        emit IdentityRegistryUpdated(old, _newRegistry);
    }

    /// @notice Transfer ownership
    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroAddress();
        address old = owner;
        owner = newOwner;
        emit OwnershipTransferred(old, newOwner);
    }

    // --- Internal ---

    function _getAgentWallet(uint256 agentId) internal view returns (address) {
        try identityRegistry.getAgentWallet(agentId) returns (address wallet) {
            return wallet;
        } catch {
            return address(0);
        }
    }
}
