// =========================================================
// YouTube AI Notes - app.js
// FINAL VERSION
// Login + Register + Dashboard + Notes
// Delete Video integrated
// =========================================================

document.addEventListener("DOMContentLoaded", () => {

    console.log("APP.JS LOADED SUCCESSFULLY");

    const path = window.location.pathname.toLowerCase();

    // =====================================================
    // PAGE ROUTING
    // =====================================================

    if (
        path.endsWith("/") ||
        path.endsWith("index.html")
    ) {
        setupLoginPage();
        return;
    }

    if (path.endsWith("register.html")) {
        setupRegisterPage();
        return;
    }

    if (path.endsWith("dashboard.html")) {
        setupDashboardPage();
        return;
    }

    if (path.endsWith("notes.html")) {
        setupNotesPage();
        return;
    }
});


// =========================================================
// API HELPER
// =========================================================

async function authorizedFetch(url, options = {}) {

    const token = localStorage.getItem("token");

    const headers = {
        ...(options.headers || {})
    };

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    if (
        options.body &&
        typeof options.body === "string" &&
        !headers["Content-Type"]
    ) {
        headers["Content-Type"] = "application/json";
    }

    const response = await fetch(url, {
        ...options,
        headers
    });

    if (
        response.status === 401 ||
        response.status === 403
    ) {

        localStorage.removeItem("token");
        localStorage.removeItem("selectedVideoId");

        window.location.href = "index.html";

        return null;
    }

    return response;
}


// =========================================================
// LOGIN PAGE
// =========================================================

function setupLoginPage() {

    const loginForm =
        document.getElementById("loginForm");

    if (!loginForm) {
        return;
    }

    loginForm.addEventListener("submit", async (event) => {

        event.preventDefault();

        const emailInput =
            document.getElementById("email");

        const passwordInput =
            document.getElementById("password");

        const message =
            document.getElementById("loginMessage");

        const email =
            emailInput
                ? emailInput.value.trim()
                : "";

        const password =
            passwordInput
                ? passwordInput.value
                : "";

        if (!email || !password) {

            showMessage(
                message,
                "Please enter email and password.",
                true
            );

            return;
        }

        try {

            showMessage(
                message,
                "Logging in...",
                false
            );

            const response =
                await fetch(
                    "/api/auth/login",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            email,
                            password
                        })
                    }
                );

            const data =
                await response.json();

            console.log(
                "LOGIN RESPONSE:",
                data
            );

            if (!response.ok || !data.success) {

                showMessage(
                    message,
                    data.error ||
                    "Login failed.",
                    true
                );

                return;
            }

            const token =
                data.token ||
                data.access_token;

            if (!token) {

                showMessage(
                    message,
                    "Login successful but token was not received.",
                    true
                );

                return;
            }

            localStorage.setItem(
                "token",
                token
            );

            window.location.href =
                "dashboard.html";

        } catch (error) {

            console.error(
                "LOGIN ERROR:",
                error
            );

            showMessage(
                message,
                "Unable to connect to server.",
                true
            );
        }
    });
}


// =========================================================
// REGISTER PAGE
// =========================================================

function setupRegisterPage() {

    const registerForm =
        document.getElementById("registerForm");

    if (!registerForm) {
        return;
    }

    registerForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();

            const nameInput =
                document.getElementById("name");

            const emailInput =
                document.getElementById("email");

            const passwordInput =
                document.getElementById("password");

            const message =
                document.getElementById("registerMessage");

            const name =
                nameInput
                    ? nameInput.value.trim()
                    : "";

            const email =
                emailInput
                    ? emailInput.value.trim()
                    : "";

            const password =
                passwordInput
                    ? passwordInput.value
                    : "";

            if (!name || !email || !password) {

                showMessage(
                    message,
                    "Please fill all fields.",
                    true
                );

                return;
            }

            try {

                showMessage(
                    message,
                    "Creating account...",
                    false
                );

                const response =
                    await fetch(
                        "/api/auth/register",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({
                                name,
                                email,
                                password
                            })
                        }
                    );

                const data =
                    await response.json();

                console.log(
                    "REGISTER RESPONSE:",
                    data
                );

                if (!response.ok || !data.success) {

                    showMessage(
                        message,
                        data.error ||
                        "Registration failed.",
                        true
                    );

                    return;
                }

                showMessage(
                    message,
                    "Registration successful. Redirecting...",
                    false
                );

                setTimeout(() => {

                    window.location.href =
                        "index.html";

                }, 1000);

            } catch (error) {

                console.error(
                    "REGISTER ERROR:",
                    error
                );

                showMessage(
                    message,
                    "Unable to connect to server.",
                    true
                );
            }
        }
    );
}


