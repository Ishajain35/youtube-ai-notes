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


    if text.startswith("```json"):

        text = text[7:]


    elif text.startswith("```"):

        text = text[3:]


    if text.endswith("```"):

        text = text[:-3]


    text = text.strip()


    start = text.find("{")
    end = text.rfind("}")


    if start != -1 and end != -1:

        text = text[
            start:end + 1
        ]


    return text.strip()


# =========================================================
# PARSE JSON
# =========================================================

def parse_json_response(text):

    cleaned_text = clean_json_response(
        text
    )


    try:

        return json.loads(
            cleaned_text
        )


    except json.JSONDecodeError as error:

        print("\n======================================")
        print("JSON PARSE ERROR")
        print("======================================")
        print(error)


        print("\nGemini Response:")
        print(
            cleaned_text[:3000]
        )


        print(
            "======================================\n"
        )


        raise ValueError(
            "Gemini returned invalid JSON."
        )


# =========================================================
# CLEAN STRING LIST
# =========================================================

def clean_string_list(value):

    if not isinstance(
        value,
        list
    ):

        return []


    return [
        str(item).strip()
        for item in value
        if str(item).strip()
    ]


# =========================================================
# VALIDATE INTERVIEW QUESTIONS
# =========================================================

def validate_interview_questions(data):

    questions = data.get(
        "interview_questions",
        []
    )


    if not isinstance(
        questions,
        list
    ):

        questions = []


    fixed_questions = []


    for item in questions:

        if not isinstance(
            item,
            dict
        ):

            continue


        question = str(
            item.get(
                "question",
                ""
            )
        ).strip()


        answer = str(
            item.get(
                "answer",
                ""
            )
        ).strip()


        difficulty = str(
            item.get(
                "difficulty",
                "basic"
            )
        ).strip().lower()


        if not question:
            continue


        if not answer:

            answer = (
                "The transcript does not provide enough "
                "information to answer this question."
            )


        if difficulty not in [
            "basic",
            "intermediate",
            "advanced"
        ]:

            difficulty = "basic"


        fixed_questions.append({

            "question":
                question,

            "answer":
                answer,

            "difficulty":
                difficulty

        })


    data[
        "interview_questions"
    ] = fixed_questions


    return data


# =========================================================
# VALIDATE CROSS QUESTIONS
# =========================================================

def validate_cross_questions(data):

    questions = data.get(
        "cross_questions",
        []
    )


    if not isinstance(
        questions,
        list
    ):

        questions = []


    fixed_questions = []


    for item in questions:

        if not isinstance(
            item,
            dict
        ):

            continue


        question = str(
            item.get(
                "question",
                ""
            )
        ).strip()


        answer = str(
            item.get(
                "answer",
                ""
            )
        ).strip()


        follow_up = str(
            item.get(
                "follow_up",
                ""
            )
        ).strip()


        if not question:
            continue


        if not answer:

            answer = (
                "The transcript does not provide enough "
                "information to answer this question."
            )


        fixed_questions.append({

            "question":
                question,

            "answer":
                answer,

            "follow_up":
                follow_up

        })


    data[
        "cross_questions"
    ] = fixed_questions


    return data


# =========================================================
# VALIDATE CONCEPT FLOW
# =========================================================

def validate_concept_flow(data):

    flow = data.get(
        "concept_flow",
        []
    )


    if not isinstance(
        flow,
        list
    ):

        flow = []


    fixed_flow = []


    for index, item in enumerate(
        flow
    ):

        if not isinstance(
            item,
            dict
        ):

            continue


        title = str(
            item.get(
                "title",
                ""
            )
        ).strip()


        description = str(
            item.get(
                "description",
                ""
            )
        ).strip()


        if not title:
            continue


        fixed_flow.append({

            "step":
                index + 1,

            "title":
                title,

            "description":
                description

        })


    data[
        "concept_flow"
    ] = fixed_flow


    return data


# =========================================================
# VALIDATE MIND MAP
# =========================================================

