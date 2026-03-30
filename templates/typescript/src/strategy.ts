/**
 * Your prediction strategy.
 *
 * This is the only file you need to modify.
 * Write your logic in the predict() function.
 */

interface Report {
  probability: number;
  priceBefore: number;
  priceAfter: number;
}

/**
 * Given a question and existing reports, return your probability estimate.
 *
 * @param question - The truth discovery question
 * @param reports - Previous reports with probabilities
 * @param currentPrice - Current market price (0.01 to 0.99)
 * @returns Your probability estimate between 0.02 and 0.98
 */
export function predict(
  question: string,
  reports: Report[],
  currentPrice: number
): number {
  // === EXAMPLE STRATEGIES (uncomment one or write your own) ===

  // Strategy 1: Random (baseline)
  // return Math.round((Math.random() * 0.8 + 0.1) * 100) / 100;

  // Strategy 2: Slight contrarian
  // if (currentPrice > 0.5) {
  //   return Math.max(0.02, currentPrice - 0.15);
  // } else {
  //   return Math.min(0.98, currentPrice + 0.15);
  // }

  // Strategy 3: Trend following
  // if (reports.length === 0) return 0.5;
  // const lastProb = reports[reports.length - 1].probability;
  // if (lastProb > currentPrice) {
  //   return Math.min(0.98, currentPrice + 0.1);
  // } else {
  //   return Math.max(0.02, currentPrice - 0.1);
  // }

  // Default: return current price (no opinion)
  return currentPrice;
}