// =========================================================
// DASHBOARD
// =========================================================

function setupDashboardPage() {

    console.log("Setting up dashboard");

    const logoutButton =
        document.getElementById("logoutButton");

    const notesForm =
        document.getElementById("notesForm");

    const refreshButton =
        document.getElementById("refreshButton");

    const token =
        localStorage.getItem("token");

    // -----------------------------------------------------
    // CHECK LOGIN
    // -----------------------------------------------------

    if (!token) {

        window.location.href =
            "index.html";

        return;
    }

    // -----------------------------------------------------
    // LOGOUT
    // -----------------------------------------------------

    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            () => {

                localStorage.removeItem(
                    "token"
                );

                localStorage.removeItem(
                    "selectedVideoId"
                );

                window.location.href =
                    "index.html";
            }
        );
    }

    // -----------------------------------------------------
    // GENERATE NOTES
    // -----------------------------------------------------

    if (notesForm) {

        notesForm.addEventListener(
            "submit",
            generateNotes
        );
    }

    // -----------------------------------------------------
    // REFRESH
    // -----------------------------------------------------

    if (refreshButton) {

        refreshButton.addEventListener(
            "click",
            loadVideos
        );
    }

    // -----------------------------------------------------
    // LOAD VIDEOS
    // -----------------------------------------------------

    loadVideos();
}


// =========================================================
// GENERATE AI NOTES
// =========================================================

async function generateNotes(event) {

    event.preventDefault();

    const urlInput =
        document.getElementById("youtubeUrl");

    const generateButton =
        document.getElementById("generateButton");

    const message =
        document.getElementById("notesMessage");

    const youtubeUrl =
        urlInput
            ? urlInput.value.trim()
            : "";

    if (!youtubeUrl) {

        showMessage(
            message,
            "Please enter a YouTube URL.",
            true
        );

        return;
    }

    try {

        if (generateButton) {

            generateButton.disabled = true;

            generateButton.innerHTML =
                `<span>Generating...</span><span>⏳</span>`;
        }

        showMessage(
            message,
            "Getting video transcript and generating AI notes...",
            false
        );

        const response =
            await authorizedFetch(
                "/api/ai/notes",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        youtube_url:
                            youtubeUrl
                    })
                }
            );

        if (!response) {
            return;
        }

        const data =
            await response.json();

        console.log(
            "GENERATE NOTES RESPONSE:",
            data
        );

        if (!response.ok || !data.success) {

            showMessage(
                message,
                data.error ||
                "Unable to generate notes.",
                true
            );

            return;
        }

        if (data.video_id) {

            localStorage.setItem(
                "selectedVideoId",
                data.video_id
            );

            window.location.href =
                "notes.html";

            return;
        }

        showMessage(
            message,
            "Notes generated but video ID was not returned.",
            true
        );

    } catch (error) {

        console.error(
            "GENERATE NOTES ERROR:",
            error
        );

        showMessage(
            message,
            "Something went wrong while generating notes.",
            true
        );

    } finally {

        if (generateButton) {

            generateButton.disabled = false;

            generateButton.innerHTML =
                `<span>Generate Notes</span><span>→</span>`;
        }
    }
}


// =========================================================
// LOAD VIDEOS
// =========================================================