def validate_mind_map(data):

    mind_map = data.get(
        "mind_map",
        {}
    )


    if not isinstance(
        mind_map,
        dict
    ):

        mind_map = {}


    center = str(
        mind_map.get(
            "center",
            ""
        )
    ).strip()


    branches = mind_map.get(
        "branches",
        []
    )


    if not isinstance(
        branches,
        list
    ):

        branches = []


    fixed_branches = []


    for branch in branches:

        if not isinstance(
            branch,
            dict
        ):

            continue


        name = str(
            branch.get(
                "name",
                ""
            )
        ).strip()


        children = clean_string_list(
            branch.get(
                "children",
                []
            )
        )


        if not name:
            continue


        fixed_branches.append({

            "name":
                name,

            "children":
                children

        })


    data[
        "mind_map"
    ] = {

        "center":
            center,

        "branches":
            fixed_branches

    }


    return data


# =========================================================
# VALIDATE VISUALS
# =========================================================

def validate_visuals(data):

    visuals = data.get(
        "visuals",
        []
    )


    if not isinstance(
        visuals,
        list
    ):

        visuals = []


    fixed_visuals = []


    for item in visuals:

        if not isinstance(
            item,
            dict
        ):

            continue


        title = str(
            item.get(
                "title",
                ""
            )
        ).strip()


        visual_type = str(
            item.get(
                "type",
                "diagram"
            )
        ).strip()


        description = str(
            item.get(
                "description",
                ""
            )
        ).strip()


        if not title:
            continue


        fixed_visuals.append({

            "title":
                title,

            "type":
                visual_type,

            "description":
                description

        })


    data[
        "visuals"
    ] = fixed_visuals


    return data


# =========================================================
# VALIDATE CONCEPTS
# =========================================================

def validate_concepts(data):

    concepts = data.get(
        "concepts",
        []
    )


    if not isinstance(
        concepts,
        list
    ):

        concepts = []


    fixed_concepts = []


    for concept in concepts:

        if not isinstance(
            concept,
            dict
        ):

            continue


        name = str(
            concept.get(
                "name",
                ""
            )
        ).strip()


        explanation = str(
            concept.get(
                "explanation",
                ""
            )
        ).strip()


        example = str(
            concept.get(
                "example",
                ""
            )
        ).strip()


        practical_example = str(
            concept.get(
                "practical_example",
                ""
            )
        ).strip()


        if not name:
            continue


        fixed_concepts.append({

            "name":
                name,

            "explanation":
                explanation,

            "example":
                example,

            "practical_example":
                practical_example

        })


    data[
        "concepts"
    ] = fixed_concepts


    return data


# =========================================================
# VALIDATE NOTES
# =========================================================

def validate_notes(data):

    if not isinstance(
        data,
        dict
    ):

        raise ValueError(
            "Gemini returned an invalid notes format."
        )


    # -----------------------------------------------------
    # TITLE
    # -----------------------------------------------------

    if not data.get(
        "title"
    ):

        data[
            "title"
        ] = "YouTube Study Notes"


    # -----------------------------------------------------
    # SHORT NOTES
    # -----------------------------------------------------

    if not data.get(
        "short_notes"
    ):

        data[
            "short_notes"
        ] = (
            "This video explains the main concepts "
            "covered in the transcript."
        )


    # -----------------------------------------------------
    # KEY POINTS
    # -----------------------------------------------------

    data[
        "key_points"
    ] = clean_string_list(
        data.get(
            "key_points",
            []
        )
    )


    # -----------------------------------------------------
    # QUICK REVISION
    # -----------------------------------------------------

    data[
        "quick_revision"
    ] = clean_string_list(
        data.get(
            "quick_revision",
            []
        )
    )


    # -----------------------------------------------------
    # CONCEPTS
    # -----------------------------------------------------

    data = validate_concepts(
        data
    )


    # -----------------------------------------------------
    # CONCEPT FLOW
    # -----------------------------------------------------

    data = validate_concept_flow(
        data
    )


    # -----------------------------------------------------
    # MIND MAP
    # -----------------------------------------------------

    data = validate_mind_map(
        data
    )


    # -----------------------------------------------------
    # VISUALS
    # -----------------------------------------------------

    data = validate_visuals(
        data
    )


    # -----------------------------------------------------
    # PRACTICAL EXAMPLES
    # -----------------------------------------------------

    practical_examples = data.get(
        "practical_examples",
        []
    )


    if not isinstance(
        practical_examples,
        list
    ):

        practical_examples = []


    fixed_examples = []


    for item in practical_examples:

        if not isinstance(
            item,
            dict
        ):

            continue


        title = str(
            item.get(
                "title",
                ""
            )
        ).strip()


        explanation = str(
            item.get(
                "explanation",
                ""
            )
        ).strip()


        if not title:
            continue


        fixed_examples.append({

            "title":
                title,

            "explanation":
                explanation

        })


    data[
        "practical_examples"
    ] = fixed_examples


    # -----------------------------------------------------
    # INTERVIEW QUESTIONS
    # -----------------------------------------------------

    data = validate_interview_questions(
        data
    )


    # -----------------------------------------------------
    # CROSS QUESTIONS
    # -----------------------------------------------------

    data = validate_cross_questions(
        data
    )


    return data


