// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.24;

/// @title IERC8004Reputation
/// @notice Minimal interface for ERC-8004 Reputation Registry
/// @dev Only includes functions needed by Yiling Protocol
interface IERC8004Reputation {
    /// @notice Submit feedback for an agent
    function giveFeedback(
        uint256 agentId,
        int128 value,
        uint8 valueDecimals,
        string calldata tag1,
        string calldata tag2,
        string calldata endpoint,
        string calldata feedbackURI,
        bytes32 feedbackHash
    ) external;

    /// @notice Revoke previously given feedback
    function revokeFeedback(uint256 agentId, uint64 feedbackIndex) external;

    /// @notice Get aggregated reputation summary
    function getSummary(
        uint256 agentId,
        address[] calldata clientAddresses,
        string calldata tag1,
        string calldata tag2
    ) external view returns (uint64 count, int128 value, uint8 decimals);

    /// @notice Get list of clients who gave feedback
    function getClients(uint256 agentId) external view returns (address[] memory);
}
