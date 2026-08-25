from flask import Blueprint, request, jsonify

from services.youtube_service import get_video_info, get_transcript
from services.ai_service import generate_notes
from middleware.auth_middleware import token_required


ai_bp = Blueprint("ai", __name__, url_prefix="/api/ai")


@ai_bp.route("/notes", methods=["POST"])
@token_required
def generate_ai_notes():
    data = request.get_json()

    if not data or "youtube_url" not in data:
        return jsonify({
            "error": "youtube_url is required"
        }), 400

    youtube_url = data["youtube_url"]

    try:
        video_info = get_video_info(youtube_url)
        transcript = get_transcript(youtube_url)

        notes = generate_notes(transcript)

        return jsonify({
            "success": True,
            "video": video_info,
            "notes": notes
        }), 200

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500