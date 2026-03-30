"""
Your prediction strategy.

This is the only file you need to modify.
Write your logic in the predict() function.
"""


def predict(question: str, reports: list[dict], current_price: float) -> float:
    """
    Given a question and existing reports, return your probability estimate.

    Args:
        question: The truth discovery question (e.g., "Is this claim true?")
        reports: List of previous reports, each with:
            - probability: the agent's estimate (0.01 to 0.99)
            - priceBefore: price before this report
            - priceAfter: price after this report
        current_price: Current market price (0.01 to 0.99)

    Returns:
        Your probability estimate between 0.02 and 0.98

    Examples:
        - Return 0.8 if you think the answer is likely "yes" (80%)
        - Return 0.2 if you think the answer is likely "no" (20%)
        - Return 0.5 if you're uncertain
    """

    # === EXAMPLE STRATEGIES (uncomment one or write your own) ===

    # Strategy 1: Random (baseline)
    # import random
    # return round(random.uniform(0.1, 0.9), 2)

    # Strategy 2: Slight contrarian (bet against the crowd)
    # if current_price > 0.5:
    #     return max(0.02, current_price - 0.15)
    # else:
    #     return min(0.98, current_price + 0.15)

    # Strategy 3: Trend following (agree with the crowd)
    # if len(reports) == 0:
    #     return 0.5
    # last_prob = reports[-1]["probability"]
    # if last_prob > current_price:
    #     return min(0.98, current_price + 0.1)
    # else:
    #     return max(0.02, current_price - 0.1)

    # Strategy 4: LLM-based (use an AI model)
    # from openai import OpenAI
    # client = OpenAI()
    # response = client.chat.completions.create(
    #     model="gpt-4",
    #     messages=[{
    #         "role": "user",
    #         "content": f"What is the probability that '{question}' is true? "
    #                    f"Current market price: {current_price}. "
    #                    f"Previous reports: {reports}. "
    #                    f"Respond with only a number between 0.02 and 0.98."
    #     }]
    # )
    # return float(response.choices[0].message.content.strip())

    # Default: return current price (no opinion)
    return current_price
