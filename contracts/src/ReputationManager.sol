// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.24;

import {IERC8004Reputation} from "./interfaces/IERC8004Reputation.sol";

/// @title ReputationManager
/// @notice Manages agent reputation via ERC-8004 Reputation Registry
/// @dev Writes SKC scores after resolution, provides reputation queries
contract ReputationManager {
    // --- State ---
    IERC8004Reputation public reputationRegistry;
    address public owner;

    // Authorized callers (SKCEngine)
    mapping(address => bool) public authorizedCallers;

    // --- Constants ---
    uint8 public constant VALUE_DECIMALS = 2; // scores stored with 2 decimal places
    string public constant DEFAULT_TAG1 = "skc_accuracy";

    // --- Events ---
    event ReputationUpdated(
        uint256 indexed agentId,
        int128 score,
        string tag1,
        string tag2
    );
    event CallerAuthorized(address indexed caller);
    event CallerRevoked(address indexed caller);
    event ReputationRegistryUpdated(address indexed oldRegistry, address indexed newRegistry);
    event OwnershipTransferred(address indexed oldOwner, address indexed newOwner);

    // --- Errors ---
    error NotOwner();
    error NotAuthorized();
    error ZeroAddress();

    // --- Modifiers ---
    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier onlyAuthorized() {
        if (!authorizedCallers[msg.sender]) revert NotAuthorized();
        _;
    }

    constructor(address _reputationRegistry) {
        require(_reputationRegistry != address(0), "Zero address");
        reputationRegistry = IERC8004Reputation(_reputationRegistry);
        owner = msg.sender;
    }

    // --- Core Functions ---

    /// @notice Write reputation score for an agent after SKC resolution
    /// @param agentId The agent's ERC-8004 ID
    /// @param score Cross-entropy based score (-10000 to +10000, with 2 decimals = -100.00 to +100.00)
    /// @param tag2 Application type tag (e.g., "governance", "dispute", "labeling")
    function writeReputation(
        uint256 agentId,
        int128 score,
        string calldata tag2
    ) external onlyAuthorized {
        reputationRegistry.giveFeedback(
            agentId,
            score,
            VALUE_DECIMALS,
            DEFAULT_TAG1,   // "skc_accuracy"
            tag2,
            "",             // endpoint (optional)
            "",             // feedbackURI (optional)
            bytes32(0)      // feedbackHash (optional)
        );

        emit ReputationUpdated(agentId, score, DEFAULT_TAG1, tag2);
    }

    /// @notice Get an agent's aggregated reputation score
    /// @param agentId The agent's ERC-8004 ID
    /// @return count Number of feedbacks
    /// @return value Aggregated score
    /// @return decimals Decimal places
    function getAgentReputation(uint256 agentId)
        external
        view
        returns (uint64 count, int128 value, uint8 decimals)
    {
        address[] memory clients = new address[](0);
        return reputationRegistry.getSummary(
            agentId,
            clients,
            DEFAULT_TAG1,
            ""
        );
    }

    /// @notice Get an agent's reputation for a specific application type
    /// @param agentId The agent's ERC-8004 ID
    /// @param tag2 Application type tag
    function getAgentReputationByTag(uint256 agentId, string calldata tag2)
        external
        view
        returns (uint64 count, int128 value, uint8 decimals)
    {
        address[] memory clients = new address[](0);
        return reputationRegistry.getSummary(
            agentId,
            clients,
            DEFAULT_TAG1,
            tag2
        );
    }

    /// @notice Check if an agent meets a minimum reputation threshold
    /// @param agentId The agent's ERC-8004 ID
    /// @param minReputation Minimum required score
    /// @param tag2 Application type tag (empty string for general)
    /// @return eligible True if agent meets the threshold
    function isAgentEligible(
        uint256 agentId,
        int128 minReputation,
        string calldata tag2
    ) external view returns (bool eligible) {
        address[] memory clients = new address[](1);
        clients[0] = address(this);
        (uint64 count, int128 value,) = reputationRegistry.getSummary(
            agentId,
            clients,
            DEFAULT_TAG1,
            tag2
        );

        // New agents (no feedback) are eligible if minReputation <= 0
        if (count == 0) {
            return minReputation <= 0;
        }

        return value >= minReputation;
    }

    // --- Admin Functions ---

    /// @notice Authorize a caller (e.g., SKCEngine) to write reputation
    function authorizeCaller(address caller) external onlyOwner {
        if (caller == address(0)) revert ZeroAddress();
        authorizedCallers[caller] = true;
        emit CallerAuthorized(caller);
    }

    /// @notice Revoke authorization
    function revokeCaller(address caller) external onlyOwner {
        authorizedCallers[caller] = false;
        emit CallerRevoked(caller);
    }

    /// @notice Update the ERC-8004 Reputation Registry address
    function setReputationRegistry(address _newRegistry) external onlyOwner {
        if (_newRegistry == address(0)) revert ZeroAddress();
        address old = address(reputationRegistry);
        reputationRegistry = IERC8004Reputation(_newRegistry);
        emit ReputationRegistryUpdated(old, _newRegistry);
    }

    /// @notice Transfer ownership
    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroAddress();
        address old = owner;
        owner = newOwner;
        emit OwnershipTransferred(old, newOwner);
    }
}
