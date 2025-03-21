import random

responses = [
    "I am calling from Hello Patient!",
    "Would you like to reschedule?",
    "Sorry the doctor is not available at that time.",
    "Would you like to see your previous doctor.",
    "Thank you. Your appointment is confirmed.",
    "Is there anything you would like to ask me?",
]


def generate_ai_response():
    return random.choice(responses)
