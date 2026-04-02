"""
Yiling Protocol Agent Runner

This agent automatically:
  1. Discovers active queries
  2. Runs your strategy to generate predictions
  3. Submits reports via the Protocol API (with x402 payment)
  4. Claims payouts after resolution

You only need to modify strategy.py — this file handles everything else.
"""

import time
import json
import requests
from strategy import predict
from config import (
    API_URL, WALLET_ADDRESS, SOURCE_CHAIN,
    POLL_INTERVAL_SECONDS, PRIVATE_KEY,
)


# ========== x402 PAYMENT HANDLING ==========

def make_x402_request(method: str, url: str, json_body: dict = None) -> dict:
    """
    Make an API request with x402 payment handling.

    If the endpoint returns 402 Payment Required, extracts the payment
    requirements and signs a payment. For free endpoints, works like
    a normal request.
    """
    headers = {"Content-Type": "application/json"}

    if method == "GET":
        res = requests.get(url, headers=headers)
    else:
        res = requests.post(url, json=json_body, headers=headers)

    # Free endpoint — return directly
    if res.status_code != 402:
        res.raise_for_status()
        return res.json()

    # 402 Payment Required — need to pay
    if not PRIVATE_KEY:
        raise Exception(
            "x402 payment required but PRIVATE_KEY not set in config.py. "
            "This endpoint costs money (bond payment)."
        )

    # Extract payment requirements from 402 response
    try:
        payment_info = res.json()
    except Exception:
        raise Exception(f"Got 402 but could not parse payment info: {res.text}")

    accepts = payment_info.get("accepts", [])
    if not accepts:
        raise Exception(f"402 response has no accepts field: {payment_info}")

    # Find accepts entry matching our preferred SOURCE_CHAIN
    chosen = None
    for a in accepts:
        if a.get("network") == SOURCE_CHAIN:
            chosen = a
            break
    if not chosen:
        chosen = accepts[0]  # fallback to first option

    print(f"    x402 payment required: {chosen.get('price', '?')} on {chosen.get('network', '?')}")

    # Sign and send payment
    # For EVM chains, we use eth_signTypedData via web3
    payment_header = sign_x402_payment(chosen)

    # Retry with payment header
    headers["X-PAYMENT"] = payment_header
    if method == "GET":
        res2 = requests.get(url, headers=headers)
    else:
        res2 = requests.post(url, json=json_body, headers=headers)

    res2.raise_for_status()
    return res2.json()


def sign_x402_payment(accepts: dict) -> str:
    """
    Sign an x402 payment using the agent's private key.

    Requires web3 for EVM chains. Install: pip install web3
    """
    network = accepts.get("network", "")
    pay_to = accepts.get("payTo", "")
    price = accepts.get("price", "0")
    scheme = accepts.get("scheme", "exact")

    if network.startswith("eip155:"):
        return _sign_evm_payment(network, pay_to, price, scheme)
    elif network.startswith("solana:"):
        raise Exception(
            "Solana x402 payment not yet supported in Python template. "
            "Use TypeScript template with @x402/fetch for Solana."
        )
    else:
        raise Exception(f"Unknown network type: {network}")


def _sign_evm_payment(network: str, pay_to: str, price: str, scheme: str) -> str:
    """Sign EVM x402 payment using EIP-712 typed data."""
    try:
        from web3 import Web3
        from eth_account import Account
        from eth_account.messages import encode_typed_data
    except ImportError:
        raise Exception(
            "web3 package required for x402 payments. Install: pip install web3"
        )

    chain_id = int(network.split(":")[1])

    # Parse price (e.g., "$1.00" → 1000000 USDC units)
    price_num = float(price.replace("$", ""))
    amount = int(price_num * 1_000_000)  # USDC has 6 decimals

    # Build EIP-712 payload for x402 exact scheme
    payment_payload = {
        "scheme": scheme,
        "network": network,
        "payTo": pay_to,
        "amount": str(amount),
        "payer": WALLET_ADDRESS,
    }

    # Sign the payment payload
    account = Account.from_key(PRIVATE_KEY)
    signature = account.sign_message(
        encode_typed_data(
            domain_data={
                "name": "x402",
                "version": "1",
                "chainId": chain_id,
            },
            message_types={
                "Payment": [
                    {"name": "scheme", "type": "string"},
                    {"name": "network", "type": "string"},
                    {"name": "payTo", "type": "address"},
                    {"name": "amount", "type": "uint256"},
                    {"name": "payer", "type": "address"},
                ],
            },
            message_data=payment_payload,
        )
    )

    # Return as JSON string (x402 payment header format)
    payment_payload["signature"] = signature.signature.hex()
    return json.dumps(payment_payload)


