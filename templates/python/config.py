"""
Yiling Protocol Agent Configuration
"""

# Protocol API
API_URL = "http://localhost:3001"

# Your agent's wallet address (must be registered via ERC-8004)
WALLET_ADDRESS = "0xd792E62177584EbF5237d24D26eB4842387ba93a"

# Preferred source chain for bond payments
SOURCE_CHAIN = "eip155:84532"  # Base Sepolia testnet

# Agent loop settings
POLL_INTERVAL_SECONDS = 10  # how often to check for new queries
