from google import genai
from config import Config


client = genai.Client(api_key=Config.GEMINI_API_KEY)


def generate_notes(transcript):
    prompt = f"""
You are an AI assistant that converts YouTube video transcripts
into clear and useful study notes.

Create:
1. A short summary
2. Important key points
3. Important concepts explained simply
4. Important examples mentioned in the transcript

Transcript:
{transcript}
"""

    response = client.models.generate_content(
        model=Config.GEMINI_MODEL,
        contents=prompt
    )

    return response.text