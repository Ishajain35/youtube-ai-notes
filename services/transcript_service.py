import re

from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api._errors import (
    NoTranscriptFound,
    TranscriptsDisabled
)


def clean_transcript(transcript):
    """
    Converts transcript entries into clean readable text.
    """

    text = " ".join(item.text for item in transcript)

    # Remove extra spaces
    text = re.sub(r"\s+", " ", text)

    return text.strip()


def get_transcript(video_id):
    """
    Fetches the available YouTube transcript.

    Priority:
    1. Hindi
    2. English
    """

    try:
        api = YouTubeTranscriptApi()

        transcript = api.fetch(
            video_id,
            languages=("hi", "en")
        )

        return clean_transcript(transcript)

    except TranscriptsDisabled:
        raise Exception(
            "Transcript is disabled for this video."
        )

    except NoTranscriptFound:
        raise Exception(
            "No transcript was found for this video."
        )

    except Exception as error:
        raise Exception(
            f"Unable to fetch transcript: {error}"
        )


if __name__ == "__main__":
    test_video_id = "xrj3zzaqODw"

    transcript = get_transcript(test_video_id)

    print("Transcript fetched successfully!")
    print()
    print(transcript[:1000])