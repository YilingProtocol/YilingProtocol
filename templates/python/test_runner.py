"""
Test Runner — Run multiple agents with different strategies simultaneously.

This script:
  1. Creates a test query
  2. Launches multiple agents with different strategies
  3. Each agent submits a report
  4. Shows results after resolution

Usage:
  python test_runner.py
"""

import time
import requests
import importlib
from config import API_URL

# Test agents with different strategies
AGENTS = [
    {
        "name": "RandomAgent",
        "wallet": "0x1111111111111111111111111111111111111111",
        "strategy": "strategies.random_agent",
    },
    {
        "name": "TrendFollower",
        "wallet": "0x2222222222222222222222222222222222222222",
        "strategy": "strategies.trend_follower",
    },
    {
        "name": "Contrarian",
        "wallet": "0x3333333333333333333333333333333333333333",
        "strategy": "strategies.contrarian",
    },
    {
        "name": "Bayesian",
        "wallet": "0x4444444444444444444444444444444444444444",
        "strategy": "strategies.bayesian",
    },
]


def create_test_query() -> str:
    """Create a test query."""
    res = requests.post(
        f"{API_URL}/query/create",
        json={
            "question": "Will ETH be above $5000 by end of 2026?",
            "bondPool": str(int(5e18)),
            "alpha": str(int(0.2e18)),
            "k": "1",
            "flatReward": str(int(0.01e18)),
            "bondAmount": str(int(0.1e18)),
            "liquidityParam": str(int(1e18)),
            "initialPrice": str(int(0.5e18)),
            "creator": "0x0000000000000000000000000000000000000000",
        },
    )
    res.raise_for_status()
    data = res.json()
    print(f"Query created! tx: {data['txHash']}")
    return "0"  # first query ID


def run_agent(agent: dict, query_id: str):
    """Run a single agent's prediction."""
    # Load strategy module
    strategy_mod = importlib.import_module(agent["strategy"])

    # Get query status
    res = requests.get(f"{API_URL}/query/{query_id}/status")
    status = res.json()

    current_price = int(status["currentPrice"]) / 1e18
    reports = []
    for r in status["reports"]:
        reports.append({
            "probability": int(r["probability"]) / 1e18,
            "priceBefore": int(r["priceBefore"]) / 1e18,
            "priceAfter": int(r["priceAfter"]) / 1e18,
        })

    # Run strategy
    probability = strategy_mod.predict(status["question"], reports, current_price)
    probability = max(0.02, min(0.98, probability))

    print(f"  {agent['name']}: predicts {probability:.4f} (current: {current_price:.4f})")

    # Submit report
    prob_wad = str(int(probability * 1e18))
    res = requests.post(
        f"{API_URL}/query/{query_id}/report",
        json={
            "probability": prob_wad,
            "reporter": agent["wallet"],
            "sourceChain": "eip155:84532",
        },
    )
    res.raise_for_status()
    print(f"    Submitted! tx: {res.json()['txHash']}")


def check_results(query_id: str):
    """Check final results after resolution."""
    res = requests.get(f"{API_URL}/query/{query_id}/status")
    status = res.json()

    if not status["resolved"]:
        print("Query not yet resolved.")
        return

    print(f"\nResults for: '{status['question']}'")
    print(f"Final price (truth): {int(status['currentPrice']) / 1e18:.4f}")
    print(f"Total reports: {status['reportCount']}")
    print()

    for i, agent in enumerate(AGENTS):
        if i < len(status["reports"]):
            report = status["reports"][i]
            prob = int(report["probability"]) / 1e18

            # Check payout
            res = requests.get(f"{API_URL}/query/{query_id}/payout/{agent['wallet']}")
            payout = res.json()

            print(f"  {agent['name']}:")
            print(f"    Prediction: {prob:.4f}")
            print(f"    Gross payout: {payout['gross']}")
            print(f"    Rake: {payout['rake']}")
            print(f"    Net payout: {payout['net']}")


def main():
    print("=== Yiling Protocol Test Runner ===\n")

    # 1. Create query
    print("Creating test query...")
    query_id = create_test_query()
    time.sleep(2)

    # 2. Run each agent
    print("\nRunning agents...")
    for agent in AGENTS:
        try:
            run_agent(agent, query_id)
            time.sleep(1)
        except Exception as e:
            print(f"  {agent['name']}: Error - {e}")

    # 3. Force resolve
    print("\nForce resolving...")
    try:
        res = requests.post(f"{API_URL}/query/{query_id}/resolve")
        res.raise_for_status()
        print(f"Resolved! tx: {res.json()['txHash']}")
    except Exception as e:
        print(f"Resolve error: {e}")

    time.sleep(2)

    # 4. Check results
    check_results(query_id)


if __name__ == "__main__":
    main()
