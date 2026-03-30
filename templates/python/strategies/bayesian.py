"""
Bayesian Agent — updates belief based on previous reports.
Starts with a prior of 0.5, then adjusts based on what others reported.
Gives more weight to recent reports.
"""


def predict(question: str, reports: list[dict], current_price: float) -> float:
    if len(reports) == 0:
        return 0.5

    # Weighted average of previous reports (recent reports weighted more)
    total_weight = 0.0
    weighted_sum = 0.0

    for i, report in enumerate(reports):
        weight = (i + 1) ** 1.5  # increasing weight for later reports
        weighted_sum += report["probability"] * weight
        total_weight += weight

    posterior = weighted_sum / total_weight

    # Blend with own prior (0.5) — gives 70% weight to data, 30% to prior
    blended = 0.7 * posterior + 0.3 * 0.5

    return max(0.02, min(0.98, round(blended, 4)))
