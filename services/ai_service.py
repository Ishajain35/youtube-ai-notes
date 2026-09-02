from google import genai
from config import Config
import json


client = genai.Client(api_key=Config.GEMINI_API_KEY)


def generate_notes(transcript):
    prompt = f"""
You are an AI assistant that converts YouTube video transcripts
into clear, structured, easy-to-understand English study material.

Return ONLY valid JSON.
Do not use markdown.
Do not add ```json or ``` around the response.

Use exactly this JSON structure:

{{
    "summary": "Short summary of the video",
    "key_points": [
        "Important point 1",
        "Important point 2",
        "Important point 3"
    ],
    "concepts": [
        {{
            "title": "Concept name",
            "explanation": "Simple explanation"
        }}
    ],
    "examples": [
        "Important example 1",
        "Important example 2"
    ],
    "revision_questions": [
        {{
            "question": "Question 1",
            "answer": "Answer 1",
            "question_type": "concept"
        }},
        {{
            "question": "Question 2",
            "answer": "Answer 2",
            "question_type": "concept"
        }},
        {{
            "question": "Question 3",
            "answer": "Answer 3",
            "question_type": "interview"
        }},
        {{
            "question": "Question 4",
            "answer": "Answer 4",
            "question_type": "technical"
        }},
        {{
            "question": "Question 5",
            "answer": "Answer 5",
            "question_type": "revision"
        }}
    ]
}}

Rules:
- Generate exactly 5 revision questions.
- Questions must be based only on the transcript.
- Answers must be clear and accurate.
- Use proper English.
- Keep questions useful for exam and interview preparation.
- Do not include information that is not present in the transcript.

Transcript:
{transcript}
"""

    response = client.models.generate_content(
        model=Config.GEMINI_MODEL,
        contents=prompt
    )

    try:
        return json.loads(response.text)
    except json.JSONDecodeError:
        raise ValueError("Gemini returned invalid JSON")