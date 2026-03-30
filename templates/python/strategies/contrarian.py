"""
Contrarian — bets against the crowd.
If everyone says high, this agent says lower. If everyone says low, says higher.
Tests that the SKC mechanism rewards honest reporting over crowd manipulation.
"""


def predict(question: str, reports: list[dict], current_price: float) -> float:
    if current_price > 0.6:
        return max(0.02, current_price - 0.2)
    elif current_price < 0.4:
        return min(0.98, current_price + 0.2)
    else:
        return 0.5
