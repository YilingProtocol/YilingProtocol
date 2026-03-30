// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.24;

/// @title FixedPointMath
/// @notice WAD (1e18) fixed-point math library for SKC mechanism scoring
/// @dev All inputs/outputs use WAD format unless otherwise noted
library FixedPointMath {
    uint256 internal constant WAD = 1e18;
    int256 internal constant WAD_INT = 1e18;

    uint256 internal constant MIN_PROBABILITY = 0.01e18; // 1%
    uint256 internal constant MAX_PROBABILITY = 0.99e18; // 99%

    // ln(2) in WAD format
    int256 internal constant LN2_WAD = 693147180559945309;

    /// @notice Computes ln(x) where x is in WAD format
    /// @dev Uses a converging series expansion for precision
    /// @param x Input in WAD format, must be > 0
    /// @return result ln(x) in WAD format
    function lnWad(uint256 x) internal pure returns (int256 result) {
        require(x > 0, "lnWad: x must be > 0");

        // We use the identity: ln(x) = ln(x/2^k * 2^k) = ln(x/2^k) + k*ln(2)
        // Scale x to [1e18, 2e18) range
        int256 xInt = int256(x);

        // Handle the case where x < WAD (negative logarithm)
        bool negative = xInt < WAD_INT;
        if (negative) {
            // ln(x) = -ln(1/x) = -ln(WAD^2/x / WAD)
            xInt = (WAD_INT * WAD_INT) / xInt;
        }

        // Scale down to [1, 2) range, counting powers of 2
        int256 k = 0;
        while (xInt >= 2 * WAD_INT) {
            xInt /= 2;
            k++;
        }

        // Now x is in [WAD, 2*WAD)
        // Use ln(1+z) = z - z^2/2 + z^3/3 - z^4/4 + ... where z = (x-1)/x
        // More precisely, use ln(x) = 2 * sum(((x-1)/(x+1))^(2n+1) / (2n+1)) for faster convergence
        int256 z = ((xInt - WAD_INT) * WAD_INT) / (xInt + WAD_INT);
        int256 z2 = (z * z) / WAD_INT;

        // Compute series: 2 * (z + z^3/3 + z^5/5 + z^7/7 + z^9/9 + z^11/11 + z^13/13)
        int256 term = z;
        result = term;

        term = (term * z2) / WAD_INT;
        result += term / 3;

        term = (term * z2) / WAD_INT;
        result += term / 5;

        term = (term * z2) / WAD_INT;
        result += term / 7;

        term = (term * z2) / WAD_INT;
        result += term / 9;

        term = (term * z2) / WAD_INT;
        result += term / 11;

        term = (term * z2) / WAD_INT;
        result += term / 13;

        result *= 2;

        // Add back k * ln(2)
        result += k * LN2_WAD;

        // If original x < 1, negate
        if (negative) {
            result = -result;
        }
    }

    /// @notice Cross-entropy scoring function
    /// @dev S(q, p) = q * ln(p) + (1-q) * ln(1-p)
    /// @param q Reference probability (truth) in WAD
    /// @param p Evaluated probability in WAD
    /// @return score Cross-entropy score in WAD (always <= 0)
    function crossEntropyScore(uint256 q, uint256 p) internal pure returns (int256 score) {
        require(q >= MIN_PROBABILITY && q <= MAX_PROBABILITY, "q out of range");
        require(p >= MIN_PROBABILITY && p <= MAX_PROBABILITY, "p out of range");

        int256 lnP = lnWad(p);
        int256 lnOneMinusP = lnWad(WAD - p);

        int256 qInt = int256(q);
        int256 oneMinusQ = WAD_INT - qInt;

        // S(q, p) = q * ln(p) + (1-q) * ln(1-p)
        score = (qInt * lnP) / WAD_INT + (oneMinusQ * lnOneMinusP) / WAD_INT;
    }

    /// @notice Calculates payout delta for an agent's report
    /// @dev ΔS = S(qFinal, pAfter) - S(qFinal, pBefore)
    /// @param qFinal Final truth probability in WAD
    /// @param pBefore Price before agent's report in WAD
    /// @param pAfter Price after agent's report in WAD
    /// @return delta Positive = moved toward truth (reward), Negative = moved away (penalty)
    function deltaPayout(
        uint256 qFinal,
        uint256 pBefore,
        uint256 pAfter
    ) internal pure returns (int256 delta) {
        int256 scoreAfter = crossEntropyScore(qFinal, pAfter);
        int256 scoreBefore = crossEntropyScore(qFinal, pBefore);
        delta = scoreAfter - scoreBefore;
    }
}