# =========================================================
# GENERATE NOTES
# =========================================================

def generate_notes(transcript):

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
You are an expert teacher, technical interviewer,
and professional visual study-material creator.

Your task is to convert the following YouTube transcript
into SHORT, STRUCTURED, VISUAL, BEGINNER-FRIENDLY
study material.

The user should be able to understand the important
content of the video WITHOUT watching the full video.

IMPORTANT RULES:

1. Use ONLY information supported by the transcript.
2. NEVER invent information.
3. Do NOT create detailed long-form notes.
4. Do NOT create revision questions.
5. Do NOT create common mistakes.
6. Focus on understanding, revision and interview preparation.
7. Keep the content concise but useful.
8. Technical concepts should be explained clearly.
9. Prefer bullets, steps and structured information.
10. If something is not present in the transcript,
    do not invent it.

CREATE THE FOLLOWING SECTIONS:

========================================================
1. SHORT NOTES
========================================================

Create concise notes explaining the complete important
content of the video.

The notes should be much shorter than a transcript
and should focus only on useful learning information.

Use approximately 300-600 words when enough information
is available.

========================================================
2. KEY POINTS
========================================================

Create 5-12 important bullet points.

Each point should contain one clear idea.

========================================================
3. CONCEPTS
========================================================

Identify the most important concepts.

For every important concept provide:

- name
- explanation
- simple example
- practical_example

Keep explanations concise.

========================================================
4. CONCEPT FLOW
========================================================

Create a logical flow showing how the main concepts
connect with each other.

For example:

Input
↓
Processing
↓
Output

Each step must have:

- title
- description

========================================================
5. MIND MAP
========================================================

Create a hierarchical mind map.

The mind map must contain:

- center
- branches
- children

Example:

center:
"JWT"

branches:

Authentication
    - Login
    - Token
    - Verification

Token Structure
    - Header
    - Payload
    - Signature

Only include concepts supported by the transcript.

========================================================
6. VISUALS
========================================================

Identify concepts that would be easier to understand
using a diagram or visual explanation.

For each visual provide:

- title
- type
- description

Possible types:

"diagram"
"flowchart"
"architecture"
"process"
"comparison"
"timeline"

IMPORTANT:

Do NOT provide image URLs.

Do NOT invent image URLs.

These are visual instructions that the frontend
can convert into visual cards/diagrams.

Create 1-5 useful visuals when supported by the transcript.

========================================================
7. PRACTICAL EXAMPLES
========================================================

Create useful practical examples from the transcript.

Each example must contain:

- title
- explanation

========================================================
8. QUICK REVISION
========================================================

Create 5-10 extremely short revision points.

These should be useful for last-minute revision.

========================================================
9. INTERVIEW QUESTIONS
========================================================

Create 5-10 interview questions based ONLY on the transcript.

Include:

- question
- answer
- difficulty