async function loadVideos() {

    const container =
        document.getElementById(
            "videosContainer"
        );

    if (!container) {
        return;
    }

    container.innerHTML = `
        <div class="loading-card">
            <div class="spinner"></div>
            <p>Loading your videos...</p>
        </div>
    `;

    try {

        const response =
            await authorizedFetch(
                "/api/videos"
            );

        if (!response) {
            return;
        }

        const data =
            await response.json();

        console.log(
            "VIDEOS RESPONSE:",
            data
        );

        if (!response.ok || !data.success) {

            container.innerHTML =
                `<p>${escapeHtml(
                    data.error ||
                    "Unable to load videos."
                )}</p>`;

            return;
        }

        const videos =
            Array.isArray(data.videos)
                ? data.videos
                : [];

        if (videos.length === 0) {

            container.innerHTML = `
                <div class="empty-card">
                    <p>No saved videos yet.</p>
                    <p>Generate notes from a YouTube video to see it here.</p>
                </div>
            `;

            return;
        }

        container.innerHTML = "";

        videos.forEach(video => {

            const card =
                document.createElement("div");

            card.className =
                "video-card";

            const thumbnail =
                video.thumbnail_url ||
                "";

            const title =
                video.video_title ||
                "Untitled Video";

            const date =
                formatDate(
                    video.created_at
                );

            card.innerHTML = `
                <img
                    src="${escapeHtml(thumbnail)}"
                    alt="YouTube video thumbnail"
                    class="video-card-thumbnail"
                    onerror="this.style.display='none'"
                >

                <div class="video-card-content">

                    <h3>
                        ${escapeHtml(title)}
                    </h3>

                    <p>
                        ${escapeHtml(date)}
                    </p>

                    <div class="video-card-actions">

                        <button
                            type="button"
                            class="view-notes-btn"
                        >
                            View Notes
                        </button>

                        <button
                            type="button"
                            class="delete-video-btn"
                            data-video-id="${escapeHtml(video.id)}"
                        >
                            Delete
                        </button>

                    </div>

                </div>
            `;

            // -------------------------------------------------
            // VIEW NOTES
            // -------------------------------------------------

            const viewButton =
                card.querySelector(
                    ".view-notes-btn"
                );

            if (viewButton) {

                viewButton.addEventListener(
                    "click",
                    () => {

                        localStorage.setItem(
                            "selectedVideoId",
                            video.id
                        );

                        window.location.href =
                            "notes.html";
                    }
                );
            }

            // -------------------------------------------------
            // DELETE VIDEO
            // -------------------------------------------------

            const deleteButton =
                card.querySelector(
                    ".delete-video-btn"
                );

            if (deleteButton) {

                deleteButton.addEventListener(
                    "click",
                    () => {

                        deleteVideo(
                            video.id,
                            title,
                            card
                        );
                    }
                );
            }

            container.appendChild(card);
        });

    } catch (error) {

        console.error(
            "LOAD VIDEOS ERROR:",
            error
        );

        container.innerHTML = `
            <div class="error-card">
                <p>Unable to load videos.</p>
                <button
                    type="button"
                    onclick="loadVideos()"
                >
                    Try Again
                </button>
            </div>
        `;
    }
}


// =========================================================
// DELETE VIDEO
// =========================================================

