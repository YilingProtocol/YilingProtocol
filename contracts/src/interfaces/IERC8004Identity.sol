// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.24;

/// @title IERC8004Identity
/// @notice Minimal interface for ERC-8004 Identity Registry
/// @dev Only includes functions needed by Yiling Protocol
interface IERC8004Identity {
    /// @notice Check if an agent ID exists (ERC-721 ownerOf)
    function ownerOf(uint256 agentId) external view returns (address);

    /// @notice Get the agent's metadata URI
    function tokenURI(uint256 agentId) external view returns (string memory);

    /// @notice Get the wallet address associated with an agent
    function getAgentWallet(uint256 agentId) external view returns (address);

    /// @notice Get total number of registered agents
    function totalSupply() external view returns (uint256);
}
