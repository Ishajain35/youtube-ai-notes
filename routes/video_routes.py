from flask import Blueprint, jsonify, request
import json

from database.db import get_db_connection
from middleware.auth_middleware import token_required


video_bp = Blueprint(
    "video",
    __name__,
    url_prefix="/api/videos"
)


# =========================================================
# HELPER: SAFE JSON PARSER
# =========================================================

def parse_json_field(value, fallback):

    if value is None:
        return fallback

    # Already parsed
    if isinstance(value, (dict, list)):
        return value

    try:

        parsed = json.loads(value)

        return parsed

    except (
        json.JSONDecodeError,
        TypeError,
        ValueError
    ):

        return fallback


# =========================================================
# GET ALL SAVED VIDEOS
# =========================================================

@video_bp.route("", methods=["GET"])
@token_required
def get_videos():

    connection = None
    cursor = None

    try:

        connection = get_db_connection()

        cursor = connection.cursor(
            dictionary=True
        )

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

        print(
            f"Error fetching videos: {e}"
        )

        return jsonify({

            "success": False,

            "error":
                "Unable to fetch videos"

        }), 500

    finally:

        if cursor:
            cursor.close()

        if connection:
            connection.close()


# =========================================================
# GET NOTES FOR ONE VIDEO
# =========================================================

@video_bp.route(
    "/<int:video_id>/notes",
    methods=["GET"]
)
@token_required
def get_video_notes(video_id):

    connection = None
    cursor = None

    try:

        connection = get_db_connection()

        cursor = connection.cursor(
            dictionary=True
        )


        # =================================================
        # 1. CHECK VIDEO OWNERSHIP
        # =================================================

        cursor.execute(
            """
            SELECT
                id,
                youtube_url,
                video_title,
                thumbnail_url,
                created_at
            FROM videos
            WHERE id = %s
            AND user_id = %s
            """,
            (
                video_id,
                request.user_id
            )
        )

        video = cursor.fetchone()


        if not video:

            return jsonify({

                "success": False,

                "error":
                    "Video not found"

            }), 404


        # =================================================
        # 2. GET LATEST NOTES
        # =================================================

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

                "error":
                    "Notes not found"

            }), 404


        # =================================================
        # 3. SHORT NOTES
        #
        # summary column stores short_notes
        # =================================================

        short_notes = notes.get(
            "summary"
        ) or ""


        # =================================================
        # 4. PARSE KEY POINTS
        # =================================================

        key_points = parse_json_field(
            notes.get("key_points"),
            []
        )


        # If old/plain text format exists
        if isinstance(
            key_points,
            str
        ):

            key_points = [

                point.strip("-• ").strip()

                for point in key_points.split(
                    "\n"
                )

                if point.strip()

            ]


        # =================================================
        # 5. PARSE STRUCTURED DATA
        #
        # detailed_notes contains:
        #
        # concepts
        # concept_flow
        # mind_map
        # practical_examples
        # quick_revision
        # interview_questions
        # cross_questions
        # =================================================

        structured_data = parse_json_field(
            notes.get("detailed_notes"),
            {}
        )


        if not isinstance(
            structured_data,
            dict
        ):

            structured_data = {}


        # =================================================
        # 6. GET CONCEPTS
        # =================================================

        concepts = structured_data.get(
            "concepts",
            []
        )

        if not isinstance(
            concepts,
            list
        ):

            concepts = []


        # =================================================
        # 7. GET CONCEPT FLOW
        # =================================================

        concept_flow = structured_data.get(
            "concept_flow",
            []
        )

        if not isinstance(
            concept_flow,
            list
        ):

            concept_flow = []


        # =================================================
        # 8. GET MIND MAP
        # =================================================

        mind_map = structured_data.get(
            "mind_map",
            {}
        )

        if not isinstance(
            mind_map,
            dict
        ):

            mind_map = {}


        # =================================================
        # 9. PARSE VISUALS
        #
        # visual_notes stores visuals JSON
        # =================================================

        visuals = parse_json_field(
            notes.get("visual_notes"),
            []
        )

        if not isinstance(
            visuals,
            list
        ):

            visuals = []


        # =================================================
        # 10. PRACTICAL EXAMPLES
        # =================================================

        practical_examples = structured_data.get(
            "practical_examples",
            []
        )

        if not isinstance(
            practical_examples,
            list
        ):

            practical_examples = []


        # =================================================
        # 11. QUICK REVISION
        # =================================================

        quick_revision = structured_data.get(
            "quick_revision",
            []
        )

        if not isinstance(
            quick_revision,
            list
        ):

            quick_revision = []


        # =================================================
        # 12. INTERVIEW QUESTIONS
        # =================================================

        interview_questions = structured_data.get(
            "interview_questions",
            []
        )

        if not isinstance(
            interview_questions,
            list
        ):

            interview_questions = []


        # =================================================
        # 13. CROSS QUESTIONS
        # =================================================

        cross_questions = structured_data.get(
            "cross_questions",
            []
        )

        if not isinstance(
            cross_questions,
            list
        ):

            cross_questions = []


        # =================================================
        # 14. BUILD FINAL NOTES RESPONSE
        # =================================================

        new_notes = {

            "id":
                notes.get("id"),

            "title":
                video.get(
                    "video_title"
                )
                or "YouTube Study Notes",

            "short_notes":
                short_notes,

            "key_points":
                key_points,

            "concepts":
                concepts,

            "concept_flow":
                concept_flow,

            "mind_map":
                mind_map,

            "visuals":
                visuals,

            "practical_examples":
                practical_examples,

            "quick_revision":
                quick_revision,

            "interview_questions":
                interview_questions,

            "cross_questions":
                cross_questions,

            "created_at":
                notes.get(
                    "created_at"
                )

        }


        # =================================================
        # 15. FINAL RESPONSE
        # =================================================

        return jsonify({

            "success": True,

            "video":
                video,

            "notes":
                new_notes

        }), 200


    # =====================================================
    # ERROR HANDLING
    # =====================================================

    except Exception as e:

        print(
            f"Error fetching video notes: {e}"
        )

        return jsonify({

            "success": False,

            "error":
                "Unable to fetch video notes"

        }), 500


    # =====================================================
    # CLEANUP
    # =====================================================

    finally:

        if cursor:
            cursor.close()

        if connection:
            connection.close()


# =========================================================
# DELETE VIDEO
# =========================================================

@video_bp.route(
    "/<int:video_id>",
    methods=["DELETE"]
)
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
            WHERE id = %s
            AND user_id = %s
            """,
            (
                video_id,
                request.user_id
            )
        )


        if cursor.rowcount == 0:

            return jsonify({

                "success": False,

                "error":
                    "Video not found"

            }), 404


        connection.commit()


        return jsonify({

            "success": True,

            "message":
                "Video deleted successfully"

        }), 200


    except Exception as e:

        if connection:
            connection.rollback()

        print(
            f"Error deleting video: {e}"
        )

        return jsonify({

            "success": False,

            "error":
                "Unable to delete video"

        }), 500


    finally:

        if cursor:
            cursor.close()

        if connection:
            connection.close()