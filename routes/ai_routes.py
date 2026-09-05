from flask import Blueprint, request, jsonify
import json
import re

from services.youtube_service import (
    get_video_info,
    get_transcript
)

from services.ai_service import (
    generate_notes,
    answer_question
)

from middleware.auth_middleware import token_required
from database.db import get_db_connection


ai_bp = Blueprint(
    "ai",
    __name__,
    url_prefix="/api/ai"
)


# =========================================================
# HELPER: CONVERT SHORT NOTES INTO BULLET POINTS
# =========================================================

def format_short_notes(value):

    if value is None:
        return ""

    # -----------------------------------------------------
    # If AI already returned a list
    # -----------------------------------------------------

    if isinstance(value, list):

        points = []

        for item in value:

            text = str(item).strip()

            if text:

                text = re.sub(
                    r"^[•●▪◦\-*]+\s*",
                    "",
                    text
                )

                points.append(
                    f"• {text}"
                )

        return "\n".join(points)


    # -----------------------------------------------------
    # If AI returned a string
    # -----------------------------------------------------

    text = str(value).strip()

    if not text:
        return ""


    # -----------------------------------------------------
    # Split existing lines
    # -----------------------------------------------------

    lines = [
        line.strip()
        for line in text.splitlines()
        if line.strip()
    ]


    # Remove existing bullet symbols

    cleaned_lines = []

    for line in lines:

        line = re.sub(
            r"^[•●▪◦\-*]+\s*",
            "",
            line
        ).strip()

        if line:
            cleaned_lines.append(line)


    # -----------------------------------------------------
    # If multiple lines already exist
    # -----------------------------------------------------

    if len(cleaned_lines) > 1:

        return "\n".join(
            f"• {line}"
            for line in cleaned_lines
        )


    # -----------------------------------------------------
    # If AI returned one large paragraph,
    # split it into sentences
    # -----------------------------------------------------

    sentences = re.split(
        r"(?<=[.!?])\s+",
        text
    )

    sentences = [
        sentence.strip()
        for sentence in sentences
        if sentence.strip()
    ]


    if len(sentences) > 1:

        return "\n".join(
            f"• {sentence}"
            for sentence in sentences
        )


    # -----------------------------------------------------
    # Single statement
    # -----------------------------------------------------

    return f"• {text}"


# =========================================================
# AI NOTES GENERATION
# =========================================================

