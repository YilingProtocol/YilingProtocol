// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {ReputationManager} from "../src/ReputationManager.sol";
import {IERC8004Reputation} from "../src/interfaces/IERC8004Reputation.sol";

/// @dev Mock ERC-8004 Reputation Registry for testing
contract MockReputationRegistry {
    struct Feedback {
        int128 value;
        uint8 decimals;
        string tag1;
        string tag2;
        bool revoked;
    }

    // agentId → feedbacks
    mapping(uint256 => Feedback[]) private _feedbacks;

    function giveFeedback(
        uint256 agentId,
        int128 value,
        uint8 valueDecimals,
        string calldata tag1,
        string calldata tag2,
        string calldata,
        string calldata,
        bytes32
    ) external {
        _feedbacks[agentId].push(Feedback({
            value: value,
            decimals: valueDecimals,
            tag1: tag1,
            tag2: tag2,
            revoked: false
        }));
    }

    function revokeFeedback(uint256 agentId, uint64 feedbackIndex) external {
        _feedbacks[agentId][feedbackIndex].revoked = true;
    }

    function getSummary(
        uint256 agentId,
        address[] calldata,
        string calldata,
        string calldata
    ) external view returns (uint64 count, int128 value, uint8 decimals) {
        Feedback[] storage feedbacks = _feedbacks[agentId];
        count = uint64(feedbacks.length);
        decimals = 2;

        int128 total = 0;
        for (uint256 i = 0; i < feedbacks.length; i++) {
            if (!feedbacks[i].revoked) {
                total += feedbacks[i].value;
            }
        }
        value = count > 0 ? total / int128(int64(count)) : int128(0);
    }

    function getClients(uint256) external pure returns (address[] memory) {
        return new address[](0);
    }

    function getFeedbackCount(uint256 agentId) external view returns (uint256) {
        return _feedbacks[agentId].length;
    }
}

contract ReputationManagerTest is Test {
    ReputationManager public repManager;
    MockReputationRegistry public mockReputation;

    address public owner = address(this);
    address public skcEngine = makeAddr("skcEngine");
    address public stranger = makeAddr("stranger");

    function setUp() public {
        mockReputation = new MockReputationRegistry();
        repManager = new ReputationManager(address(mockReputation));

        // Authorize skcEngine to write reputation
        repManager.authorizeCaller(skcEngine);
    }

    // ========== Write Reputation Tests ==========

    function test_writeReputation() public {
        vm.prank(skcEngine);
        repManager.writeReputation(1, 8500, "governance");

        (uint64 count, int128 value,) = repManager.getAgentReputation(1);
        assertEq(count, 1);
        assertEq(value, 8500);
    }

    function test_writeReputation_multipleFeedbacks() public {
        vm.prank(skcEngine);
        repManager.writeReputation(1, 8000, "governance");

        vm.prank(skcEngine);
        repManager.writeReputation(1, 9000, "governance");

        (uint64 count, int128 value,) = repManager.getAgentReputation(1);
        assertEq(count, 2);
        assertEq(value, 8500); // average of 8000 and 9000
    }

    function test_writeReputation_revert_notAuthorized() public {
        vm.prank(stranger);
        vm.expectRevert(ReputationManager.NotAuthorized.selector);
        repManager.writeReputation(1, 8500, "governance");
    }

    function test_writeReputation_emitsEvent() public {
        vm.expectEmit(true, false, false, true);
        emit ReputationManager.ReputationUpdated(1, 8500, "skc_accuracy", "governance");

        vm.prank(skcEngine);
        repManager.writeReputation(1, 8500, "governance");
    }

    function test_writeReputation_negativeScore() public {
        vm.prank(skcEngine);
        repManager.writeReputation(1, -5000, "dispute");

        (uint64 count, int128 value,) = repManager.getAgentReputation(1);
        assertEq(count, 1);
        assertEq(value, -5000);
    }

    // ========== Eligibility Tests ==========

    function test_isAgentEligible_noFeedback_zeroThreshold() public view {
        // New agent with no feedback, threshold 0 → eligible
        assertTrue(repManager.isAgentEligible(99, 0, ""));
    }

    function test_isAgentEligible_noFeedback_positiveThreshold() public view {
        // New agent with no feedback, threshold > 0 → not eligible
        assertFalse(repManager.isAgentEligible(99, 50, ""));
    }

    function test_isAgentEligible_meetsThreshold() public {
        vm.prank(skcEngine);
        repManager.writeReputation(1, 8500, "governance");

        assertTrue(repManager.isAgentEligible(1, 8000, ""));
    }

    function test_isAgentEligible_belowThreshold() public {
        vm.prank(skcEngine);
        repManager.writeReputation(1, 3000, "governance");

        assertFalse(repManager.isAgentEligible(1, 5000, ""));
    }

    // ========== Admin Tests ==========

    function test_authorizeCaller() public {
        address newCaller = makeAddr("newCaller");
        repManager.authorizeCaller(newCaller);
        assertTrue(repManager.authorizedCallers(newCaller));
    }

    function test_revokeCaller() public {
        repManager.revokeCaller(skcEngine);
        assertFalse(repManager.authorizedCallers(skcEngine));
    }

    function test_authorizeCaller_revert_notOwner() public {
        vm.prank(stranger);
        vm.expectRevert(ReputationManager.NotOwner.selector);
        repManager.authorizeCaller(makeAddr("x"));
    }

    function test_transferOwnership() public {
        address newOwner = makeAddr("newOwner");
        repManager.transferOwnership(newOwner);
        assertEq(repManager.owner(), newOwner);
    }
}