async function deleteVideo(
    videoId,
    videoTitle,
    card
) {

    const confirmed =
        window.confirm(
            `Are you sure you want to delete "${videoTitle}"?\n\nThis will remove the saved video and its notes.`
        );

    if (!confirmed) {
        return;
    }

    const deleteButton =
        card
            ? card.querySelector(
                ".delete-video-btn"
            )
            : null;

    try {

        if (deleteButton) {

            deleteButton.disabled = true;

            deleteButton.textContent =
                "Deleting...";
        }

        const response =
            await authorizedFetch(
                `/api/videos/${encodeURIComponent(
                    videoId
                )}`,
                {
                    method: "DELETE"
                }
            );

        if (!response) {
            return;
        }

        const data =
            await response.json();

        console.log(
            "DELETE VIDEO RESPONSE:",
            data
        );

        if (!response.ok || !data.success) {

            alert(
                data.error ||
                "Unable to delete video."
            );

            if (deleteButton) {

                deleteButton.disabled = false;

                deleteButton.textContent =
                    "Delete";
            }

            return;
        }

        // If deleted video was currently selected,
        // remove selected ID from localStorage.
        const selectedVideoId =
            localStorage.getItem(
                "selectedVideoId"
            );

        if (
            selectedVideoId &&
            String(selectedVideoId) ===
            String(videoId)
        ) {

            localStorage.removeItem(
                "selectedVideoId"
            );
        }

        // Remove card immediately
        if (card) {

            card.remove();
        }

        // Check whether any cards remain
        const container =
            document.getElementById(
                "videosContainer"
            );

        if (
            container &&
            !container.querySelector(
                ".video-card"
            )
        ) {

            container.innerHTML = `
                <div class="empty-card">
                    <p>No saved videos yet.</p>
                    <p>Generate notes from a YouTube video to see it here.</p>
                </div>
            `;
        }

    } catch (error) {

        console.error(
            "DELETE VIDEO ERROR:",
            error
        );

        alert(
            "Something went wrong while deleting the video."
        );

        if (deleteButton) {

            deleteButton.disabled = false;

            deleteButton.textContent =
                "Delete";
        }
    }
}


// =========================================================
// NOTES PAGE
// =========================================================

function setupNotesPage() {

    console.log("Setting up notes page");

    const token =
        localStorage.getItem("token");

    if (!token) {

        window.location.href =
            "index.html";

        return;
    }

    const backButton =
        document.getElementById("backBtn");

    if (backButton) {

        backButton.addEventListener(
            "click",
            () => {

                window.location.href =
                    "dashboard.html";
            }
        );
    }

    const videoId =
        localStorage.getItem(
            "selectedVideoId"
        );

    console.log(
        "SELECTED VIDEO ID:",
        videoId
    );

    if (!videoId) {

        showNotesMessage(
            "No video selected.",
            true
        );

        return;
    }

    loadVideoNotes(videoId);
}


// =========================================================
// LOAD VIDEO NOTES
// =========================================================

async function loadVideoNotes(videoId) {

    try {

        showNotesMessage(
            "Loading notes...",
            false
        );

        const response =
            await authorizedFetch(
                `/api/videos/${encodeURIComponent(
                    videoId
                )}/notes`
            );

        if (!response) {
            return;
        }

        const data =
            await response.json();

        console.log(
            "VIDEO NOTES RESPONSE:",
            data
        );

        if (!response.ok || !data.success) {

            showNotesMessage(
                data.error ||
                "Unable to load notes.",
                true
            );

            return;
        }

        displayVideoInfo(
            data.video || {}
        );

        displayNotes(
            data.notes || {},
            data.revision_questions || []
        );

        hideNotesMessage();

    } catch (error) {

        console.error(
            "LOAD NOTES ERROR:",
            error
        );

        showNotesMessage(
            "Unable to load notes.",
            true
        );
    }
}


// =========================================================
// DISPLAY VIDEO INFORMATION
// =========================================================

function displayVideoInfo(video) {

    const thumbnail =
        document.getElementById(
            "videoThumbnail"
        );

    const title =
        document.getElementById(
            "videoTitle"
        );

    const date =
        document.getElementById(
            "videoDate"
        );

    if (thumbnail) {

        thumbnail.src =
            video.thumbnail_url || "";

        thumbnail.alt =
            video.video_title ||
            "YouTube video thumbnail";

        thumbnail.onerror = () => {

            thumbnail.style.display =
                "none";
        };
    }

    if (title) {

        title.textContent =
            video.video_title ||
            "Untitled Video";
    }

    if (date) {

        date.textContent =
            video.created_at
                ? `Added on ${formatDate(
                    video.created_at
                )}`
                : "";
    }
}


// =========================================================
// DISPLAY ALL NOTES
// =========================================================

