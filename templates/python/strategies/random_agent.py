"""
Random Agent — baseline strategy.
Predicts random probability. Useful for testing that the mechanism works.
A good agent should beat this consistently.
"""
import random


def predict(question: str, reports: list[dict], current_price: float) -> float:
    return round(random.uniform(0.1, 0.9), 2)
