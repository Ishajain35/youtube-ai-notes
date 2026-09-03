from flask import Blueprint, request, jsonify

from services.youtube_service import (
    get_video_info,
    get_transcript
)

from services.ai_service import generate_notes

from middleware.auth_middleware import token_required

from database.db import get_db_connection


ai_bp = Blueprint(
    "ai",
    __name__,
    url_prefix="/api/ai"
)


@ai_bp.route("/notes", methods=["POST"])
@token_required
def generate_ai_notes():

    data = request.get_json(silent=True)

    # ======================================================
    # 1. CHECK REQUEST
    # ======================================================

    if not data:

        return jsonify({
            "success": False,
            "error": "Request body must contain valid JSON"
        }), 400


    # ======================================================
    # 2. GET YOUTUBE URL
    # ======================================================

    # Support both names:
    # youtube_url and url

    youtube_url = (
        data.get("youtube_url")
        or data.get("url")
    )


    if not youtube_url:

        return jsonify({
            "success": False,
            "error": "youtube_url is required"
        }), 400


    connection = None
    cursor = None


    try:

        # ==================================================
        # 3. GET VIDEO INFORMATION
        # ==================================================

        print(
            f"Getting video information for: {youtube_url}"
        )

        video_info = get_video_info(
            youtube_url
        )


        if not video_info:

            return jsonify({
                "success": False,
                "error": "Could not get YouTube video information"
            }), 400


        # ==================================================
        # 4. GET TRANSCRIPT
        # ==================================================

        print("Getting transcript...")

        transcript = get_transcript(
            youtube_url
        )


        if not transcript:

            return jsonify({
                "success": False,
                "error": "Transcript could not be found"
            }), 404


        print("Transcript received successfully")


        # ==================================================
        # 5. GENERATE AI NOTES
        # ==================================================

        print("Generating AI notes...")

        ai_result = generate_notes(
            transcript
        )


        if not ai_result:

            return jsonify({
                "success": False,
                "error": "AI could not generate notes"
            }), 500


        print("AI notes generated successfully")


        # ==================================================
        # 6. GET AI DATA
        # ==================================================

        title = ai_result.get(
            "title",
            video_info.get("title", "")
        )


        overview = ai_result.get(
            "overview",
            ""
        )


        concepts = ai_result.get(
            "concepts",
            []
        )


        important_concepts = ai_result.get(
            "important_concepts",
            []
        )


        quick_revision = ai_result.get(
            "quick_revision",
            []
        )


        revision_questions = ai_result.get(
            "revision_questions",
            []
        )


        # ==================================================
        # 7. DATABASE CONNECTION
        # ==================================================

        connection = get_db_connection()

        cursor = connection.cursor()

        user_id = request.user_id


        # ==================================================
        # 8. SAVE VIDEO
        # ==================================================

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
                video_info.get("title"),
                video_info.get("thumbnail")
            )
        )


        video_id = cursor.lastrowid


        # ==================================================
        # 9. BUILD DETAILED NOTES
        # ==================================================

        detailed_notes_parts = []


        # --------------------------------------------------
        # TITLE
        # --------------------------------------------------

        if title:

            detailed_notes_parts.append(
                f"TOPIC\n\n{title}"
            )


        # --------------------------------------------------
        # OVERVIEW
        # --------------------------------------------------

        if overview:

            detailed_notes_parts.append(
                f"OVERVIEW\n\n{overview}"
            )


        # --------------------------------------------------
        # IMPORTANT CONCEPTS
        # --------------------------------------------------

        if important_concepts:

            important_text = "\n".join(
                f"- {concept}"
                for concept in important_concepts
            )


            detailed_notes_parts.append(
                "IMPORTANT CONCEPTS\n\n"
                + important_text
            )


        # --------------------------------------------------
        # DETAILED CONCEPTS
        # --------------------------------------------------

        if concepts:

            concept_sections = []


            for index, concept in enumerate(
                concepts,
                start=1
            ):

                if not isinstance(
                    concept,
                    dict
                ):
                    continue


                name = concept.get(
                    "name",
                    ""
                )


                explanation = concept.get(
                    "explanation",
                    ""
                )


                how_it_works = concept.get(
                    "how_it_works",
                    []
                )


                example = concept.get(
                    "example",
                    ""
                )


                practical_example = concept.get(
                    "practical_example",
                    ""
                )


                important_points = concept.get(
                    "important_points",
                    []
                )


                common_mistakes = concept.get(
                    "common_mistakes",
                    []
                )


                section = []


                if name:

                    section.append(
                        f"{index}. {name}"
                    )


                if explanation:

                    section.append(
                        f"EXPLANATION\n{explanation}"
                    )


                if how_it_works:

                    steps = "\n".join(
                        f"{i}. {step}"
                        for i, step in enumerate(
                            how_it_works,
                            start=1
                        )
                    )


                    section.append(
                        f"HOW IT WORKS\n{steps}"
                    )


                if example:

                    section.append(
                        f"EXAMPLE\n{example}"
                    )


                if practical_example:

                    section.append(
                        "PRACTICAL EXAMPLE\n"
                        + practical_example
                    )


                if important_points:

                    points = "\n".join(
                        f"- {point}"
                        for point in important_points
                    )


                    section.append(
                        "IMPORTANT POINTS\n"
                        + points
                    )


                if common_mistakes:

                    mistakes = "\n".join(
                        f"- {mistake}"
                        for mistake in common_mistakes
                    )


                    section.append(
                        "COMMON MISTAKES\n"
                        + mistakes
                    )


                if section:

                    concept_sections.append(
                        "\n\n".join(section)
                    )


            if concept_sections:

                detailed_notes_parts.append(
                    "DETAILED CONCEPTS\n\n"
                    +
                    "\n\n".join(
                        concept_sections
                    )
                )


        # --------------------------------------------------
        # QUICK REVISION
        # --------------------------------------------------

        if quick_revision:

            revision_text = "\n".join(
                f"- {point}"
                for point in quick_revision
            )


            detailed_notes_parts.append(
                "QUICK REVISION\n\n"
                + revision_text
            )


        detailed_notes = "\n\n".join(
            detailed_notes_parts
        )


        # ==================================================
        # 10. KEY POINTS
        # ==================================================

        key_points = "\n".join(
            f"- {point}"
            for point in (
                important_concepts
                or quick_revision
            )
        )


        # ==================================================
        # 11. SAVE NOTES
        # ==================================================

        cursor.execute(
            """
            INSERT INTO notes
            (
                video_id,
                summary,
                detailed_notes,
                key_points
            )
            VALUES (%s, %s, %s, %s)
            """,
            (
                video_id,
                overview,
                detailed_notes,
                key_points
            )
        )


        notes_id = cursor.lastrowid


        # ==================================================
        # 12. SAVE REVISION QUESTIONS
        # ==================================================

        for question in revision_questions:

            question_text = ""
            answer = ""
            question_type = "conceptual"


            if isinstance(
                question,
                dict
            ):

                question_text = str(
                    question.get(
                        "question",
                        ""
                    )
                ).strip()


                answer = str(
                    question.get(
                        "answer",
                        ""
                    )
                ).strip()


                # AI uses "type"
                question_type = str(
                    question.get(
                        "type",
                        question.get(
                            "question_type",
                            "conceptual"
                        )
                    )
                ).strip().lower()


            elif isinstance(
                question,
                str
            ):

                question_text = (
                    question.strip()
                )


                answer = ""


            # ------------------------------------------------
            # VALIDATE TYPE
            # ------------------------------------------------

            if question_type not in [
                "conceptual",
                "practical"
            ]:

                question_type = "conceptual"


            # ------------------------------------------------
            # SKIP EMPTY QUESTION
            # ------------------------------------------------

            if not question_text:
                continue


            # ------------------------------------------------
            # SAVE QUESTION
            # ------------------------------------------------

            cursor.execute(
                """
                INSERT INTO revision_questions
                (
                    notes_id,
                    question,
                    answer,
                    question_type
                )
                VALUES (%s, %s, %s, %s)
                """,
                (
                    notes_id,
                    question_text,
                    answer,
                    question_type
                )
            )


        # ==================================================
        # 13. COMMIT
        # ==================================================

        connection.commit()


        print(
            f"Notes saved successfully. Video ID: {video_id}"
        )


        # ==================================================
        # 14. RESPONSE
        # ==================================================

        return jsonify({

            "success": True,

            "message":
                "Notes and revision questions saved successfully",

            "video_id":
                video_id,

            "video":
                video_info,

            "notes": {

                "title":
                    title,

                "summary":
                    overview,

                "overview":
                    overview,

                "key_points":
                    (
                        important_concepts
                        or quick_revision
                    ),

                "important_concepts":
                    important_concepts,

                "concepts":
                    concepts,

                "examples":
                    [
                        concept.get("example")
                        for concept in concepts
                        if isinstance(
                            concept,
                            dict
                        )
                        and concept.get("example")
                    ],

                "quick_revision":
                    quick_revision,

                "detailed_notes":
                    detailed_notes
            },

            "revision_questions":
                revision_questions

        }), 200


    # ======================================================
    # ERROR HANDLING
    # ======================================================

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


    # ======================================================
    # CLEANUP
    # ======================================================

    finally:

        if cursor:

            cursor.close()


        if connection:

            connection.close()