Difficulty must be:

"basic"

"intermediate"

or

"advanced"

Answers must be complete and understandable.

========================================================
10. CROSS QUESTIONS
========================================================

Create 5-10 interviewer-style follow-up questions.

These questions should simulate a real technical
interview.

The interviewer may ask these after the candidate
answers the main question.

For every question provide:

- question
- answer
- follow_up

The follow_up should be a possible next question
an interviewer could ask.

Questions must be based ONLY on concepts supported
by the transcript.

========================================================
OUTPUT FORMAT
========================================================

Return ONLY valid JSON.

DO NOT use markdown.

DO NOT put JSON inside code fences.

Use exactly this structure:

{{
    "title": "Main topic",

    "short_notes": "Concise study notes explaining the video.",

    "key_points": [
        "Important point 1",
        "Important point 2",
        "Important point 3"
    ],

    "concepts": [
        {{
            "name": "Concept name",
            "explanation": "Simple explanation.",
            "example": "Simple example.",
            "practical_example": "Practical example."
        }}
    ],

    "concept_flow": [
        {{
            "title": "Step 1",
            "description": "What happens in this step."
        }},
        {{
            "title": "Step 2",
            "description": "What happens next."
        }}
    ],

    "mind_map": {{
        "center": "Main Topic",
        "branches": [
            {{
                "name": "Branch 1",
                "children": [
                    "Child 1",
                    "Child 2"
                ]
            }}
        ]
    }},

    "visuals": [
        {{
            "title": "Visual title",
            "type": "flowchart",
            "description": "What this visual should explain."
        }}
    ],

    "practical_examples": [
        {{
            "title": "Example title",
            "explanation": "Example explanation."
        }}
    ],

    "quick_revision": [
        "Revision point 1",
        "Revision point 2"
    ],

    "interview_questions": [
        {{
            "question": "Interview question",
            "answer": "Complete answer.",
            "difficulty": "basic"
        }}
    ],

    "cross_questions": [
        {{
            "question": "Follow-up interview question",
            "answer": "Complete answer.",
            "follow_up": "Possible next interviewer question."
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


    for model_index, model in enumerate(
        MODELS
    ):

        print("\n")
        print(
            "======================================"
        )

        print(
            f"Trying Gemini Model "
            f"{model_index + 1}/{len(MODELS)}"
        )

        print(
            f"Model: {model}"
        )

        print(
            "======================================"
        )


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


                response = client.models.generate_content(

                    model=model,

                    contents=prompt,

                    config={
                        "temperature": 0.2,
                        "response_mime_type":
                            "application/json"
                    }
                )


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


                data = parse_json_response(
                    text
                )


                data = validate_notes(
                    data
                )


                print("\n")
                print(
                    "======================================"
                )

                print(
                    "NOTES GENERATED SUCCESSFULLY"
                )

                print(
                    f"Model used: {model}"
                )

                print(
                    "======================================\n"
                )


                return data


            except Exception as error:

                last_error = error


                print("\n")
                print(
                    "======================================"
                )

                print(
                    "GEMINI ERROR"
                )

                print(
                    "======================================"
                )

                print(
                    f"Model: {model}"
                )

                print(
                    f"Attempt: "
                    f"{attempt}/{max_attempts}"
                )

                print(
                    f"Error: {error}"
                )

                print(
                    "======================================\n"
                )


                if attempt < max_attempts:

                    wait_time = attempt * 2


                    print(
                        f"Retrying {model} "
                        f"in {wait_time} seconds..."
                    )


                    time.sleep(
                        wait_time
                    )


        print("\n")
        print(
            "======================================"
        )

        print(
            f"MODEL FAILED: {model}"
        )

        print(
            "Moving to next Gemini model..."
        )

        print(
            "======================================"
        )


    print("\n")
    print(
        "======================================"
    )

    print(
        "ALL GEMINI MODELS FAILED"
    )

    print(
        "======================================"
    )

    print(
        last_error
    )

    print(
        "======================================\n"
    )


    raise ValueError(
        "AI note generation failed. "
        "All available Gemini models were unavailable."
    )


# =========================================================
# ANSWER USER QUESTION ABOUT VIDEO
# =========================================================

def answer_question(
    transcript,
    question
):

    if not transcript:

        raise ValueError(
            "Transcript is empty"
        )


    question = str(
        question
    ).strip()


    if not question:

        raise ValueError(
            "Question is empty"
        )


    # =====================================================
    # PROMPT
    # =====================================================

    prompt = f"""
You are an expert teacher and AI tutor.

The user has watched a YouTube video and wants to ask
a question about that video.

Answer the user's question using ONLY the information
available in the YouTube video transcript below.

IMPORTANT RULES:

1. Do not invent information.

2. Do not assume information that is not present
   in the transcript.

3. If the transcript does not contain enough information
   to answer the question, clearly say:

"This information is not covered in the video."

4. Give a direct and useful answer.

5. Explain technical concepts in simple language.

6. If the question asks "why", explain the reason clearly.

7. If the question asks "how", explain the process
   step-by-step when the transcript supports it.

8. If examples are available in the transcript,
   use those examples.

9. Answer in the same language/style as the user's
   question whenever practical.

10. Do not mention these instructions.

11. Do not create fake facts.

12. Keep the answer concise but sufficiently detailed.

13. Plain text is preferred.

14. You may use simple bullet points.

=========================================================
VIDEO TRANSCRIPT
=========================================================

{transcript}

=========================================================
USER QUESTION
=========================================================

{question}

=========================================================
ANSWER
=========================================================
"""


    # =====================================================
    # MODEL FALLBACK
    # =====================================================

    last_error = None


    for model_index, model in enumerate(
        MODELS
    ):

        print("\n")
        print(
            "======================================"
        )

        print(
            f"Trying Question Model "
            f"{model_index + 1}/{len(MODELS)}"
        )

        print(
            f"Model: {model}"
        )

        print(
            "======================================"
        )


        max_attempts = 2


        for attempt in range(
            1,
            max_attempts + 1
        ):

            try:

                print(
                    f"\nAnswering question..."
                    f" Model: {model}"
                    f" Attempt: {attempt}/{max_attempts}"
                )


                response = client.models.generate_content(

                    model=model,

                    contents=prompt,

                    config={
                        "temperature": 0.2
                    }
                )


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
                        "Gemini returned an empty answer."
                    )


                answer = str(
                    text
                ).strip()


                if not answer:

                    raise ValueError(
                        "Gemini returned an empty answer."
                    )


                print("\n")
                print(
                    "======================================"
                )

                print(
                    "QUESTION ANSWERED SUCCESSFULLY"
                )

                print(
                    f"Model used: {model}"
                )

                print(
                    "======================================\n"
                )


                return answer


            except Exception as error:

                last_error = error


                print("\n")
                print(
                    "======================================"
                )

                print(
                    "GEMINI QUESTION ERROR"
                )

                print(
                    "======================================"
                )

                print(
                    f"Model: {model}"
                )

                print(
                    f"Attempt: "
                    f"{attempt}/{max_attempts}"
                )

                print(
                    f"Error: {error}"
                )

                print(
                    "======================================\n"
                )


                if attempt < max_attempts:

                    wait_time = attempt * 2


                    print(
                        f"Retrying {model} "
                        f"in {wait_time} seconds..."
                    )


                    time.sleep(
                        wait_time
                    )


        print("\n")
        print(
            "======================================"
        )

        print(
            f"QUESTION MODEL FAILED: {model}"
        )

        print(
            "Moving to next Gemini model..."
        )

        print(
            "======================================"
        )


    # =====================================================
    # ALL MODELS FAILED
    # =====================================================

    print("\n")
    print(
        "======================================"
    )

    print(
        "ALL GEMINI MODELS FAILED"
    )

    print(
        "======================================"
    )

    print(
        last_error
    )

    print(
        "======================================\n"
    )


    raise ValueError(
        "AI question answering failed. "
        "All available Gemini models were unavailable."
    )