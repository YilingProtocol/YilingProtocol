"""
Trend Follower — agrees with the crowd direction.
If price is moving up, pushes it higher. If down, pushes lower.
"""


def predict(question: str, reports: list[dict], current_price: float) -> float:
    if len(reports) < 2:
        return current_price

    prev = reports[-2]["probability"]
    last = reports[-1]["probability"]
    direction = last - prev

    prediction = current_price + direction * 0.5
    return max(0.02, min(0.98, round(prediction, 4)))