function displayNotes(
    notes,
    revisionQuestions
) {

    console.log(
        "DISPLAY NOTES:",
        notes
    );

    console.log(
        "REVISION QUESTIONS:",
        revisionQuestions
    );

    const summary =
        notes.summary ||
        "";

    const detailedNotes =
        notes.detailed_notes ||
        "";

    const keyPoints =
        notes.key_points ||
        "";

    // -----------------------------------------------------
    // SUMMARY
    // -----------------------------------------------------

    setContent(
        "summary",
        summary ||
        extractSection(
            detailedNotes,
            "OVERVIEW"
        ) ||
        "No summary available."
    );

    // -----------------------------------------------------
    // KEY POINTS
    // -----------------------------------------------------

    let extractedKeyPoints =
        parseBulletList(keyPoints);

    if (extractedKeyPoints.length === 0) {

        extractedKeyPoints =
            extractSectionLines(
                detailedNotes,
                "IMPORTANT CONCEPTS"
            );
    }

    if (extractedKeyPoints.length === 0) {

        extractedKeyPoints =
            extractSectionLines(
                detailedNotes,
                "QUICK REVISION"
            );
    }

    renderList(
        "keyPoints",
        extractedKeyPoints,
        "No key points available."
    );

    // -----------------------------------------------------
    // DETAILED NOTES
    // -----------------------------------------------------

    renderDetailedNotes(
        "detailedNotes",
        detailedNotes
    );

    // -----------------------------------------------------
    // IMPORTANT CONCEPTS
    // -----------------------------------------------------

    const importantConcepts =
        extractSectionLines(
            detailedNotes,
            "IMPORTANT CONCEPTS"
        );

    renderList(
        "concepts",
        importantConcepts,
        "No important concepts available."
    );

    // -----------------------------------------------------
    // EXAMPLES
    // -----------------------------------------------------

    const examples =
        extractExamples(
            detailedNotes
        );

    renderList(
        "examples",
        examples,
        "No examples available."
    );

    // -----------------------------------------------------
    // QUICK REVISION
    // -----------------------------------------------------

    const quickRevision =
        extractSectionLines(
            detailedNotes,
            "QUICK REVISION"
        );

    renderList(
        "quickRevision",
        quickRevision,
        "No quick revision available."
    );

    // -----------------------------------------------------
    // REVISION QUESTIONS
    // -----------------------------------------------------

    renderRevisionQuestions(
        revisionQuestions
    );
}


// =========================================================
// REVISION QUESTIONS
// =========================================================

function renderRevisionQuestions(
    questions
) {

    const container =
        document.getElementById(
            "revisionQuestions"
        );

    if (!container) {
        return;
    }

    container.innerHTML = "";

    if (
        !Array.isArray(questions) ||
        questions.length === 0
    ) {

        container.innerHTML =
            "<p>No revision questions available.</p>";

        return;
    }

    questions.forEach(
        (item, index) => {

            const question =
                typeof item === "string"
                    ? item
                    : (
                        item.question ||
                        ""
                    );

            const answer =
                typeof item === "object"
                    ? (
                        item.answer ||
                        ""
                    )
                    : "";

            const type =
                typeof item === "object"
                    ? (
                        item.question_type ||
                        item.type ||
                        "conceptual"
                    )
                    : "conceptual";

            if (!question.trim()) {
                return;
            }

            const card =
                document.createElement(
                    "div"
                );

            card.className =
                "revision-question";

            card.innerHTML = `
                <div class="question-number">
                    Question ${index + 1}
                </div>

                <h3>
                    ${escapeHtml(question)}
                </h3>

                <p class="question-type">
                    ${escapeHtml(
                        capitalize(type)
                    )}
                </p>

                <div class="answer">

                    <strong>Answer:</strong>

                    <p>
                        ${
                            answer
                                ? escapeHtml(answer)
                                : "Answer not available."
                        }
                    </p>

                </div>
            `;

            container.appendChild(
                card
            );
        }
    );
}


// =========================================================
// DETAILED NOTES RENDERER
// =========================================================

