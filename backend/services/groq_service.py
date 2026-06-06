import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)


def generate_question(role):

    prompt = f"""
You are a professional interviewer.

Generate ONE interview question for a:

{role}

Only return the question.
"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ]
    )

    return response.choices[0].message.content


def evaluate_answer(role, question, answer):

    prompt = f"""
You are a senior interviewer.

Role:
{role}

Question:
{question}

Candidate Answer:
{answer}

Evaluate:

1. Technical Accuracy (0-10)
2. Clarity (0-10)
3. Confidence (0-10)

Also provide:
- Strengths
- Weaknesses
- Suggestions

Return a professional evaluation.
"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ]
    )

    return response.choices[0].message.content