// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {FixedPointMath} from "../src/FixedPointMath.sol";

contract FixedPointMathTest is Test {
    uint256 constant WAD = 1e18;

    // ========== lnWad Tests ==========

    function test_lnWad_one() public pure {
        // ln(1) = 0
        int256 result = FixedPointMath.lnWad(WAD);
        assertApproxEqAbs(result, 0, 1e10, "ln(1) should be 0");
    }

    function test_lnWad_two() public pure {
        // ln(2) ≈ 0.6931...
        int256 result = FixedPointMath.lnWad(2 * WAD);
        assertApproxEqAbs(result, 693147180559945309, 1e10, "ln(2) should be ~0.6931e18");
    }

    function test_lnWad_half() public pure {
        // ln(0.5) ≈ -0.6931...
        int256 result = FixedPointMath.lnWad(WAD / 2);
        assertApproxEqAbs(result, -693147180559945309, 1e10, "ln(0.5) should be ~-0.6931e18");
    }

    function test_lnWad_e() public pure {
        // ln(e) = 1, e ≈ 2.718281828...
        int256 result = FixedPointMath.lnWad(2718281828459045235);
        assertApproxEqAbs(result, int256(WAD), 1e12, "ln(e) should be ~1e18");
    }

    function test_lnWad_smallValue() public pure {
        // ln(0.01) ≈ -4.605...
        int256 result = FixedPointMath.lnWad(0.01e18);
        assertApproxEqAbs(result, -4605170185988091368, 1e12, "ln(0.01) should be ~-4.605e18");
    }

    function test_lnWad_revert_zero() public {
        // Library internal calls can't use vm.expectRevert directly
        // Instead we verify it reverts by using try/catch via a helper
        try this.callLnWad(0) {
            fail("Should have reverted");
        } catch {}
    }

    function callLnWad(uint256 x) external pure returns (int256) {
        return FixedPointMath.lnWad(x);
    }

    // ========== crossEntropyScore Tests ==========

    function test_crossEntropy_perfect() public pure {
        // S(0.8, 0.8) should be the maximum score for q=0.8
        int256 perfect = FixedPointMath.crossEntropyScore(0.8e18, 0.8e18);
        int256 worse = FixedPointMath.crossEntropyScore(0.8e18, 0.5e18);
        assertTrue(perfect > worse, "Perfect prediction should score higher");
    }

    function test_crossEntropy_symmetric() public pure {
        // S(0.5, p) should equal S(0.5, 1-p) when q=0.5
        int256 score1 = FixedPointMath.crossEntropyScore(0.5e18, 0.3e18);
        int256 score2 = FixedPointMath.crossEntropyScore(0.5e18, 0.7e18);
        assertApproxEqAbs(score1, score2, 1e10, "Symmetric around q=0.5");
    }

    function test_crossEntropy_alwaysNegative() public pure {
        // Cross-entropy score is always <= 0
        int256 score = FixedPointMath.crossEntropyScore(0.7e18, 0.3e18);
        assertTrue(score <= 0, "Cross-entropy should be <= 0");
    }

    function test_crossEntropy_revert_qOutOfRange() public {
        try this.callCrossEntropy(0, 0.5e18) {
            fail("Should have reverted");
        } catch {}
    }

    function test_crossEntropy_revert_pOutOfRange() public {
        try this.callCrossEntropy(0.5e18, WAD) {
            fail("Should have reverted");
        } catch {}
    }

    function callCrossEntropy(uint256 q, uint256 p) external pure returns (int256) {
        return FixedPointMath.crossEntropyScore(q, p);
    }

    // ========== deltaPayout Tests ==========

    function test_delta_towardTruth_positive() public pure {
        // Moving price toward truth should give positive delta
        // truth=0.8, price moved from 0.5 to 0.75
        int256 delta = FixedPointMath.deltaPayout(0.8e18, 0.5e18, 0.75e18);
        assertTrue(delta > 0, "Moving toward truth should be positive");
    }

    function test_delta_awayFromTruth_negative() public pure {
        // Moving price away from truth should give negative delta
        // truth=0.8, price moved from 0.7 to 0.4
        int256 delta = FixedPointMath.deltaPayout(0.8e18, 0.7e18, 0.4e18);
        assertTrue(delta < 0, "Moving away from truth should be negative");
    }

    function test_delta_noChange_zero() public pure {
        // Same price before and after = zero delta
        int256 delta = FixedPointMath.deltaPayout(0.8e18, 0.5e18, 0.5e18);
        assertEq(delta, 0, "No price change should give zero delta");
    }

    function test_delta_closerIsBetter() public pure {
        // Agent who moves closer to truth gets higher delta
        int256 delta1 = FixedPointMath.deltaPayout(0.8e18, 0.5e18, 0.6e18); // small move
        int256 delta2 = FixedPointMath.deltaPayout(0.8e18, 0.5e18, 0.75e18); // big move
        assertTrue(delta2 > delta1, "Bigger move toward truth should give higher delta");
    }
}
