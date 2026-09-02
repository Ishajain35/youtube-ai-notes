from flask import Blueprint, request, jsonify

from services.youtube_service import get_video_info, get_transcript
from services.ai_service import generate_notes
from middleware.auth_middleware import token_required
from database.db import get_db_connection


ai_bp = Blueprint("ai", __name__, url_prefix="/api/ai")


@ai_bp.route("/notes", methods=["POST"])
@token_required
def generate_ai_notes():

    data = request.get_json(silent=True)

    if not data:
        return jsonify({
            "success": False,
            "error": "Request body must contain valid JSON"
        }), 400

    youtube_url = data.get("youtube_url")

    if not youtube_url:
        return jsonify({
            "success": False,
            "error": "youtube_url is required"
        }), 400

    connection = None
    cursor = None

    try:
        # 1. Get YouTube video information
        video_info = get_video_info(youtube_url)

        # 2. Get transcript
        transcript = get_transcript(youtube_url)

        if not transcript:
            return jsonify({
                "success": False,
                "error": "Transcript could not be found"
            }), 404

        # 3. Generate structured AI content
        ai_result = generate_notes(transcript)

        # 4. Connect to database
        connection = get_db_connection()
        cursor = connection.cursor()

        user_id = request.user_id

        # 5. Save video
        cursor.execute(
            """
            INSERT INTO videos
            (user_id, youtube_url, video_title, thumbnail_url)
            VALUES (%s, %s, %s, %s)
            """,
            (
                user_id,
                youtube_url,
                video_info.get("title"),
                video_info.get("thumbnail")
            )
        )

        video_id = cursor.lastrowid

        # 6. Prepare notes
        summary = ai_result.get("summary", "")

        key_points = "\n".join(
            f"- {point}"
            for point in ai_result.get("key_points", [])
        )

        concepts = "\n".join(
            f"{concept.get('title')}: {concept.get('explanation')}"
            for concept in ai_result.get("concepts", [])
        )

        examples = "\n".join(
            f"- {example}"
            for example in ai_result.get("examples", [])
        )

        detailed_notes = (
            "IMPORTANT CONCEPTS\n\n"
            + concepts
            + "\n\nIMPORTANT EXAMPLES\n\n"
            + examples
        )

        # 7. Save notes
        cursor.execute(
            """
            INSERT INTO notes
            (video_id, summary, detailed_notes, key_points)
            VALUES (%s, %s, %s, %s)
            """,
            (
                video_id,
                summary,
                detailed_notes,
                key_points
            )
        )

        notes_id = cursor.lastrowid

        # 8. Save revision questions
        for item in ai_result.get("revision_questions", []):

            cursor.execute(
                """
                INSERT INTO revision_questions
                (notes_id, question, answer, question_type)
                VALUES (%s, %s, %s, %s)
                """,
                (
                    notes_id,
                    item.get("question"),
                    item.get("answer"),
                    item.get("question_type")
                )
            )

        # 9. Commit everything
        connection.commit()

        return jsonify({
            "success": True,
            "message": "Notes and revision questions saved successfully",

            "video": video_info,

            "notes": {
                "summary": summary,
                "key_points": ai_result.get("key_points", []),
                "concepts": ai_result.get("concepts", []),
                "examples": ai_result.get("examples", [])
            },

            "revision_questions": ai_result.get(
                "revision_questions",
                []
            )
        }), 200

    except Exception as e:

        if connection:
            connection.rollback()

        print(f"Error generating notes: {e}")

        return jsonify({
            "success": False,
            "error": "Something went wrong while generating notes"
        }), 500

    finally:

        if cursor:
            cursor.close()

        if connection:
            connection.close()