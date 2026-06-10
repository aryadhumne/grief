from textblob import TextBlob
import re

# Crisis keywords — triggers immediate helpline display
CRISIS_KEYWORDS = [
    "end my life", "can't go on", "want to die", "no point living",
    "kill myself", "suicide", "hurt myself", "self harm", "give up on life",
    "don't want to be here", "better off dead"
]

# Grief stage keyword mapping (Kübler-Ross model)
GRIEF_STAGE_KEYWORDS = {
    "denial": [
        "can't believe", "not real", "feels like a dream", "impossible",
        "didn't happen", "still waiting", "any moment now", "not gone"
    ],
    "anger": [
        "angry", "furious", "not fair", "hate", "why me", "rage",
        "unfair", "blame", "fault", "so mad", "frustrated"
    ],
    "bargaining": [
        "if only", "what if", "should have", "could have", "my fault",
        "maybe if", "wish i had", "why didn't i", "i regret"
    ],
    "depression": [
        "empty", "hopeless", "meaningless", "exhausted", "can't sleep",
        "don't eat", "alone", "nothing matters", "dark", "numb",
        "miss them", "miss him", "miss her", "lost without"
    ],
    "acceptance": [
        "learning to", "moving forward", "grateful", "remember them",
        "healing", "okay now", "better today", "at peace", "memories"
    ]
}

# System prompts per grief stage
STAGE_PROMPTS = {
    "denial": (
        "The user may be in denial about their loss. They might not fully accept "
        "that the person is gone. Be gentle, don't force acceptance. Just be present "
        "and acknowledge their pain with warmth and patience."
    ),
    "anger": (
        "The user seems to be feeling anger about their loss. This is a completely "
        "normal part of grief. Validate their feelings without judgment. Don't try "
        "to fix their anger — just let them feel heard and understood."
    ),
    "bargaining": (
        "The user seems to be bargaining or feeling guilt and regret. They may be "
        "asking 'what if' questions. Gently reassure them that grief is not their "
        "fault and that they did the best they could."
    ),
    "depression": (
        "The user seems deeply sad and possibly withdrawn. Be especially warm and "
        "compassionate. Remind them they are not alone, that their feelings are valid, "
        "and that healing takes time. Offer comfort without toxic positivity."
    ),
    "acceptance": (
        "The user seems to be gradually finding peace or acceptance. Encourage their "
        "healing gently. Celebrate small steps forward while still acknowledging "
        "that grief has no fixed timeline."
    ),
    "neutral": (
        "The user is sharing something about their grief journey. Listen with empathy, "
        "ask a gentle follow-up question, and make them feel genuinely heard."
    )
}


def detect_crisis(text: str) -> bool:
    """Returns True if the message contains crisis-level language."""
    text_lower = text.lower()
    return any(keyword in text_lower for keyword in CRISIS_KEYWORDS)


def detect_grief_stage(text: str) -> str:
    """
    Detects the most likely grief stage from the message.
    Returns one of: denial, anger, bargaining, depression, acceptance, neutral.
    """
    text_lower = text.lower()
    scores = {stage: 0 for stage in GRIEF_STAGE_KEYWORDS}

    for stage, keywords in GRIEF_STAGE_KEYWORDS.items():
        for keyword in keywords:
            if keyword in text_lower:
                scores[stage] += 1

    best_stage = max(scores, key=scores.get)

    # Fall back to neutral if no keywords matched
    if scores[best_stage] == 0:
        return "neutral"

    return best_stage


def analyze_sentiment(text: str) -> dict:
    """
    Returns sentiment polarity and subjectivity using TextBlob.
    polarity: -1.0 (very negative) to 1.0 (very positive)
    subjectivity: 0.0 (objective) to 1.0 (very emotional/subjective)
    """
    blob = TextBlob(text)
    polarity = round(blob.sentiment.polarity, 3)
    subjectivity = round(blob.sentiment.subjectivity, 3)

    # Map polarity to a human-readable label
    if polarity <= -0.5:
        label = "very negative"
    elif polarity <= -0.1:
        label = "negative"
    elif polarity <= 0.1:
        label = "neutral"
    elif polarity <= 0.5:
        label = "positive"
    else:
        label = "very positive"

    return {
        "polarity": polarity,
        "subjectivity": subjectivity,
        "label": label
    }


def get_stage_prompt(stage: str) -> str:
    """Returns the system prompt instruction for the detected grief stage."""
    return STAGE_PROMPTS.get(stage, STAGE_PROMPTS["neutral"])