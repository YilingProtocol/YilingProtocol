"""
Yiling Protocol Agent Runner

This agent automatically:
  1. Discovers active queries
  2. Runs your strategy to generate predictions
  3. Submits reports via the Protocol API
  4. Claims payouts after resolution

You only need to modify strategy.py — this file handles everything else.
"""

import time
import requests
from strategy import predict
from config import API_URL, WALLET_ADDRESS, SOURCE_CHAIN, POLL_INTERVAL_SECONDS


def get_active_queries() -> list[dict]:
    """Fetch all active (unresolved) queries."""
    res = requests.get(f"{API_URL}/queries/active")
    res.raise_for_status()
    return res.json()["activeQueries"]


def get_query_status(query_id: str) -> dict:
    """Get detailed query info including reports."""
    res = requests.get(f"{API_URL}/query/{query_id}/status")
    res.raise_for_status()
    return res.json()


def has_already_reported(query_id: str) -> bool:
    """Check if we already reported on this query."""
    status = get_query_status(query_id)
    for report in status["reports"]:
        if report["reporter"].lower() == WALLET_ADDRESS.lower():
            return True
    return False


def submit_report(query_id: str, probability: float) -> dict:
    """Submit a probability report for a query."""
    # Convert probability to WAD format (1e18)
    prob_wad = str(int(probability * 1e18))

    res = requests.post(
        f"{API_URL}/query/{query_id}/report",
        json={
            "probability": prob_wad,
            "reporter": WALLET_ADDRESS,
            "sourceChain": SOURCE_CHAIN,
        },
    )
    res.raise_for_status()
    return res.json()


def check_and_claim_payouts():
    """Check all resolved queries for unclaimed payouts."""
    res = requests.get(f"{API_URL}/queries/active")
    # We need to check resolved queries too — for now, iterate known queries
    # In production, use webhooks for query.resolved events
    pass


def parse_reports(reports: list[dict]) -> list[dict]:
    """Convert report data for strategy consumption."""
    parsed = []
    for r in reports:
        parsed.append({
            "probability": int(r["probability"]) / 1e18,
            "priceBefore": int(r["priceBefore"]) / 1e18,
            "priceAfter": int(r["priceAfter"]) / 1e18,
        })
    return parsed


def run():
    """Main agent loop."""
    print(f"Yiling Agent starting...")
    print(f"  Wallet: {WALLET_ADDRESS}")
    print(f"  API: {API_URL}")
    print(f"  Chain: {SOURCE_CHAIN}")
    print(f"  Poll interval: {POLL_INTERVAL_SECONDS}s")
    print()

    while True:
        try:
            # 1. Discover active queries
            queries = get_active_queries()

            if queries:
                print(f"Found {len(queries)} active queries")

            for q in queries:
                query_id = q["queryId"]
                question = q["question"]

                # 2. Skip if already reported
                if has_already_reported(query_id):
                    continue

                # 3. Get full query details
                status = get_query_status(query_id)
                current_price = int(status["currentPrice"]) / 1e18
                reports = parse_reports(status["reports"])

                # 4. Run strategy
                probability = predict(question, reports, current_price)

                # Clamp to valid range
                probability = max(0.02, min(0.98, probability))

                print(f"  Query #{query_id}: '{question}'")
                print(f"    Current price: {current_price:.4f}")
                print(f"    My prediction: {probability:.4f}")

                # 5. Submit report
                result = submit_report(query_id, probability)
                print(f"    Submitted! tx: {result['txHash']}")

        except requests.exceptions.ConnectionError:
            print("Cannot reach API, retrying...")
        except Exception as e:
            print(f"Error: {e}")

        time.sleep(POLL_INTERVAL_SECONDS)


if __name__ == "__main__":
    run()