function renderDetailedNotes(
    elementId,
    text
) {

    const container =
        document.getElementById(
            elementId
        );

    if (!container) {
        return;
    }

    if (!text || !text.trim()) {

        container.innerHTML =
            "<p>No detailed notes available.</p>";

        return;
    }

    const sections =
        parseDetailedNotes(
            text
        );

    if (sections.length === 0) {

        container.innerHTML =
            formatText(text);

        return;
    }

    container.innerHTML = "";

    sections.forEach(section => {

        const card =
            document.createElement(
                "div"
            );

        card.className =
            "detailed-note-section";

        card.innerHTML = `
            <h3>
                ${escapeHtml(
                    section.heading
                )}
            </h3>

            <div>
                ${formatText(
                    section.content
                )}
            </div>
        `;

        container.appendChild(
            card
        );
    });
}


// =========================================================
// PARSE DETAILED NOTES
// =========================================================

function parseDetailedNotes(text) {

    const headings = [
        "TOPIC",
        "OVERVIEW",
        "IMPORTANT CONCEPTS",
        "DETAILED CONCEPTS",
        "QUICK REVISION"
    ];

    const lines =
        text
            .split(/\r?\n/)
            .map(line => line.trim());

    const sections = [];

    let currentHeading = null;
    let currentContent = [];

    function saveSection() {

        if (
            currentHeading &&
            currentContent.join("\n").trim()
        ) {

            sections.push({
                heading:
                    currentHeading,

                content:
                    currentContent
                        .join("\n")
                        .trim()
            });
        }
    }

    lines.forEach(line => {

        const upper =
            line.toUpperCase();

        if (
            headings.includes(
                upper
            )
        ) {

            saveSection();

            currentHeading =
                line;

            currentContent = [];

            return;
        }

        if (currentHeading) {

            currentContent.push(
                line
            );
        }
    });

    saveSection();

    return sections;
}


// =========================================================
// EXTRACT SECTION
// =========================================================

function extractSection(
    text,
    heading
) {

    if (!text) {
        return "";
    }

    const lines =
        text.split(/\r?\n/);

    let collecting = false;

    const result = [];

    const headings = [
        "TOPIC",
        "OVERVIEW",
        "IMPORTANT CONCEPTS",
        "DETAILED CONCEPTS",
        "QUICK REVISION"
    ];

    for (const line of lines) {

        const trimmed =
            line.trim();

        if (
            trimmed.toUpperCase() ===
            heading.toUpperCase()
        ) {

            collecting = true;

            continue;
        }

        if (
            collecting &&
            headings.includes(
                trimmed.toUpperCase()
            )
        ) {

            break;
        }

        if (collecting && trimmed) {

            result.push(
                trimmed
            );
        }
    }

    return result.join("\n");
}


// =========================================================
// EXTRACT SECTION LINES
// =========================================================

function extractSectionLines(
    text,
    heading
) {

    const section =
        extractSection(
            text,
            heading
        );

    if (!section) {
        return [];
    }

    return parseBulletList(
        section
    );
}


// =========================================================
// EXTRACT EXAMPLES
// =========================================================

function extractExamples(text) {

    if (!text) {
        return [];
    }

    const lines =
        text.split(/\r?\n/);

    const examples = [];

    let collecting = false;
    let buffer = [];

    function saveExample() {

        const value =
            buffer
                .join("\n")
                .trim();

        if (value) {
            examples.push(value);
        }

        buffer = [];
    }

    for (const line of lines) {

        const trimmed =
            line.trim();

        const upper =
            trimmed.toUpperCase();

        if (
            upper === "EXAMPLE" ||
            upper === "PRACTICAL EXAMPLE"
        ) {

            saveExample();

            collecting = true;

            continue;
        }

        if (
            collecting &&
            (
                upper === "EXPLANATION" ||
                upper === "HOW IT WORKS" ||
                upper === "IMPORTANT POINTS" ||
                upper === "COMMON MISTAKES" ||
                upper === "QUICK REVISION"
            )
        ) {

            saveExample();

            collecting = false;

            continue;
        }

        if (collecting && trimmed) {

            buffer.push(
                trimmed
            );
        }
    }

    saveExample();

    return examples;
}


