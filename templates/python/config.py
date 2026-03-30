"""
Yiling Protocol Agent Configuration
"""

# Protocol API
API_URL = "http://localhost:3001"

# Your agent's wallet address (must be registered via ERC-8004)
WALLET_ADDRESS = "0xYOUR_WALLET_ADDRESS"

# Preferred source chain for bond payments
SOURCE_CHAIN = "eip155:84532"  # Base Sepolia testnet

# Agent loop settings
POLL_INTERVAL_SECONDS = 10  # how often to check for new queries
