
# =========================================================
# YouTube AI Notes - AI Service
# =========================================================

from google import genai
from config import Config
import json
import time


# =========================================================
# GEMINI CLIENT
# =========================================================

client = genai.Client(
    api_key=Config.GEMINI_API_KEY
)


# =========================================================
# MODEL FALLBACK LIST
# =========================================================
#
# Your API currently shows these models as available.
#
# We try the preferred model first.
# If it gives 503 / unavailable, we automatically move
# to the next model.
#

MODELS = [
    "gemini-3.6-flash",
    "gemini-3.7-flash",
    "gemini-3.5-flash",
    "gemini-2.5-flash",
]


# =========================================================
# CLEAN GEMINI RESPONSE
# =========================================================

def clean_json_response(text):

    if not text:
        raise ValueError(
            "Gemini returned an empty response."
        )

    text = text.strip()

    # Remove ```json
    if text.startswith("```json"):
        text = text[7:]

    # Remove ```
    elif text.startswith("```"):
        text = text[3:]

    # Remove ending ```
    if text.endswith("```"):
        text = text[:-3]

    text = text.strip()

    # -----------------------------------------------------
    # Extract JSON object if Gemini added extra text
    # -----------------------------------------------------

    start = text.find("{")
    end = text.rfind("}")

    if start != -1 and end != -1:
        text = text[start:end + 1]

    return text.strip()


# =========================================================
# PARSE JSON RESPONSE
# =========================================================

def parse_json_response(text):

    cleaned_text = clean_json_response(text)

    try:

        return json.loads(cleaned_text)

    except json.JSONDecodeError as error:

        print("\n======================================")
        print("JSON PARSE ERROR")
        print("======================================")
        print(error)

        print("\nGemini Response:")
        print(cleaned_text[:3000])

        print("======================================\n")

        raise ValueError(
            "Gemini returned invalid JSON."
        )


# =========================================================
# FIX REVISION QUESTIONS
# =========================================================

def fix_revision_questions(data):

    questions = data.get(
        "revision_questions",
        []
    )

    if not isinstance(questions, list):
        questions = []

    fixed_questions = []

    for item in questions:

        if not isinstance(item, dict):
            continue

        question = str(
            item.get("question", "")
        ).strip()

        answer = str(
            item.get("answer", "")
        ).strip()

        question_type = item.get(
            "type",
            item.get(
                "question_type",
                "conceptual"
            )
        )

        # -------------------------------------------------
        # Ignore empty questions
        # -------------------------------------------------

        if not question:
            continue

        # -------------------------------------------------
        # NEVER allow empty answer
        # -------------------------------------------------

        if not answer:

            answer = (
                "The transcript does not provide enough "
                "information to answer this question."
            )

        # -------------------------------------------------
        # Fix invalid question type
        # -------------------------------------------------

        if question_type not in [
            "conceptual",
            "practical"
        ]:

            question_type = "conceptual"

        fixed_questions.append({

            "question": question,

            "answer": answer,

            "type": question_type
        })

    data["revision_questions"] = fixed_questions

    return data


# =========================================================
# VALIDATE NOTES
# =========================================================