# ========== API FUNCTIONS ==========

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
    """Submit a probability report for a query (with x402 bond payment)."""
    prob_wad = str(int(probability * 1e18))

    return make_x402_request(
        "POST",
        f"{API_URL}/query/{query_id}/report",
        json_body={
            "probability": prob_wad,
            "reporter": WALLET_ADDRESS,
            "sourceChain": SOURCE_CHAIN,
        },
    )


def check_and_claim_payouts(reported_queries: list[str]):
    """Check resolved queries for unclaimed payouts and claim them."""
    for query_id in reported_queries:
        try:
            status = get_query_status(query_id)
            if not status.get("resolved"):
                continue

            # Check payout amount
            res = requests.get(f"{API_URL}/query/{query_id}/payout/{WALLET_ADDRESS}")
            if res.status_code != 200:
                continue

            payout_info = res.json()
            net = int(payout_info.get("net", "0"))
            if net <= 0:
                continue

            # Claim payout (free endpoint — no x402 needed)
            claim_res = requests.post(
                f"{API_URL}/query/{query_id}/claim",
                json={
                    "reporter": WALLET_ADDRESS,
                    "payoutChain": SOURCE_CHAIN,
                },
            )
            claim_res.raise_for_status()
            result = claim_res.json()
            print(f"  Claimed payout for query #{query_id}: {result['payout']}")
        except Exception as e:
            print(f"  Payout check failed for query #{query_id}: {e}")


def check_registration():
    """Verify this agent is registered in the Yiling Protocol ecosystem."""
    res = requests.get(f"{API_URL}/agent/{WALLET_ADDRESS}/status")
    res.raise_for_status()
    status = res.json()

    if not status.get("isRegistered"):
        print("WARNING: This wallet is NOT registered in Yiling Protocol.")
        print("  You need an ERC-8004 Identity and must call joinEcosystem().")
        print(f"  Run: POST {API_URL}/agent/register with your wallet to get instructions.")
        print()
        return False
    else:
        print(f"  Registered as agent #{status['agentId']}")
        return True


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


# ========== MAIN LOOP ==========

def run():
    """Main agent loop."""
    print(f"Yiling Agent starting...")
    print(f"  Wallet: {WALLET_ADDRESS}")
    print(f"  API: {API_URL}")
    print(f"  Chain: {SOURCE_CHAIN}")
    print(f"  Poll interval: {POLL_INTERVAL_SECONDS}s")
    print()

    # Check registration before starting
    if not check_registration():
        print("Agent is not registered. Register first, then restart.")
        return

    reported_queries: list[str] = []

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

                # 5. Submit report (x402 handles bond payment)
                result = submit_report(query_id, probability)
                print(f"    Submitted! tx: {result.get('txHash', 'pending')}")

                reported_queries.append(query_id)

            # 6. Check for claimable payouts
            if reported_queries:
                check_and_claim_payouts(reported_queries)

        except requests.exceptions.ConnectionError:
            print("Cannot reach API, retrying...")
        except Exception as e:
            print(f"Error: {e}")

        time.sleep(POLL_INTERVAL_SECONDS)


if __name__ == "__main__":
    run()