// =========================================================
// PARSE BULLET LIST
// =========================================================

function parseBulletList(value) {

    if (!value) {
        return [];
    }

    if (Array.isArray(value)) {

        return value
            .map(item => {

                if (
                    typeof item ===
                    "object"
                ) {

                    return (
                        item.name ||
                        item.title ||
                        item.text ||
                        item.point ||
                        ""
                    );
                }

                return String(item);
            })
            .map(item =>
                item
                    .replace(/^[-•*]\s*/, "")
                    .trim()
            )
            .filter(Boolean);
    }

    return String(value)
        .split(/\r?\n/)
        .map(line =>
            line
                .replace(
                    /^[-•*]\s*/,
                    ""
                )
                .replace(
                    /^\d+\.\s*/,
                    ""
                )
                .trim()
        )
        .filter(Boolean);
}


// =========================================================
// RENDER LIST
// =========================================================

function renderList(
    elementId,
    items,
    emptyMessage
) {

    const container =
        document.getElementById(
            elementId
        );

    if (!container) {
        return;
    }

    container.innerHTML = "";

    if (
        !Array.isArray(items) ||
        items.length === 0
    ) {

        container.innerHTML =
            `<p>${escapeHtml(
                emptyMessage
            )}</p>`;

        return;
    }

    const ul =
        document.createElement("ul");

    ul.className =
        "notes-list";

    items.forEach(item => {

        const li =
            document.createElement("li");

        li.innerHTML =
            formatText(
                String(item)
            );

        ul.appendChild(li);
    });

    container.appendChild(ul);
}


// =========================================================
// SET CONTENT
// =========================================================

function setContent(
    elementId,
    value
) {

    const element =
        document.getElementById(
            elementId
        );

    if (!element) {
        return;
    }

    if (!value) {

        element.textContent =
            "No information available.";

        return;
    }

    element.innerHTML =
        formatText(
            String(value)
        );
}


// =========================================================
// FORMAT TEXT
// =========================================================

function formatText(text) {

    if (!text) {
        return "";
    }

    return escapeHtml(
        String(text)
    )
        .replace(
            /\n\n/g,
            "<br><br>"
        )
        .replace(
            /\n/g,
            "<br>"
        );
}


// =========================================================
// NOTES MESSAGE
// =========================================================

function showNotesMessage(
    message,
    isError
) {

    const element =
        document.getElementById(
            "notesMessage"
        );

    if (!element) {
        return;
    }

    element.style.display =
        "block";

    element.textContent =
        message;

    element.className =
        isError
            ? "notes-message error"
            : "notes-message";
}


function hideNotesMessage() {

    const element =
        document.getElementById(
            "notesMessage"
        );

    if (!element) {
        return;
    }

    element.style.display =
        "none";
}


// =========================================================
// GENERAL MESSAGE
// =========================================================

function showMessage(
    element,
    message,
    isError
) {

    if (!element) {
        return;
    }

    element.textContent =
        message;

    element.style.display =
        "block";

    element.className =
        isError
            ? "error-message"
            : "success-message";
}


// =========================================================
// DATE FORMAT
// =========================================================

function formatDate(dateValue) {

    if (!dateValue) {
        return "";
    }

    try {

        const date =
            new Date(dateValue);

        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return String(
                dateValue
            );
        }

        return date.toLocaleDateString(
            "en-IN",
            {
                day: "numeric",
                month: "long",
                year: "numeric"
            }
        );

    } catch {

        return String(
            dateValue
        );
    }
}


// =========================================================
// CAPITALIZE
// =========================================================

function capitalize(value) {

    if (!value) {
        return "";
    }

    return (
        value.charAt(0).toUpperCase() +
        value.slice(1)
    );
}


// =========================================================
// HTML ESCAPE
// =========================================================

function escapeHtml(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";
    }

    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}