def validate_notes(data):

    if not isinstance(data, dict):

        raise ValueError(
            "Gemini returned an invalid notes format."
        )


    # =====================================================
    # TITLE
    # =====================================================

    if not data.get("title"):

        data["title"] = (
            "YouTube Study Notes"
        )


    # =====================================================
    # OVERVIEW
    # =====================================================

    if not data.get("overview"):

        data["overview"] = (
            "This video explains the important concepts "
            "covered in the transcript."
        )


    # =====================================================
    # CONCEPTS
    # =====================================================

    concepts = data.get(
        "concepts",
        []
    )

    if not isinstance(concepts, list):

        concepts = []

    fixed_concepts = []

    for concept in concepts:

        if not isinstance(concept, dict):
            continue

        # -------------------------------------------------
        # NAME
        # -------------------------------------------------

        name = str(
            concept.get("name", "")
        ).strip()

        if not name:
            continue


        # -------------------------------------------------
        # EXPLANATION
        # -------------------------------------------------

        explanation = str(
            concept.get(
                "explanation",
                ""
            )
        ).strip()


        # -------------------------------------------------
        # HOW IT WORKS
        # -------------------------------------------------

        how_it_works = concept.get(
            "how_it_works",
            []
        )

        if not isinstance(
            how_it_works,
            list
        ):

            how_it_works = []


        how_it_works = [

            str(step).strip()

            for step in how_it_works

            if str(step).strip()
        ]


        # -------------------------------------------------
        # EXAMPLE
        # -------------------------------------------------

        example = str(
            concept.get(
                "example",
                ""
            )
        ).strip()


        # -------------------------------------------------
        # PRACTICAL EXAMPLE
        # -------------------------------------------------

        practical_example = str(
            concept.get(
                "practical_example",
                ""
            )
        ).strip()


        # -------------------------------------------------
        # IMPORTANT POINTS
        # -------------------------------------------------

        important_points = concept.get(
            "important_points",
            []
        )

        if not isinstance(
            important_points,
            list
        ):

            important_points = []


        important_points = [

            str(point).strip()

            for point in important_points

            if str(point).strip()
        ]


        # -------------------------------------------------
        # COMMON MISTAKES
        # -------------------------------------------------

        common_mistakes = concept.get(
            "common_mistakes",
            []
        )

        if not isinstance(
            common_mistakes,
            list
        ):

            common_mistakes = []


        common_mistakes = [

            str(mistake).strip()

            for mistake in common_mistakes

            if str(mistake).strip()
        ]


        # -------------------------------------------------
        # SAVE CLEAN CONCEPT
        # -------------------------------------------------

        fixed_concepts.append({

            "name": name,

            "explanation": explanation,

            "how_it_works": how_it_works,

            "example": example,

            "practical_example": practical_example,

            "important_points": important_points,

            "common_mistakes": common_mistakes
        })


    data["concepts"] = fixed_concepts


    # =====================================================
    # IMPORTANT CONCEPTS
    # =====================================================

    important_concepts = data.get(
        "important_concepts",
        []
    )

    if not isinstance(
        important_concepts,
        list
    ):

        important_concepts = []


    data["important_concepts"] = [

        str(item).strip()

        for item in important_concepts

        if str(item).strip()
    ]


    # =====================================================
    # QUICK REVISION
    # =====================================================

    quick_revision = data.get(
        "quick_revision",
        []
    )

    if not isinstance(
        quick_revision,
        list
    ):

        quick_revision = []


    data["quick_revision"] = [

        str(item).strip()

        for item in quick_revision

        if str(item).strip()
    ]


    # =====================================================
    # REVISION QUESTIONS
    # =====================================================

    data = fix_revision_questions(data)


    return data


# =========================================================
# GENERATE NOTES
# =========================================================

