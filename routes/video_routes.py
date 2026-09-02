from flask import Blueprint, jsonify, request

from database.db import get_db_connection
from middleware.auth_middleware import token_required


video_bp = Blueprint(
    "video",
    __name__,
    url_prefix="/api/videos"
)


@video_bp.route("", methods=["GET"])
@token_required
def get_videos():

    connection = None
    cursor = None

    try:
        connection = get_db_connection()

        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT
                id,
                youtube_url,
                video_title,
                thumbnail_url,
                created_at
            FROM videos
            WHERE user_id = %s
            ORDER BY created_at DESC
            """,
            (request.user_id,)
        )

        videos = cursor.fetchall()

        return jsonify({
            "success": True,
            "count": len(videos),
            "videos": videos
        }), 200

    except Exception as e:

        print(f"Error fetching videos: {e}")

        return jsonify({
            "success": False,
            "error": "Unable to fetch videos"
        }), 500

    finally:

        if cursor:
            cursor.close()

        if connection:
            connection.close()
@video_bp.route("/<int:video_id>/notes", methods=["GET"])
@token_required
def get_video_notes(video_id):

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Check video belongs to current user
        cursor.execute(
            """
            SELECT
                id,
                youtube_url,
                video_title,
                thumbnail_url,
                created_at
            FROM videos
            WHERE id = %s AND user_id = %s
            """,
            (video_id, request.user_id)
        )

        video = cursor.fetchone()

        if not video:
            return jsonify({
                "success": False,
                "error": "Video not found"
            }), 404

        # Get notes
        cursor.execute(
            """
            SELECT
                id,
                summary,
                detailed_notes,
                key_points,
                visual_notes,
                created_at
            FROM notes
            WHERE video_id = %s
            ORDER BY created_at DESC
            LIMIT 1
            """,
            (video_id,)
        )

        notes = cursor.fetchone()

        if not notes:
            return jsonify({
                "success": False,
                "error": "Notes not found"
            }), 404

        # Get revision questions
        cursor.execute(
            """
            SELECT
                id,
                question,
                answer,
                question_type
            FROM revision_questions
            WHERE notes_id = %s
            ORDER BY id
            """,
            (notes["id"],)
        )

        questions = cursor.fetchall()

        return jsonify({
            "success": True,
            "video": video,
            "notes": notes,
            "revision_questions": questions
        }), 200

    except Exception as e:

        print(f"Error fetching video notes: {e}")

        return jsonify({
            "success": False,
            "error": "Unable to fetch video notes"
        }), 500

    finally:

        if cursor:
            cursor.close()

        if connection:
            connection.close()
@video_bp.route("/<int:video_id>", methods=["DELETE"])
@token_required
def delete_video(video_id):

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        cursor.execute(
            """
            DELETE FROM videos
            WHERE id = %s AND user_id = %s
            """,
            (video_id, request.user_id)
        )

        if cursor.rowcount == 0:
            return jsonify({
                "success": False,
                "error": "Video not found"
            }), 404

        connection.commit()

        return jsonify({
            "success": True,
            "message": "Video deleted successfully"
        }), 200

    except Exception as e:

        if connection:
            connection.rollback()

        print(f"Error deleting video: {e}")

        return jsonify({
            "success": False,
            "error": "Unable to delete video"
        }), 500

    finally:

        if cursor:
            cursor.close()

        if connection:
            connection.close()            