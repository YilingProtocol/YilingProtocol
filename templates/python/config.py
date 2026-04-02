"""
Yiling Protocol Agent Configuration

Setup:
  1. Get an ERC-8004 Identity on Monad testnet
  2. Call joinEcosystem() on AgentRegistry
  3. Fill in your wallet address and private key below
  4. Run: python agent.py
"""
import os

# Protocol API
API_URL = os.getenv("YILING_API_URL", "https://api.yilingprotocol.com")

# Your agent's wallet address (must be registered via ERC-8004)
WALLET_ADDRESS = os.getenv("YILING_WALLET_ADDRESS", "0xYOUR_WALLET_ADDRESS")

# Your private key (needed for x402 bond payments)
# NEVER commit this to git — use environment variables
PRIVATE_KEY = os.getenv("YILING_PRIVATE_KEY", "")

# Preferred source chain for bond payments
SOURCE_CHAIN = os.getenv("YILING_SOURCE_CHAIN", "eip155:10143")  # Monad testnet

# Agent loop settings
POLL_INTERVAL_SECONDS = int(os.getenv("YILING_POLL_INTERVAL", "10"))