@ai_bp.route(
    "/notes",
    methods=["POST"]
)
@token_required
def generate_ai_notes():

    data = request.get_json(
        silent=True
    )


    # =====================================================
    # 1. CHECK REQUEST
    # =====================================================

    if not data:

        return jsonify({

            "success": False,

            "error":
                "Request body must contain valid JSON"

        }), 400


    # =====================================================
    # 2. GET YOUTUBE URL
    # =====================================================

    youtube_url = (
        data.get("youtube_url")
        or data.get("url")
    )


    if not youtube_url:

        return jsonify({

            "success": False,

            "error":
                "youtube_url is required"

        }), 400


    connection = None
    cursor = None


    try:

        # =================================================
        # 3. GET VIDEO INFORMATION
        # =================================================

        print(
            f"Getting video information for: {youtube_url}"
        )


        video_info = get_video_info(
            youtube_url
        )


        if not video_info:

            return jsonify({

                "success": False,

                "error":
                    "Could not get YouTube video information"

            }), 400


        # =================================================
        # 4. GET TRANSCRIPT
        # =================================================

        print(
            "Getting transcript..."
        )


        transcript = get_transcript(
            youtube_url
        )


        if not transcript:

            return jsonify({

                "success": False,

                "error":
                    "Transcript could not be found"

            }), 404


        print(
            "Transcript received successfully"
        )


        # =================================================
        # 5. GENERATE AI NOTES
        # =================================================

        print(
            "Generating AI notes..."
        )


        ai_result = generate_notes(
            transcript
        )


        if not ai_result:

            return jsonify({

                "success": False,

                "error":
                    "AI could not generate notes"

            }), 500


        print(
            "AI notes generated successfully"
        )


        # =================================================
        # 6. GET AI DATA
        # =================================================

        title = ai_result.get(
            "title",
            video_info.get(
                "title",
                ""
            )
        )


        # -------------------------------------------------
        # SHORT NOTES
        # -------------------------------------------------

        short_notes = format_short_notes(
            ai_result.get(
                "short_notes",
                ""
            )
        )


        # -------------------------------------------------
        # KEY POINTS
        # -------------------------------------------------

        key_points = ai_result.get(
            "key_points",
            []
        )


        if not isinstance(
            key_points,
            list
        ):

            key_points = [
                str(key_points)
            ]


        # -------------------------------------------------
        # CONCEPTS
        # -------------------------------------------------

        concepts = ai_result.get(
            "concepts",
            []
        )


        if not isinstance(
            concepts,
            list
        ):

            concepts = []


        # -------------------------------------------------
        # CONCEPT FLOW
        # -------------------------------------------------

        concept_flow = ai_result.get(
            "concept_flow",
            []
        )


        if not isinstance(
            concept_flow,
            list
        ):

            concept_flow = []


        # -------------------------------------------------
        # MIND MAP
        # -------------------------------------------------

        mind_map = ai_result.get(
            "mind_map",
            {}
        )


        if not isinstance(
            mind_map,
            dict
        ):

            mind_map = {}


        # -------------------------------------------------
        # VISUALS
        # -------------------------------------------------

        visuals = ai_result.get(
            "visuals",
            []
        )


        if not isinstance(
            visuals,
            list
        ):

            visuals = []


        print(
            f"Visuals generated: {len(visuals)}"
        )


        # -------------------------------------------------
        # PRACTICAL EXAMPLES
        # -------------------------------------------------

        practical_examples = ai_result.get(
            "practical_examples",
            []
        )


        if not isinstance(
            practical_examples,
            list
        ):

            practical_examples = []


        # -------------------------------------------------
        # QUICK REVISION
        # -------------------------------------------------

        quick_revision = ai_result.get(
            "quick_revision",
            []
        )


        if not isinstance(
            quick_revision,
            list
        ):

            quick_revision = []


        # -------------------------------------------------
        # INTERVIEW QUESTIONS
        # -------------------------------------------------

        interview_questions = ai_result.get(
            "interview_questions",
            []
        )


        if not isinstance(
            interview_questions,
            list
        ):

            interview_questions = []


        # -------------------------------------------------
        # CROSS QUESTIONS
        # -------------------------------------------------

        cross_questions = ai_result.get(
            "cross_questions",
            []
        )


        if not isinstance(
            cross_questions,
            list
        ):

            cross_questions = []


        # =================================================
        # 7. DATABASE CONNECTION
        # =================================================

        connection = get_db_connection()

        cursor = connection.cursor()

        user_id = request.user_id


        # =================================================
        # 8. SAVE VIDEO
        # =================================================

        cursor.execute(
            """
            INSERT INTO videos
            (
                user_id,
                youtube_url,
                video_title,
                thumbnail_url
            )
            VALUES (%s, %s, %s, %s)
            """,
            (
                user_id,

                youtube_url,

                video_info.get(
                    "title"
                ),

                video_info.get(
                    "thumbnail"
                )
            )
        )


        video_id = cursor.lastrowid


        # =================================================
        # 9. PREPARE STRUCTURED NOTES
        # =================================================

        structured_notes = {

            "concepts":
                concepts,

            "concept_flow":
                concept_flow,

            "mind_map":
                mind_map,

            "practical_examples":
                practical_examples,

            "quick_revision":
                quick_revision,

            "interview_questions":
                interview_questions,

            "cross_questions":
                cross_questions

        }


        detailed_notes = json.dumps(
            structured_notes,
            ensure_ascii=False
        )


        # =================================================
        # 10. PREPARE KEY POINTS
        # =================================================

        key_points_text = json.dumps(
            key_points,
            ensure_ascii=False
        )


        # =================================================
        # 11. PREPARE VISUALS
        # =================================================

        visual_notes_text = json.dumps(
            visuals,
            ensure_ascii=False
        )


        # =================================================
        # 12. SAVE NOTES
        # =================================================

        cursor.execute(
            """
            INSERT INTO notes
            (
                video_id,
                summary,
                detailed_notes,
                key_points,
                visual_notes
            )
            VALUES (%s, %s, %s, %s, %s)
            """,
            (
                video_id,

                short_notes,

                detailed_notes,

                key_points_text,

                visual_notes_text
            )
        )


        notes_id = cursor.lastrowid


        # =================================================
        # 13. COMMIT
        # =================================================

        connection.commit()


        print(
            f"Notes saved successfully. Video ID: {video_id}"
        )


        print(
            f"Visual notes saved: {len(visuals)}"
        )


        # =================================================
        # 14. RESPONSE
        # =================================================

        return jsonify({

            "success": True,

            "message":
                "AI learning notes generated successfully",

            "video_id":
                video_id,

            "notes_id":
                notes_id,

            "video":
                video_info,

            "notes": {

                "title":
                    title,

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
                    cross_questions

            }

        }), 200


    # =====================================================
    # ERROR HANDLING
    # =====================================================

    except Exception as e:

        if connection:
            connection.rollback()


        print(
            "ERROR generating notes:"
        )


        print(
            str(e)
        )


        return jsonify({

            "success": False,

            "error":
                "Something went wrong while generating notes",

            "details":
                str(e)

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
# ASK QUESTION ABOUT VIDEO
# =========================================================

@ai_bp.route(
    "/ask",
    methods=["POST"]
)
@token_required
def ask_video_question():

    data = request.get_json(
        silent=True
    )


    # =====================================================
    # 1. CHECK REQUEST
    # =====================================================

    if not data:

        return jsonify({

            "success": False,

            "error":
                "Request body must contain valid JSON"

        }), 400


    # =====================================================
    # 2. GET DATA
    # =====================================================

    video_id = data.get(
        "video_id"
    )


    question = data.get(
        "question"
    )


    # =====================================================
    # 3. VALIDATE VIDEO ID
    # =====================================================

    try:

        video_id = int(
            video_id
        )

    except (
        TypeError,
        ValueError
    ):

        return jsonify({

            "success": False,

            "error":
                "Valid video_id is required"

        }), 400


    # =====================================================
    # 4. VALIDATE QUESTION
    # =====================================================

    if not question or not str(
        question
    ).strip():

        return jsonify({

            "success": False,

            "error":
                "Question is required"

        }), 400


    question = str(
        question
    ).strip()


    if len(question) > 1000:

        return jsonify({

            "success": False,

            "error":
                "Question must be 1000 characters or less"

        }), 400


    connection = None
    cursor = None


    try:

        # =================================================
        # 5. DATABASE CONNECTION
        # =================================================

        connection = get_db_connection()

        cursor = connection.cursor()


        # =================================================
        # 6. FIND USER'S VIDEO
        # =================================================

        cursor.execute(
            """
            SELECT
                youtube_url,
                video_title
            FROM videos
            WHERE
                id = %s
                AND user_id = %s
            LIMIT 1
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


        youtube_url = video[0]


        # =================================================
        # 7. GET TRANSCRIPT
        # =================================================

        print(
            "Getting transcript for question..."
        )


        transcript = get_transcript(
            youtube_url
        )


        if not transcript:

            return jsonify({

                "success": False,

                "error":
                    "Transcript could not be found for this video"

            }), 404


        print(
            "Transcript received for question"
        )


        # =================================================
        # 8. ASK AI
        # =================================================

        print(
            "Generating AI answer..."
        )


        answer = answer_question(
            transcript,
            question
        )


        if not answer:

            return jsonify({

                "success": False,

                "error":
                    "AI could not answer the question"

            }), 500


        print(
            "AI answer generated successfully"
        )


        # =================================================
        # 9. RETURN ANSWER
        # =================================================

        return jsonify({

            "success": True,

            "video_id":
                video_id,

            "question":
                question,

            "answer":
                answer

        }), 200


    # =====================================================
    # ERROR HANDLING
    # =====================================================

    except Exception as e:

        print(
            "ERROR answering question:"
        )


        print(
            str(e)
        )


        return jsonify({

            "success": False,

            "error":
                "Something went wrong while answering the question",

            "details":
                str(e)

        }), 500


    # =====================================================
    # CLEANUP
    # =====================================================

    finally:

        if cursor:
            cursor.close()


        if connection:
            connection.close()