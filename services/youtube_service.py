from urllib.parse import urlparse, parse_qs

import yt_dlp
from youtube_transcript_api import YouTubeTranscriptApi


def extract_video_id(youtube_url):
    parsed_url = urlparse(youtube_url)

    # Standard YouTube URL:
    # https://www.youtube.com/watch?v=VIDEO_ID
    if parsed_url.hostname in ("www.youtube.com", "youtube.com"):
        video_id = parse_qs(parsed_url.query).get("v")

        if video_id:
            return video_id[0]

    # Short YouTube URL:
    # https://youtu.be/VIDEO_ID
    if parsed_url.hostname == "youtu.be":
        video_id = parsed_url.path.strip("/")

        if video_id:
            return video_id

    return None


def get_video_info(youtube_url):
    options = {
        "quiet": True,
        "no_warnings": True,
        "skip_download": True
    }

    with yt_dlp.YoutubeDL(options) as ydl:
        info = ydl.extract_info(youtube_url, download=False)

    return {
        "video_id": info.get("id"),
        "title": info.get("title"),
        "channel": info.get("uploader"),
        "thumbnail": info.get("thumbnail"),
        "duration": info.get("duration")
    }


def get_transcript(youtube_url):
    video_id = extract_video_id(youtube_url)

    if not video_id:
        raise ValueError("Invalid YouTube URL")

    api = YouTubeTranscriptApi()

    # Try English first, then Hindi
    transcript = api.fetch(
        video_id,
        languages=["en", "hi"]
    )

    text = " ".join(snippet.text for snippet in transcript)

    return text


if __name__ == "__main__":
    test_url = "https://www.youtube.com/watch?v=xrj3zzaqODw&t=662s"

    video_info = get_video_info(test_url)

    print("Video Information:")
    print(video_info)

    transcript = get_transcript(test_url)

    print("\nTranscript:")
    print(transcript[:1000])