def generate_notes(transcript):

    # =====================================================
    # CHECK TRANSCRIPT
    # =====================================================

    if not transcript:

        raise ValueError(
            "Transcript is empty. Cannot generate notes."
        )


    transcript = str(
        transcript
    ).strip()


    # =====================================================
    # PROMPT
    # =====================================================

    prompt = f"""
You are an expert teacher and professional study-notes creator.

Convert the following YouTube transcript into detailed,
professional, beginner-friendly study notes.

IMPORTANT:

Do NOT simply summarize the transcript.

Teach the concepts from the transcript like a teacher.

The notes should be detailed enough that a student can
revise the video WITHOUT watching the video again.

Use ONLY information supported by the transcript.

DO NOT invent information.

FOR EVERY IMPORTANT CONCEPT INCLUDE:

1. Concept Name
2. Detailed Explanation
3. How It Works
4. Simple Example
5. Practical Example
6. Important Points
7. Common Mistakes

If the video contains technical concepts, include:

- Syntax
- Code examples when useful
- Step-by-step explanation
- Common mistakes
- Differences between related concepts

After explaining all concepts create:

IMPORTANT CONCEPTS

List the most important concepts from the transcript.

QUICK REVISION

Create short bullet points for fast revision.

REVISION QUESTIONS

Create 5-10 questions based ONLY on the transcript.

Every question MUST contain:

- question
- answer
- type

The type MUST be either:

"conceptual"

or

"practical"

VERY IMPORTANT:

Every question MUST have a non-empty answer.

NEVER return:

"answer": ""

NEVER omit the answer field.

Answers must directly answer the question.

Answers must be understandable to a beginner.

Do not create questions whose answers are not supported
by the transcript.

DIFFICULTY:

Keep explanations beginner-friendly but detailed.

LENGTH:

For every important concept, provide approximately
150-300 words when enough information is available.

However, DO NOT invent information that is not supported
by the transcript.

RETURN ONLY VALID JSON.

DO NOT use markdown.

DO NOT put JSON inside markdown code fences.

JSON FORMAT:

{{
    "title": "Video title or main topic",

    "overview": "A clear 2-4 sentence overview of what the video teaches.",

    "concepts": [
        {{
            "name": "Concept name",

            "explanation": "Detailed explanation of the concept.",

            "how_it_works": [
                "Step 1...",
                "Step 2...",
                "Step 3..."
            ],

            "example": "Simple example.",

            "practical_example": "Practical real-world example.",

            "important_points": [
                "Important point 1",
                "Important point 2",
                "Important point 3"
            ],

            "common_mistakes": [
                "Common mistake 1",
                "Common mistake 2"
            ]
        }}
    ],

    "important_concepts": [
        "Important concept 1",
        "Important concept 2",
        "Important concept 3"
    ],

    "quick_revision": [
        "Revision point 1",
        "Revision point 2",
        "Revision point 3"
    ],

    "revision_questions": [
        {{
            "question": "What is this concept?",
            "answer": "A complete answer based only on the transcript.",
            "type": "conceptual"
        }},
        {{
            "question": "How is this concept used?",
            "answer": "A complete practical answer based only on the transcript.",
            "type": "practical"
        }}
    ]
}}

TRANSCRIPT:

{transcript}
"""


    # =====================================================
    # MODEL FALLBACK
    # =====================================================

    last_error = None


    for model_index, model in enumerate(MODELS):

        print("\n")
        print("======================================")
        print(
            f"Trying Gemini Model "
            f"{model_index + 1}/{len(MODELS)}"
        )
        print(f"Model: {model}")
        print("======================================")


        # -------------------------------------------------
        # Retry each model maximum 2 times
        # -------------------------------------------------

        max_attempts = 2


        for attempt in range(
            1,
            max_attempts + 1
        ):

            try:

                print(
                    f"\nGenerating notes..."
                    f" Model: {model}"
                    f" Attempt: {attempt}/{max_attempts}"
                )


                # =================================================
                # GEMINI REQUEST
                # =================================================

                response = client.models.generate_content(

                    model=model,

                    contents=prompt,

                    config={
                        "temperature": 0.2,
                        "response_mime_type": "application/json"
                    }
                )


                # =================================================
                # CHECK RESPONSE
                # =================================================

                if response is None:

                    raise ValueError(
                        "Gemini returned no response."
                    )


                text = getattr(
                    response,
                    "text",
                    None
                )


                if not text:

                    raise ValueError(
                        "Gemini returned an empty response."
                    )


                # =================================================
                # PARSE JSON
                # =================================================

                data = parse_json_response(text)


                # =================================================
                # VALIDATE NOTES
                # =================================================

                data = validate_notes(data)


                print("\n")
                print("======================================")
                print("NOTES GENERATED SUCCESSFULLY")
                print(f"Model used: {model}")
                print("======================================\n")


                return data


            except Exception as error:

                last_error = error


                print("\n")
                print("======================================")
                print("GEMINI ERROR")
                print("======================================")
                print(f"Model: {model}")
                print(
                    f"Attempt: "
                    f"{attempt}/{max_attempts}"
                )
                print(f"Error: {error}")
                print("======================================\n")


                # -------------------------------------------------
                # If another retry remains
                # -------------------------------------------------

                if attempt < max_attempts:

                    wait_time = attempt * 2

                    print(
                        f"Retrying {model} "
                        f"in {wait_time} seconds..."
                    )

                    time.sleep(wait_time)


        # =====================================================
        # CURRENT MODEL FAILED
        # =====================================================

        print("\n")
        print("======================================")
        print(f"MODEL FAILED: {model}")
        print("Moving to next Gemini model...")
        print("======================================")


    # =====================================================
    # ALL MODELS FAILED
    # =====================================================

    print("\n")
    print("======================================")
    print("ALL GEMINI MODELS FAILED")
    print("======================================")
    print(last_error)
    print("======================================\n")


    raise ValueError(
        "AI note generation failed. "
        "All available Gemini models were unavailable."
    )

