// =========================================================
// YouTube AI Notes - app.js
// COMPLETE FINAL FIXED VERSION
//
// Login + Register + Dashboard + Notes
// Short Notes
// Key Points
// Concept Flow
// Mind Map
// Visual Diagrams
// Practical Examples
// Quick Revision
// Interview Questions
// Cross Questions
// Delete Video
// JWT Authentication
// Back / Forward Security
// CACHE FIX
// =========================================================


// =========================================================
// CACHE BUSTING
// =========================================================

function addCacheBuster(url) {

    const separator =
        url.includes("?")
            ? "&"
            : "?";

    return `${url}${separator}_t=${Date.now()}`;
}


// =========================================================
// JWT + BACK/FORWARD SECURITY
// =========================================================

function checkProtectedPage() {

    const path =
        window.location.pathname.toLowerCase();

    const isProtectedPage =
        path.endsWith("dashboard.html") ||
        path.endsWith("notes.html");

    if (!isProtectedPage) {
        return true;
    }

    const token =
        localStorage.getItem("token");

    if (!token) {

        window.location.replace(
            "index.html?_t=" + Date.now()
        );

        return false;
    }

    return true;
}


// Check immediately
checkProtectedPage();


// Check browser Back / Forward
window.addEventListener(
    "pageshow",
    () => {

        checkProtectedPage();

    }
);


// =========================================================
// APP INITIALIZATION
// =========================================================

function initializeApp() {

    console.log(
        "APP.JS LOADED SUCCESSFULLY"
    );

    const path =
        window.location.pathname
            .toLowerCase();

    console.log(
        "CURRENT PAGE:",
        path
    );


    // -----------------------------------------------------
    // LOGIN
    // -----------------------------------------------------

    if (
        path.endsWith("/") ||
        path.endsWith("index.html")
    ) {

        console.log(
            "INITIALIZING LOGIN PAGE"
        );

        setupLoginPage();

        return;
    }


    // -----------------------------------------------------
    // REGISTER
    // -----------------------------------------------------

    if (
        path.endsWith("register.html")
    ) {

        console.log(
            "INITIALIZING REGISTER PAGE"
        );

        setupRegisterPage();

        return;
    }


    // -----------------------------------------------------
    // DASHBOARD
    // -----------------------------------------------------

    if (
        path.endsWith("dashboard.html")
    ) {

        console.log(
            "INITIALIZING DASHBOARD PAGE"
        );

        setupDashboardPage();

        return;
    }


    // -----------------------------------------------------
    // NOTES
    // -----------------------------------------------------

    if (
        path.endsWith("notes.html")
    ) {

        console.log(
            "INITIALIZING NOTES PAGE"
        );

        setupNotesPage();

        return;
    }


    console.log(
        "NO PAGE ROUTE MATCHED"
    );
}


// =========================================================
// DOM READY
// =========================================================

if (
    document.readyState === "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeApp
    );

} else {

    initializeApp();
}


// =========================================================
// API HELPER - CACHE FIX
// =========================================================

async function authorizedFetch(
    url,
    options = {}
) {

    const token =
        localStorage.getItem("token");


    const headers = {
        ...(options.headers || {}),

        "Cache-Control":
            "no-cache, no-store, must-revalidate",

        "Pragma":
            "no-cache",

        "Expires":
            "0"
    };


    if (token) {

        headers["Authorization"] =
            `Bearer ${token}`;
    }


    if (
        options.body &&
        typeof options.body === "string" &&
        !headers["Content-Type"]
    ) {

        headers["Content-Type"] =
            "application/json";
    }


    // -----------------------------------------------------
    // CACHE BUSTER
    // -----------------------------------------------------

    const requestUrl =
        addCacheBuster(url);


    console.log(
        "API REQUEST:",
        requestUrl
    );


    try {

        const response =
            await fetch(
                requestUrl,
                {
                    ...options,

                    cache:
                        "no-store",

                    headers
                }
            );


        console.log(
            "API STATUS:",
            requestUrl,
            response.status
        );


        if (
            response.status === 401 ||
            response.status === 403
        ) {

            localStorage.removeItem(
                "token"
            );

            localStorage.removeItem(
                "selectedVideoId"
            );


            window.location.replace(
                "index.html?_t=" + Date.now()
            );

            return null;
        }


        return response;

    }

    catch (error) {

        console.error(
            "AUTHORIZED FETCH ERROR:",
            error
        );

        throw error;
    }
}


// =========================================================
// LOGIN
// =========================================================

function setupLoginPage() {

    const loginForm =
        document.getElementById(
            "loginForm"
        );

    if (!loginForm) {
        return;
    }


    loginForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            const emailInput =
                document.getElementById(
                    "email"
                );

            const passwordInput =
                document.getElementById(
                    "password"
                );

            const message =
                document.getElementById(
                    "loginMessage"
                );


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


                const loginUrl =
                    addCacheBuster(
                        "/api/auth/login"
                    );


                const response =
                    await fetch(
                        loginUrl,
                        {
                            method: "POST",

                            cache:
                                "no-store",

                            headers: {
                                "Content-Type":
                                    "application/json",

                                "Cache-Control":
                                    "no-cache, no-store, must-revalidate",

                                "Pragma":
                                    "no-cache",

                                "Expires":
                                    "0"
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


                if (
                    !response.ok ||
                    !data.success
                ) {

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


                window.location.replace(
                    "dashboard.html?_t=" +
                    Date.now()
                );
            }

            catch (error) {

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

        }
    );
}


// =========================================================
// REGISTER
// =========================================================

function setupRegisterPage() {

    const registerForm =
        document.getElementById(
            "registerForm"
        );

    if (!registerForm) {
        return;
    }


    registerForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            const nameInput =
                document.getElementById(
                    "name"
                );

            const emailInput =
                document.getElementById(
                    "email"
                );

            const passwordInput =
                document.getElementById(
                    "password"
                );

            const message =
                document.getElementById(
                    "registerMessage"
                );


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


            if (
                !name ||
                !email ||
                !password
            ) {

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


                const registerUrl =
                    addCacheBuster(
                        "/api/auth/register"
                    );


                const response =
                    await fetch(
                        registerUrl,
                        {
                            method: "POST",

                            cache:
                                "no-store",

                            headers: {
                                "Content-Type":
                                    "application/json",

                                "Cache-Control":
                                    "no-cache, no-store, must-revalidate",

                                "Pragma":
                                    "no-cache",

                                "Expires":
                                    "0"
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


                if (
                    !response.ok ||
                    !data.success
                ) {

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


                setTimeout(
                    () => {

                        window.location.replace(
                            "index.html?_t=" +
                            Date.now()
                        );

                    },
                    1000
                );
            }

            catch (error) {

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

    console.log(
        "Setting up dashboard"
    );


    const logoutButton =
        document.getElementById(
            "logoutButton"
        );


    const notesForm =
        document.getElementById(
            "notesForm"
        );


    const refreshButton =
        document.getElementById(
            "refreshButton"
        );


    const token =
        localStorage.getItem(
            "token"
        );


    if (!token) {

        window.location.replace(
            "index.html?_t=" +
            Date.now()
        );

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


                window.location.replace(
                    "index.html?_t=" +
                    Date.now()
                );
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
    // LOAD SAVED VIDEOS
    // -----------------------------------------------------

    console.log(
        "Calling loadVideos()..."
    );

    loadVideos();
}


// =========================================================
// GENERATE AI NOTES
// =========================================================

async function generateNotes(event) {

    event.preventDefault();


    const urlInput =
        document.getElementById(
            "youtubeUrl"
        );


    const generateButton =
        document.getElementById(
            "generateButton"
        );


    const message =
        document.getElementById(
            "notesMessage"
        );


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

            generateButton.disabled =
                true;

            generateButton.innerHTML =
                `<span>Generating...</span><span>⏳</span>`;
        }


        showMessage(
            message,
            "Getting transcript and generating AI learning material...",
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


        if (
            !response.ok ||
            !data.success
        ) {

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


            window.location.replace(
                "notes.html?_t=" +
                Date.now()
            );

            return;
        }


        showMessage(
            message,
            "Notes generated but video ID was not returned.",
            true
        );

    }

    catch (error) {

        console.error(
            "GENERATE NOTES ERROR:",
            error
        );


        showMessage(
            message,
            "Something went wrong while generating notes.",
            true
        );

    }

    finally {

        if (generateButton) {

            generateButton.disabled =
                false;

            generateButton.innerHTML =
                `<span>Generate Notes</span><span>→</span>`;
        }
    }
}


// =========================================================
// LOAD SAVED VIDEOS
// =========================================================

async function loadVideos() {

    console.log(
        "LOAD VIDEOS FUNCTION STARTED"
    );


    const container =
        document.getElementById(
            "videosContainer"
        );


    if (!container) {

        console.error(
            "videosContainer NOT FOUND"
        );

        return;
    }


    container.innerHTML = `
        <div class="loading-card">
            <div class="spinner"></div>
            <p>Loading your videos...</p>
        </div>
    `;


    try {

        console.log(
            "FETCHING /api/videos..."
        );


        const response =
            await authorizedFetch(
                "/api/videos"
            );


        if (!response) {
            return;
        }


        console.log(
            "VIDEOS API STATUS:",
            response.status
        );


        const data =
            await response.json();


        console.log(
            "VIDEOS RESPONSE:",
            data
        );


        if (
            !response.ok ||
            !data.success
        ) {

            container.innerHTML = `
                <div class="error-message">
                    ${escapeHtml(
                        data.error ||
                        "Unable to load videos."
                    )}
                </div>
            `;

            return;
        }


        const videos =
            Array.isArray(data.videos)
                ? data.videos
                : [];


        console.log(
            "SAVED VIDEOS COUNT:",
            videos.length
        );


        if (videos.length === 0) {

            container.innerHTML = `
                <div class="empty-message">

                    <p>
                        No saved videos yet.
                    </p>

                    <p>
                        Generate notes from a YouTube video
                        to see it here.
                    </p>

                </div>
            `;

            return;
        }


        container.innerHTML = "";


        videos.forEach(
            video => {

                const card =
                    createVideoCard(
                        video
                    );

                container.appendChild(
                    card
                );
            }
        );


        applyVideoCardResponsiveStyles();


        console.log(
            "SAVED VIDEOS RENDERED SUCCESSFULLY"
        );

    }

    catch (error) {

        console.error(
            "LOAD VIDEOS ERROR:",
            error
        );


        container.innerHTML = `
            <div class="error-message">

                <p>
                    Unable to load videos.
                </p>

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
// CREATE VIDEO CARD
// =========================================================

function createVideoCard(video) {

    const card =
        document.createElement(
            "div"
        );


    card.className =
        "video-card";


    card.style.width =
        "100%";

    card.style.maxWidth =
        "760px";

    card.style.margin =
        "0 auto 14px";

    card.style.padding =
        "12px";

    card.style.display =
        "flex";

    card.style.alignItems =
        "center";

    card.style.gap =
        "14px";

    card.style.background =
        "#ffffff";

    card.style.border =
        "1px solid #e5e7eb";

    card.style.borderRadius =
        "14px";

    card.style.boxShadow =
        "0 4px 14px rgba(15,23,42,0.06)";

    card.style.boxSizing =
        "border-box";

    card.style.overflow =
        "hidden";


    const thumbnail =
        video.thumbnail_url ||
        "";


    const title =
        video.video_title ||
        video.title ||
        "Untitled Video";


    const date =
        formatDate(
            video.created_at
        );


    // -----------------------------------------------------
    // THUMBNAIL
    // -----------------------------------------------------

    const thumbnailWrapper =
        document.createElement(
            "div"
        );


    thumbnailWrapper.className =
        "video-thumbnail-wrapper";


    thumbnailWrapper.style.width =
        "150px";

    thumbnailWrapper.style.height =
        "84px";

    thumbnailWrapper.style.minWidth =
        "150px";

    thumbnailWrapper.style.borderRadius =
        "10px";

    thumbnailWrapper.style.overflow =
        "hidden";

    thumbnailWrapper.style.background =
        "#f1f5f9";

    thumbnailWrapper.style.position =
        "relative";


    if (thumbnail) {

        const image =
            document.createElement(
                "img"
            );


        image.src =
            thumbnail;


        image.alt =
            "YouTube video thumbnail";


        image.className =
            "video-card-thumbnail";


        image.style.width =
            "100%";

        image.style.height =
            "100%";

        image.style.display =
            "block";

        image.style.objectFit =
            "cover";


        image.onerror = () => {

            image.style.display =
                "none";


            thumbnailWrapper.innerHTML = `
                <div style="
                    width:100%;
                    height:100%;
                    display:flex;
                    align-items:center;
                    justify-content:center;
                    font-size:24px;
                ">
                    ▶️
                </div>
            `;
        };


        thumbnailWrapper.appendChild(
            image
        );

    }

    else {

        thumbnailWrapper.innerHTML = `
            <div style="
                width:100%;
                height:100%;
                display:flex;
                align-items:center;
                justify-content:center;
                font-size:24px;
            ">
                ▶️
            </div>
        `;
    }


    // -----------------------------------------------------
    // CONTENT
    // -----------------------------------------------------

    const content =
        document.createElement(
            "div"
        );


    content.className =
        "video-card-content";


    content.style.flex =
        "1";

    content.style.minWidth =
        "0";


    const heading =
        document.createElement(
            "h3"
        );


    heading.textContent =
        title;


    heading.title =
        title;


    heading.style.margin =
        "0 0 5px";

    heading.style.fontSize =
        "16px";

    heading.style.lineHeight =
        "1.35";

    heading.style.fontWeight =
        "700";

    heading.style.color =
        "#111827";

    heading.style.display =
        "-webkit-box";

    heading.style.webkitLineClamp =
        "2";

    heading.style.webkitBoxOrient =
        "vertical";

    heading.style.overflow =
        "hidden";

    heading.style.wordBreak =
        "break-word";


    content.appendChild(
        heading
    );


    if (date) {

        const dateElement =
            document.createElement(
                "p"
            );


        dateElement.textContent =
            `Added on ${date}`;


        dateElement.style.margin =
            "0 0 9px";

        dateElement.style.fontSize =
            "12px";

        dateElement.style.color =
            "#6b7280";


        content.appendChild(
            dateElement
        );
    }


    // -----------------------------------------------------
    // ACTIONS
    // -----------------------------------------------------

    const actions =
        document.createElement(
            "div"
        );


    actions.className =
        "video-card-actions";


    actions.style.display =
        "flex";

    actions.style.alignItems =
        "center";

    actions.style.gap =
        "8px";


    // -----------------------------------------------------
    // VIEW NOTES
    // -----------------------------------------------------

    const viewButton =
        document.createElement(
            "button"
        );


    viewButton.type =
        "button";


    viewButton.className =
        "view-notes-btn";


    viewButton.textContent =
        "View Notes";


    viewButton.style.border =
        "none";

    viewButton.style.borderRadius =
        "7px";

    viewButton.style.padding =
        "7px 12px";

    viewButton.style.fontSize =
        "12px";

    viewButton.style.fontWeight =
        "600";

    viewButton.style.cursor =
        "pointer";

    viewButton.style.background =
        "#4f46e5";

    viewButton.style.color =
        "#ffffff";


    viewButton.addEventListener(
        "click",
        () => {

            localStorage.setItem(
                "selectedVideoId",
                video.id
            );


            window.location.replace(
                "notes.html?_t=" +
                Date.now()
            );
        }
    );


    // -----------------------------------------------------
    // DELETE
    // -----------------------------------------------------

    const deleteButton =
        document.createElement(
            "button"
        );


    deleteButton.type =
        "button";


    deleteButton.className =
        "delete-video-btn";


    deleteButton.textContent =
        "Delete";


    deleteButton.style.border =
        "1px solid #fecaca";

    deleteButton.style.borderRadius =
        "7px";

    deleteButton.style.padding =
        "7px 12px";

    deleteButton.style.fontSize =
        "12px";

    deleteButton.style.fontWeight =
        "600";

    deleteButton.style.cursor =
        "pointer";

    deleteButton.style.background =
        "#fff5f5";

    deleteButton.style.color =
        "#dc2626";


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


    actions.appendChild(
        viewButton
    );


    actions.appendChild(
        deleteButton
    );


    content.appendChild(
        actions
    );


    card.appendChild(
        thumbnailWrapper
    );


    card.appendChild(
        content
    );


    return card;
}


// =========================================================
// RESPONSIVE VIDEO CARDS
// =========================================================

function applyVideoCardResponsiveStyles() {

    const styleId =
        "saved-video-card-responsive-style";


    if (
        document.getElementById(
            styleId
        )
    ) {
        return;
    }


    const style =
        document.createElement(
            "style"
        );


    style.id =
        styleId;


    style.textContent = `

        .video-card {
            transition:
                transform 0.2s ease,
                box-shadow 0.2s ease;
        }

        .video-card:hover {
            transform: translateY(-1px);
            box-shadow:
                0 7px 18px rgba(15,23,42,0.09) !important;
        }

        @media (max-width: 600px) {

            .video-card {
                padding: 10px !important;
                gap: 10px !important;
            }

            .video-thumbnail-wrapper {
                width: 105px !important;
                height: 70px !important;
                min-width: 105px !important;
            }

            .video-card h3 {
                font-size: 14px !important;
            }

            .video-card-actions {
                gap: 6px !important;
            }

            .video-card-actions button {
                padding: 6px 9px !important;
                font-size: 11px !important;
            }
        }

        @media (max-width: 400px) {

            .video-thumbnail-wrapper {
                width: 90px !important;
                height: 60px !important;
                min-width: 90px !important;
            }

            .video-card h3 {
                font-size: 13px !important;
            }
        }

    `;


    document.head.appendChild(
        style
    );
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

            deleteButton.disabled =
                true;

            deleteButton.textContent =
                "Deleting...";

            deleteButton.style.opacity =
                "0.6";
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


        if (
            !response.ok ||
            !data.success
        ) {

            alert(
                data.error ||
                "Unable to delete video."
            );


            if (deleteButton) {

                deleteButton.disabled =
                    false;

                deleteButton.textContent =
                    "Delete";

                deleteButton.style.opacity =
                    "1";
            }


            return;
        }


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


        if (card) {
            card.remove();
        }


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
                <div class="empty-message">

                    <p>
                        No saved videos yet.
                    </p>

                    <p>
                        Generate notes from a YouTube
                        video to see it here.
                    </p>

                </div>
            `;
        }

    }

    catch (error) {

        console.error(
            "DELETE VIDEO ERROR:",
            error
        );


        alert(
            "Something went wrong while deleting the video."
        );


        if (deleteButton) {

            deleteButton.disabled =
                false;

            deleteButton.textContent =
                "Delete";

            deleteButton.style.opacity =
                "1";
        }
    }
}


// =========================================================
// NOTES PAGE
// =========================================================

function setupNotesPage() {

    console.log(
        "Setting up notes page"
    );


    const token =
        localStorage.getItem(
            "token"
        );


    if (!token) {

        window.location.replace(
            "index.html?_t=" +
            Date.now()
        );

        return;
    }


    const backButton =
        document.getElementById(
            "backBtn"
        );


    if (backButton) {

        backButton.addEventListener(
            "click",
            () => {

                window.location.replace(
                    "dashboard.html?_t=" +
                    Date.now()
                );
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

setupAskQuestion(videoId);

loadVideoNotes(
    videoId
);
}


// =========================================================
// LOAD VIDEO NOTES
// =========================================================

async function loadVideoNotes(
    videoId
) {

    try {

        showNotesMessage(
            "Loading learning material...",
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


        if (
            !response.ok ||
            !data.success
        ) {

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
            data.notes || {}
        );


        hideNotesMessage();

    }

    catch (error) {

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

function displayVideoInfo(
    video
) {

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


        thumbnail.onerror =
            () => {

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
// DISPLAY NOTES
// =========================================================

function displayNotes(
    notes
) {

    console.log(
        "DISPLAY NOTES:",
        notes
    );


    const keyPoints =
        parseJsonValue(
            notes.key_points ||
            notes.keyPoints ||
            notes.key_points_list,
            []
        );


    const concepts =
        parseJsonValue(
            notes.concepts ||
            notes.important_concepts,
            []
        );


    const conceptFlow =
        parseJsonValue(
            notes.concept_flow ||
            notes.conceptFlow ||
            notes.flow ||
            notes.concept_flow_steps,
            []
        );


    const mindMap =
        parseJsonValue(
            notes.mind_map ||
            notes.mindMap ||
            notes.mind_map_data,
            {}
        );


    const visuals =
        parseJsonValue(
            notes.visuals ||
            notes.important_visuals ||
            notes.diagrams,
            []
        );


    const practicalExamples =
        parseJsonValue(
            notes.practical_examples ||
            notes.practicalExamples ||
            notes.examples,
            []
        );


    const quickRevision =
        parseJsonValue(
            notes.quick_revision ||
            notes.quickRevision ||
            notes.revision,
            []
        );


    const interviewQuestions =
        parseJsonValue(
            notes.interview_questions ||
            notes.interviewQuestions ||
            notes.questions,
            []
        );


    const crossQuestions =
        parseJsonValue(
            notes.cross_questions ||
            notes.crossQuestions ||
            notes.follow_up_questions,
            []
        );


    // SHORT NOTES

    setContent(
        "shortNotes",
        notes.short_notes ||
        notes.shortNotes ||
        notes.summary ||
        "No short notes available."
    );


    // KEY POINTS

    renderList(
        "keyPoints",
        keyPoints,
        "No key points available."
    );


    // CONCEPT FLOW

    renderConceptFlow(
        conceptFlow
    );


    // MIND MAP

    renderMindMap(
        mindMap
    );


    // VISUALS

    renderVisuals(
        visuals
    );


    // CONCEPTS

    renderConcepts(
        concepts
    );


    // PRACTICAL EXAMPLES

    renderPracticalExamples(
        practicalExamples
    );


    // QUICK REVISION

    renderList(
        "quickRevision",
        quickRevision,
        "No quick revision available."
    );


    // INTERVIEW QUESTIONS

    renderInterviewQuestions(
        interviewQuestions
    );


    // CROSS QUESTIONS

    renderCrossQuestions(
        crossQuestions
    );
}


// =========================================================
// JSON PARSER
// =========================================================

function parseJsonValue(
    value,
    fallback
) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return fallback;
    }


    if (
        typeof value === "object"
    ) {

        return value;
    }


    if (
        typeof value === "string"
    ) {

        const text =
            value.trim();


        if (!text) {
            return fallback;
        }


        try {

            return JSON.parse(
                text
            );

        }

        catch {

            return text;
        }
    }


    return fallback;
}


// =========================================================
// CONCEPT FLOW
// =========================================================

function renderConceptFlow(
    flow
) {

    const container =
        document.getElementById(
            "conceptFlow"
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";


    let steps = [];


    if (Array.isArray(flow)) {

        steps =
            flow;
    }

    else if (
        flow &&
        typeof flow === "object"
    ) {

        if (
            Array.isArray(flow.steps)
        ) {

            steps =
                flow.steps;
        }

        else if (
            Array.isArray(flow.flow)
        ) {

            steps =
                flow.flow;
        }

        else if (
            Array.isArray(flow.nodes)
        ) {

            steps =
                flow.nodes;
        }

        else {

            steps =
                Object.values(flow);
        }

    }

    else if (
        typeof flow === "string"
    ) {

        steps =
            splitVisualText(
                flow
            );
    }


    if (!steps.length) {

        container.innerHTML = `
            <div class="empty-content">
                No concept flow available.
            </div>
        `;

        return;
    }


    const wrapper =
        document.createElement(
            "div"
        );


    wrapper.className =
        "flow-container";


    wrapper.style.width =
        "100%";

    wrapper.style.display =
        "flex";

    wrapper.style.flexDirection =
        "column";

    wrapper.style.alignItems =
        "center";


    steps.forEach(
        (step, index) => {

            let title =
                `Step ${index + 1}`;

            let description =
                "";


            if (
                step &&
                typeof step === "object"
            ) {

                title =
                    step.title ||
                    step.name ||
                    step.concept ||
                    step.heading ||
                    title;


                description =
                    step.description ||
                    step.explanation ||
                    step.text ||
                    step.details ||
                    step.content ||
                    "";

            }

            else {

                description =
                    String(step);
            }


            const element =
                document.createElement(
                    "div"
                );


            element.className =
                "flow-step";


            element.style.width =
                "min(100%, 680px)";

            element.style.background =
                "#ffffff";

            element.style.border =
                "1px solid #dbe3ef";

            element.style.borderRadius =
                "16px";

            element.style.padding =
                "18px 22px";

            element.style.display =
                "flex";

            element.style.alignItems =
                "flex-start";

            element.style.gap =
                "16px";

            element.style.boxSizing =
                "border-box";

            element.style.boxShadow =
                "0 6px 20px rgba(15,23,42,0.08)";


            const number =
                document.createElement(
                    "div"
                );


            number.textContent =
                index + 1;


            number.style.width =
                "42px";

            number.style.height =
                "42px";

            number.style.minWidth =
                "42px";

            number.style.borderRadius =
                "50%";

            number.style.display =
                "flex";

            number.style.alignItems =
                "center";

            number.style.justifyContent =
                "center";

            number.style.background =
                "#eef2ff";

            number.style.color =
                "#4f46e5";

            number.style.fontWeight =
                "700";


            const content =
                document.createElement(
                    "div"
                );


            content.style.flex =
                "1";


            const heading =
                document.createElement(
                    "h3"
                );


            heading.textContent =
                title;


            heading.style.margin =
                "0 0 6px";

            heading.style.fontSize =
                "17px";

            heading.style.color =
                "#111827";


            content.appendChild(
                heading
            );


            if (description) {

                const text =
                    document.createElement(
                        "p"
                    );


                text.textContent =
                    description;


                text.style.margin =
                    "0";

                text.style.color =
                    "#6b7280";

                text.style.fontSize =
                    "14px";

                text.style.lineHeight =
                    "1.65";


                content.appendChild(
                    text
                );
            }


            element.appendChild(
                number
            );


            element.appendChild(
                content
            );


            wrapper.appendChild(
                element
            );


            if (
                index <
                steps.length - 1
            ) {

                const arrow =
                    document.createElement(
                        "div"
                    );


                arrow.innerHTML = `
                    <div style="
                        width:2px;
                        height:20px;
                        background:#c7d2fe;
                        margin:auto;
                    "></div>

                    <div style="
                        color:#6366f1;
                        font-size:20px;
                        text-align:center;
                    ">
                        ↓
                    </div>
                `;


                wrapper.appendChild(
                    arrow
                );
            }
        }
    );


    container.appendChild(
        wrapper
    );
}


// =========================================================
// MIND MAP
// =========================================================

function renderMindMap(
    mindMap
) {

    const container =
        document.getElementById(
            "mindMap"
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";


    let center =
        "Main Topic";


    let branches = [];


    if (
        mindMap &&
        typeof mindMap === "object" &&
        !Array.isArray(mindMap)
    ) {

        center =
            mindMap.center ||
            mindMap.topic ||
            mindMap.title ||
            mindMap.main_topic ||
            mindMap.mainTopic ||
            center;


        branches =
            mindMap.branches ||
            mindMap.children ||
            mindMap.nodes ||
            mindMap.sections ||
            mindMap.topics ||
            [];
    }


    if (
        Array.isArray(mindMap)
    ) {

        branches =
            mindMap;
    }


    if (
        typeof mindMap === "string"
    ) {

        branches =
            splitVisualText(
                mindMap
            ).map(
                item => ({
                    name: item,
                    children: []
                })
            );
    }


    branches =
        Array.isArray(branches)
            ? branches.map(
                (branch, index) => {

                    if (
                        typeof branch === "string"
                    ) {

                        return {
                            name: branch,
                            children: []
                        };
                    }


                    if (
                        branch &&
                        typeof branch === "object"
                    ) {

                        return branch;
                    }


                    return {
                        name:
                            `Branch ${index + 1}`,
                        children: []
                    };
                }
            )
            : [];


    if (!branches.length) {

        container.innerHTML = `
            <div class="empty-content">
                No mind map branches available.
            </div>
        `;

        return;
    }


    const map =
        document.createElement(
            "div"
        );


    map.className =
        "mind-map";


    map.style.width =
        "100%";


    map.style.padding =
        "20px 5px";


    const centerNode =
        document.createElement(
            "div"
        );


    centerNode.textContent =
        center;


    centerNode.style.width =
        "fit-content";

    centerNode.style.maxWidth =
        "300px";

    centerNode.style.margin =
        "0 auto";

    centerNode.style.padding =
        "15px 28px";

    centerNode.style.background =
        "#4f46e5";

    centerNode.style.color =
        "#ffffff";

    centerNode.style.borderRadius =
        "16px";

    centerNode.style.textAlign =
        "center";

    centerNode.style.fontSize =
        "17px";

    centerNode.style.fontWeight =
        "800";


    map.appendChild(
        centerNode
    );


    const connector =
        document.createElement(
            "div"
        );


    connector.style.width =
        "2px";

    connector.style.height =
        "28px";

    connector.style.margin =
        "0 auto";

    connector.style.background =
        "#c7d2fe";


    map.appendChild(
        connector
    );


    const grid =
        document.createElement(
            "div"
        );


    grid.style.display =
        "grid";

    grid.style.gridTemplateColumns =
        "repeat(auto-fit,minmax(180px,1fr))";

    grid.style.gap =
        "15px";

    grid.style.width =
        "100%";


    branches.forEach(
        (branch, index) => {

            const box =
                document.createElement(
                    "div"
                );


            box.style.background =
                "#ffffff";

            box.style.border =
                "1px solid #dbe3ef";

            box.style.borderRadius =
                "13px";

            box.style.padding =
                "13px";


            const title =
                document.createElement(
                    "div"
                );


            title.textContent =
                branch.name ||
                branch.title ||
                branch.label ||
                branch.topic ||
                branch.heading ||
                `Branch ${index + 1}`;


            title.style.background =
                "#eef2ff";

            title.style.color =
                "#3730a3";

            title.style.padding =
                "10px";

            title.style.borderRadius =
                "9px";

            title.style.textAlign =
                "center";

            title.style.fontWeight =
                "700";


            box.appendChild(
                title
            );


            let children =
                branch.children ||
                branch.items ||
                branch.subtopics ||
                branch.points ||
                branch.details ||
                [];


            if (
                !Array.isArray(children)
            ) {

                children = [
                    children
                ];
            }


            children.forEach(
                child => {

                    let text = "";


                    if (
                        child &&
                        typeof child === "object"
                    ) {

                        text =
                            child.name ||
                            child.title ||
                            child.text ||
                            child.description ||
                            child.label ||
                            "";

                    }

                    else {

                        text =
                            String(child);
                    }


                    if (!text) {
                        return;
                    }


                    const childNode =
                        document.createElement(
                            "div"
                        );


                    childNode.textContent =
                        text;


                    childNode.style.marginTop =
                        "8px";

                    childNode.style.padding =
                        "8px 10px";

                    childNode.style.background =
                        "#f8fafc";

                    childNode.style.border =
                        "1px solid #e5e7eb";

                    childNode.style.borderRadius =
                        "8px";

                    childNode.style.fontSize =
                        "12px";


                    box.appendChild(
                        childNode
                    );
                }
            );


            grid.appendChild(
                box
            );
        }
    );


    map.appendChild(
        grid
    );


    container.appendChild(
        map
    );
}


// =========================================================
// VISUALS
// =========================================================

function renderVisuals(
    visuals
) {

    const container =
        document.getElementById(
            "visuals"
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";


    if (
        typeof visuals === "string"
    ) {

        visuals =
            splitVisualText(
                visuals
            );
    }


    if (
        !Array.isArray(visuals) ||
        !visuals.length
    ) {

        container.innerHTML = `
            <div class="empty-content">
                No important visuals available.
            </div>
        `;

        return;
    }


    const grid =
        document.createElement(
            "div"
        );


    grid.className =
        "visuals-grid";


    visuals.forEach(
        (visual, index) => {

            let title =
                `Visual ${index + 1}`;

            let type =
                "diagram";

            let description =
                "";


            if (
                visual &&
                typeof visual === "object"
            ) {

                title =
                    visual.title ||
                    visual.name ||
                    visual.heading ||
                    title;


                type =
                    String(
                        visual.type ||
                        visual.category ||
                        "diagram"
                    ).toLowerCase();


                description =
                    visual.description ||
                    visual.explanation ||
                    visual.text ||
                    visual.content ||
                    "";

            }

            else {

                description =
                    String(visual);
            }


            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "visual-card";


            card.innerHTML = `
                <div class="visual-header">

                    <div class="visual-icon">
                        ${getVisualIcon(type)}
                    </div>

                    <div>

                        <span class="visual-type">
                            ${escapeHtml(
                                capitalize(type)
                            )}
                        </span>

                        <h3>
                            ${escapeHtml(title)}
                        </h3>

                    </div>

                </div>
            `;


            card.appendChild(
                createVisualDiagram(
                    type,
                    description
                )
            );


            if (description) {

                const box =
                    document.createElement(
                        "div"
                    );


                box.className =
                    "visual-description";


                box.innerHTML = `
                    <strong>
                        Explanation:
                    </strong>

                    ${escapeHtml(
                        description
                    )}
                `;


                card.appendChild(
                    box
                );
            }


            grid.appendChild(
                card
            );
        }
    );


    container.appendChild(
        grid
    );
}


// =========================================================
// CREATE VISUAL DIAGRAM
// =========================================================

function createVisualDiagram(
    type,
    description
) {

    const wrapper =
        document.createElement(
            "div"
        );


    wrapper.className =
        "visual-diagram";


    if (
        type.includes("flow")
    ) {

        return createFlowVisual(
            wrapper,
            description
        );
    }


    if (
        type.includes("architecture")
    ) {

        return createArchitectureVisual(
            wrapper,
            description
        );
    }


    if (
        type.includes("timeline")
    ) {

        return createTimelineVisual(
            wrapper,
            description
        );
    }


    if (
        type.includes("comparison")
    ) {

        return createComparisonVisual(
            wrapper,
            description
        );
    }


    if (
        type.includes("code")
    ) {

        return createCodeVisual(
            wrapper,
            description
        );
    }


    if (
        type.includes("table")
    ) {

        return createTableVisual(
            wrapper,
            description
        );
    }


    return createDefaultVisual(
        wrapper,
        description
    );
}


// =========================================================
// FLOW VISUAL
// =========================================================

function createFlowVisual(
    wrapper,
    description
) {

    const flow =
        document.createElement(
            "div"
        );


    flow.className =
        "visual-flow";


    const steps =
        splitVisualText(
            description
        );


    const finalSteps =
        steps.length
            ? steps.slice(0, 6)
            : [
                "Start",
                "Process",
                "Result"
            ];


    finalSteps.forEach(
        (step, index) => {

            const box =
                document.createElement(
                    "div"
                );


            box.className =
                "visual-flow-box";


            box.textContent =
                cleanVisualText(
                    step
                );


            flow.appendChild(
                box
            );


            if (
                index <
                finalSteps.length - 1
            ) {

                const arrow =
                    document.createElement(
                        "div"
                    );


                arrow.className =
                    "visual-flow-arrow";


                arrow.textContent =
                    "↓";


                flow.appendChild(
                    arrow
                );
            }
        }
    );


    wrapper.appendChild(
        flow
    );


    return wrapper;
}


// =========================================================
// ARCHITECTURE VISUAL
// =========================================================

function createArchitectureVisual(
    wrapper,
    description
) {

    const architecture =
        document.createElement(
            "div"
        );


    architecture.className =
        "visual-architecture";


    const layers =
        splitVisualText(
            description
        );


    const finalLayers =
        layers.length
            ? layers.slice(0, 6)
            : [
                "Presentation Layer",
                "Application Layer",
                "Data Layer"
            ];


    finalLayers.forEach(
        (layer, index) => {

            const box =
                document.createElement(
                    "div"
                );


            box.className =
                "architecture-layer";


            const title =
                document.createElement(
                    "strong"
                );


            title.textContent =
                `Layer ${index + 1}`;


            const text =
                document.createElement(
                    "span"
                );


            text.textContent =
                cleanVisualText(
                    layer
                );


            box.appendChild(
                title
            );


            box.appendChild(
                text
            );


            architecture.appendChild(
                box
            );
        }
    );


    wrapper.appendChild(
        architecture
    );


    return wrapper;
}


// =========================================================
// TIMELINE VISUAL
// =========================================================

function createTimelineVisual(
    wrapper,
    description
) {

    const timeline =
        document.createElement(
            "div"
        );


    timeline.className =
        "visual-timeline";


    const steps =
        splitVisualText(
            description
        );


    const finalSteps =
        steps.length
            ? steps.slice(0, 6)
            : [
                "Step 1",
                "Step 2",
                "Step 3"
            ];


    finalSteps.forEach(
        (step, index) => {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "timeline-item";


            const number =
                document.createElement(
                    "div"
                );


            number.className =
                "timeline-number";


            number.textContent =
                index + 1;


            const content =
                document.createElement(
                    "div"
                );


            content.className =
                "timeline-content";


            const heading =
                document.createElement(
                    "strong"
                );


            heading.textContent =
                `Step ${index + 1}`;


            const text =
                document.createElement(
                    "span"
                );


            text.textContent =
                cleanVisualText(
                    step
                );


            content.appendChild(
                heading
            );


            content.appendChild(
                text
            );


            item.appendChild(
                number
            );


            item.appendChild(
                content
            );


            timeline.appendChild(
                item
            );
        }
    );


    wrapper.appendChild(
        timeline
    );


    return wrapper;
}


// =========================================================
// COMPARISON VISUAL
// =========================================================

function createComparisonVisual(
    wrapper,
    description
) {

    const comparison =
        document.createElement(
            "div"
        );


    comparison.className =
        "visual-comparison";


    let parts =
        splitComparisonText(
            description
        );


    if (
        parts.length < 2
    ) {

        parts = [
            description ||
            "Concept A",

            "Concept B"
        ];
    }


    comparison.appendChild(
        createComparisonColumn(
            "Concept A",
            parts[0]
        )
    );


    comparison.appendChild(
        createComparisonColumn(
            "Concept B",
            parts[1]
        )
    );


    wrapper.appendChild(
        comparison
    );


    return wrapper;
}


// =========================================================
// COMPARISON COLUMN
// =========================================================

function createComparisonColumn(
    title,
    text
) {

    const column =
        document.createElement(
            "div"
        );


    column.className =
        "comparison-column";


    column.innerHTML = `
        <h4>
            ${escapeHtml(title)}
        </h4>

        <ul>

            <li>
                ${escapeHtml(
                    cleanVisualText(text)
                )}
            </li>

        </ul>
    `;


    return column;
}


// =========================================================
// CODE VISUAL
// =========================================================

function createCodeVisual(
    wrapper,
    description
) {

    const codeBox =
        document.createElement(
            "div"
        );


    codeBox.className =
        "visual-code";


    const pre =
        document.createElement(
            "pre"
        );


    pre.textContent =
        description ||
        "// Code flow not available";


    codeBox.appendChild(
        pre
    );


    wrapper.appendChild(
        codeBox
    );


    return wrapper;
}


// =========================================================
// TABLE VISUAL
// =========================================================

function createTableVisual(
    wrapper,
    description
) {

    const table =
        document.createElement(
            "div"
        );


    table.className =
        "visual-comparison";


    const items =
        splitVisualText(
            description
        );


    const middle =
        Math.ceil(
            items.length / 2
        );


    const leftItems =
        items.slice(
            0,
            middle
        );


    const rightItems =
        items.slice(
            middle
        );


    const left =
        document.createElement(
            "div"
        );


    left.className =
        "comparison-column";


    left.innerHTML = `
        <h4>Key</h4>

        <ul>
            ${
                leftItems.length
                    ? leftItems.map(
                        item => `
                            <li>
                                ${escapeHtml(
                                    cleanVisualText(item)
                                )}
                            </li>
                        `
                    ).join("")
                    : `
                        <li>
                            Information
                        </li>
                    `
            }
        </ul>
    `;


    const right =
        document.createElement(
            "div"
        );


    right.className =
        "comparison-column";


    right.innerHTML = `
        <h4>Details</h4>

        <ul>
            ${
                rightItems.length
                    ? rightItems.map(
                        item => `
                            <li>
                                ${escapeHtml(
                                    cleanVisualText(item)
                                )}
                            </li>
                        `
                    ).join("")
                    : `
                        <li>
                            Details
                        </li>
                    `
            }
        </ul>
    `;


    table.appendChild(
        left
    );


    table.appendChild(
        right
    );


    wrapper.appendChild(
        table
    );


    return wrapper;
}


// =========================================================
// DEFAULT VISUAL
// =========================================================

function createDefaultVisual(
    wrapper,
    description
) {

    const diagram =
        document.createElement(
            "div"
        );


    const parts =
        splitVisualText(
            description
        );


    const finalParts =
        parts.length
            ? parts.slice(0, 5)
            : [
                "Main Concept",
                "Process",
                "Result"
            ];


    finalParts.forEach(
        (part, index) => {

            const node =
                document.createElement(
                    "div"
                );


            node.className =
                "visual-node";


            node.textContent =
                cleanVisualText(
                    part
                );


            diagram.appendChild(
                node
            );


            if (
                index <
                finalParts.length - 1
            ) {

                const connector =
                    document.createElement(
                        "div"
                    );


                connector.className =
                    "visual-connector";


                connector.textContent =
                    "↓";


                diagram.appendChild(
                    connector
                );
            }
        }
    );


    wrapper.appendChild(
        diagram
    );


    return wrapper;
}


// =========================================================
// SPLIT VISUAL TEXT
// =========================================================

function splitVisualText(
    text
) {

    if (!text) {
        return [];
    }


    if (
        typeof text === "object"
    ) {

        if (
            Array.isArray(text)
        ) {

            return text
                .map(item => {

                    if (
                        item &&
                        typeof item === "object"
                    ) {

                        return (
                            item.text ||
                            item.title ||
                            item.name ||
                            item.description ||
                            ""
                        );
                    }

                    return String(item);
                })
                .filter(Boolean);
        }


        return [];
    }


    const value =
        String(text)
            .replace(/→/g, "|")
            .replace(/->/g, "|")
            .replace(/⇒/g, "|")
            .replace(/;/g, "|")
            .replace(/\n+/g, "|");


    let parts =
        value
            .split("|")
            .map(
                item =>
                    item.trim()
            )
            .filter(Boolean);


    if (
        parts.length === 1
    ) {

        parts =
            value
                .split(/[.!?]+/)
                .map(
                    item =>
                        item.trim()
                )
                .filter(Boolean);
    }


    return parts;
}


// =========================================================
// SPLIT COMPARISON
// =========================================================

function splitComparisonText(
    text
) {

    if (!text) {
        return [];
    }


    const value =
        String(text);


    const separators = [
        /\s+vs\.?\s+/i,
        /\s+versus\s+/i,
        /\s+compared\s+with\s+/i,
        /\s+compared\s+to\s+/i
    ];


    for (
        const separator of separators
    ) {

        if (
            separator.test(value)
        ) {

            return value
                .split(separator)
                .map(
                    item =>
                        item.trim()
                )
                .filter(Boolean);
        }
    }


    return splitVisualText(
        value
    );
}


// =========================================================
// CLEAN VISUAL TEXT
// =========================================================

function cleanVisualText(
    text
) {

    if (!text) {
        return "";
    }


    return String(text)
        .replace(
            /^[-•*]\s*/,
            ""
        )
        .replace(
            /^\d+\.\s*/,
            ""
        )
        .trim();
}


// =========================================================
// VISUAL ICON
// =========================================================

function getVisualIcon(
    type
) {

    const value =
        String(type)
            .toLowerCase();


    if (
        value.includes("flow")
    ) {
        return "🔄";
    }


    if (
        value.includes("architecture")
    ) {
        return "🏗️";
    }


    if (
        value.includes("timeline")
    ) {
        return "⏱️";
    }


    if (
        value.includes("comparison")
    ) {
        return "⚖️";
    }


    if (
        value.includes("code")
    ) {
        return "💻";
    }


    if (
        value.includes("table")
    ) {
        return "📊";
    }


    if (
        value.includes("mind")
    ) {
        return "🧠";
    }


    if (
        value.includes("diagram")
    ) {
        return "📐";
    }


    return "🖼️";
}


// =========================================================
// CONCEPTS
// =========================================================

function renderConcepts(
    concepts
) {

    const container =
        document.getElementById(
            "concepts"
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";


    if (
        typeof concepts === "string"
    ) {

        concepts =
            splitVisualText(
                concepts
            );
    }


    if (
        !Array.isArray(concepts) ||
        !concepts.length
    ) {

        container.innerHTML = `
            <div class="empty-content">
                No important concepts available.
            </div>
        `;

        return;
    }


    const grid =
        document.createElement(
            "div"
        );


    grid.className =
        "concepts-grid";


    concepts.forEach(
        (concept, index) => {

            let name =
                `Concept ${index + 1}`;

            let explanation =
                "";

            let example =
                "";

            let practical =
                "";


            if (
                concept &&
                typeof concept === "object"
            ) {

                name =
                    concept.name ||
                    concept.title ||
                    concept.heading ||
                    name;


                explanation =
                    concept.explanation ||
                    concept.description ||
                    concept.text ||
                    "";


                example =
                    concept.example ||
                    "";


                practical =
                    concept.practical_example ||
                    concept.practicalExample ||
                    "";
            }

            else {

                explanation =
                    String(concept);
            }


            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "concept-card";


            card.innerHTML = `

                <h3>
                    ${index + 1}.
                    ${escapeHtml(name)}
                </h3>

                ${
                    explanation
                        ? `
                            <div class="concept-section">

                                <h4>
                                    Explanation
                                </h4>

                                <p>
                                    ${escapeHtml(
                                        explanation
                                    )}
                                </p>

                            </div>
                        `
                        : ""
                }

                ${
                    example
                        ? `
                            <div class="concept-section">

                                <h4>
                                    Example
                                </h4>

                                <p>
                                    ${escapeHtml(
                                        example
                                    )}
                                </p>

                            </div>
                        `
                        : ""
                }

                ${
                    practical
                        ? `
                            <div class="concept-section">

                                <h4>
                                    Practical Example
                                </h4>

                                <p>
                                    ${escapeHtml(
                                        practical
                                    )}
                                </p>

                            </div>
                        `
                        : ""
                }
            `;


            grid.appendChild(
                card
            );
        }
    );


    container.appendChild(
        grid
    );
}


// =========================================================
// PRACTICAL EXAMPLES
// =========================================================

function renderPracticalExamples(
    examples
) {

    const container =
        document.getElementById(
            "practicalExamples"
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";


    if (
        typeof examples === "string"
    ) {

        examples =
            splitVisualText(
                examples
            );
    }


    if (
        !Array.isArray(examples) ||
        !examples.length
    ) {

        container.innerHTML = `
            <div class="empty-content">
                No practical examples available.
            </div>
        `;

        return;
    }


    const grid =
        document.createElement(
            "div"
        );


    grid.className =
        "examples-grid";


    examples.forEach(
        (example, index) => {

            let title =
                `Example ${index + 1}`;

            let explanation =
                "";


            if (
                example &&
                typeof example === "object"
            ) {

                title =
                    example.title ||
                    example.name ||
                    example.heading ||
                    title;


                explanation =
                    example.explanation ||
                    example.description ||
                    example.example ||
                    example.text ||
                    example.content ||
                    "";

            }

            else {

                explanation =
                    String(example);
            }


            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "example-card";


            card.innerHTML = `
                <h3>
                    💡 ${escapeHtml(title)}
                </h3>

                <p>
                    ${escapeHtml(
                        explanation
                    )}
                </p>
            `;


            grid.appendChild(
                card
            );
        }
    );


    container.appendChild(
        grid
    );
}


// =========================================================
// INTERVIEW QUESTIONS
// =========================================================

function renderInterviewQuestions(
    questions
) {

    const container =
        document.getElementById(
            "interviewQuestions"
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";


    if (
        typeof questions === "string"
    ) {

        questions =
            splitVisualText(
                questions
            );
    }


    if (
        !Array.isArray(questions) ||
        !questions.length
    ) {

        container.innerHTML = `
            <div class="empty-content">
                No interview questions available.
            </div>
        `;

        return;
    }


    const wrapper =
        document.createElement(
            "div"
        );


    wrapper.className =
        "questions-container";


    questions.forEach(
        (item, index) => {

            let question =
                "";

            let answer =
                "";

            let difficulty =
                "Basic";


            if (
                item &&
                typeof item === "object"
            ) {

                question =
                    item.question ||
                    item.q ||
                    item.title ||
                    item.text ||
                    item.heading ||
                    "";


                answer =
                    item.answer ||
                    item.explanation ||
                    item.solution ||
                    "";


                difficulty =
                    item.difficulty ||
                    "Basic";

            }

            else {

                question =
                    String(item);
            }


            if (!question.trim()) {
                return;
            }


            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "question-card";


            card.innerHTML = `

                <div class="question-top">

                    <span class="question-number">
                        Question ${index + 1}
                    </span>

                    <span class="difficulty">
                        ${escapeHtml(
                            capitalize(
                                difficulty
                            )
                        )}
                    </span>

                </div>

                <h3>
                    ${escapeHtml(question)}
                </h3>

                <div class="answer-box">

                    <span class="answer-label">
                        Answer
                    </span>

                    <p>
                        ${
                            answer
                                ? escapeHtml(answer)
                                : "Answer not available."
                        }
                    </p>

                </div>
            `;


            wrapper.appendChild(
                card
            );
        }
    );


    container.appendChild(
        wrapper
    );
}


// =========================================================
// CROSS QUESTIONS
// =========================================================

function renderCrossQuestions(
    questions
) {

    const container =
        document.getElementById(
            "crossQuestions"
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";


    if (
        typeof questions === "string"
    ) {

        questions =
            splitVisualText(
                questions
            );
    }


    if (
        !Array.isArray(questions) ||
        !questions.length
    ) {

        container.innerHTML = `
            <div class="empty-content">
                No cross questions available.
            </div>
        `;

        return;
    }


    const wrapper =
        document.createElement(
            "div"
        );


    wrapper.className =
        "questions-container";


    questions.forEach(
        (item, index) => {

            let question =
                "";

            let answer =
                "";

            let followUp =
                "";


            if (
                item &&
                typeof item === "object"
            ) {

                question =
                    item.question ||
                    item.q ||
                    item.title ||
                    item.text ||
                    item.heading ||
                    "";


                answer =
                    item.answer ||
                    item.explanation ||
                    item.solution ||
                    "";


                followUp =
                    item.follow_up ||
                    item.followUp ||
                    item.next_question ||
                    item.nextQuestion ||
                    "";

            }

            else {

                question =
                    String(item);
            }


            if (!question.trim()) {
                return;
            }


            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "question-card cross-question-card";


            card.innerHTML = `

                <div class="question-top">

                    <span class="question-number">
                        Cross Question ${index + 1}
                    </span>

                    <span class="question-type">
                        Interview Follow-up
                    </span>

                </div>

                <h3>
                    ${escapeHtml(question)}
                </h3>

                ${
                    answer
                        ? `
                            <div class="answer-box">

                                <span class="answer-label">
                                    Answer
                                </span>

                                <p>
                                    ${escapeHtml(answer)}
                                </p>

                            </div>
                        `
                        : ""
                }

                ${
                    followUp
                        ? `
                            <div class="follow-up-box">

                                <span class="follow-up-label">
                                    Possible Follow-up
                                </span>

                                <p>
                                    ${escapeHtml(followUp)}
                                </p>

                            </div>
                        `
                        : ""
                }
            `;


            wrapper.appendChild(
                card
            );
        }
    );


    container.appendChild(
        wrapper
    );
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


    const parsedItems =
        parseBulletList(
            items
        );


    if (!parsedItems.length) {

        container.innerHTML = `
            <div class="empty-content">
                ${escapeHtml(
                    emptyMessage
                )}
            </div>
        `;

        return;
    }


    const ul =
        document.createElement(
            "ul"
        );


    ul.className =
        "content-list";


    parsedItems.forEach(
        item => {

            const li =
                document.createElement(
                    "li"
                );


            li.textContent =
                String(item);


            ul.appendChild(
                li
            );
        }
    );


    container.appendChild(
        ul
    );
}


// =========================================================
// PARSE BULLET LIST
// =========================================================

function parseBulletList(
    value
) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return [];
    }


    if (
        Array.isArray(value)
    ) {

        return value
            .flatMap(
                item => {

                    if (
                        item &&
                        typeof item === "object"
                    ) {

                        return [
                            item.text ||
                            item.point ||
                            item.title ||
                            item.name ||
                            item.description ||
                            ""
                        ];
                    }


                    return [
                        String(item)
                    ];
                }
            )
            .map(
                item =>
                    String(item)
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


    return String(value)
        .replace(
            /\u2022/g,
            "\n"
        )
        .split(
            /\r?\n+/
        )
        .map(
            line =>
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


    if (
        value === null ||
        value === undefined ||
        String(value).trim() === ""
    ) {

        element.innerHTML = `
            <div class="empty-content">
                No information available.
            </div>
        `;

        return;
    }


    if (
        elementId === "shortNotes"
    ) {

        let points = [];


        if (
            Array.isArray(value)
        ) {

            points =
                parseBulletList(
                    value
                );

        }

        else {

            let text =
                String(value)
                    .replace(
                        /\r/g,
                        ""
                    )
                    .trim();


            text =
                text.replace(
                    /\u2022/g,
                    "\n• "
                );


            points =
                text
                    .split(
                        /\r?\n+/
                    )
                    .map(
                        item =>
                            item
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


            if (
                points.length <= 1
            ) {

                points =
                    splitShortNotesIntoPoints(
                        text
                    );
            }
        }


        if (points.length) {

            renderShortNotes(
                element,
                points
            );

            return;
        }
    }


    element.textContent =
        String(value);
}


// =========================================================
// SPLIT SHORT NOTES
// =========================================================

function splitShortNotesIntoPoints(
    text
) {

    if (!text) {
        return [];
    }


    const value =
        String(text)
            .trim();


    if (
        value.includes("•")
    ) {

        const parts =
            value
                .split("•")
                .map(
                    item =>
                        item.trim()
                )
                .filter(Boolean);


        if (
            parts.length > 1
        ) {

            return parts;
        }
    }


    const numberedParts =
        value
            .split(
                /(?=\b\d+\.\s+)/
            )
            .map(
                item =>
                    item
                        .replace(
                            /^\d+\.\s*/,
                            ""
                        )
                        .trim()
            )
            .filter(Boolean);


    if (
        numberedParts.length > 1
    ) {

        return numberedParts;
    }


    let sentences =
        value
            .split(
                /(?<=[.!?])\s+(?=[A-Z0-9])/
            )
            .map(
                item =>
                    item.trim()
            )
            .filter(Boolean);


    if (
        sentences.length <= 1
    ) {

        sentences =
            value
                .split(
                    /(?<=[.!?])\s+/
                )
                .map(
                    item =>
                        item.trim()
                )
                .filter(Boolean);
    }


    return sentences;
}


// =========================================================
// RENDER SHORT NOTES
// =========================================================

function renderShortNotes(
    element,
    points
) {

    element.innerHTML = "";


    const ul =
        document.createElement(
            "ul"
        );


    ul.className =
        "short-notes-list";


    points.forEach(
        point => {

            const li =
                document.createElement(
                    "li"
                );


            li.textContent =
                String(point)
                    .trim();


            ul.appendChild(
                li
            );
        }
    );


    element.appendChild(
        ul
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

function formatDate(
    dateValue
) {

    if (!dateValue) {
        return "";
    }


    try {

        const date =
            new Date(
                dateValue
            );


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

    }

    catch {

        return String(
            dateValue
        );
    }
}


// =========================================================
// CAPITALIZE
// =========================================================

function capitalize(
    value
) {

    if (!value) {
        return "";
    }


    const text =
        String(value);


    return (
        text.charAt(0).toUpperCase() +
        text.slice(1)
    );
}


// =========================================================
// HTML ESCAPE
// =========================================================

function escapeHtml(
    value
) {

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
// =========================================================
// ASK QUESTION / SEARCH ABOUT VIDEO
// =========================================================

function setupAskQuestion(videoId) {

    if (!videoId) {
        return;
    }


    // =====================================================
    // CREATE ASK QUESTION CARD
    // =====================================================

    let form =
        document.getElementById(
            "askQuestionForm"
        );


    if (!form) {

        const card =
            document.createElement(
                "div"
            );


        card.id =
            "askQuestionCard";


        card.style.width =
            "100%";

        card.style.maxWidth =
            "900px";

        card.style.margin =
            "24px auto";

        card.style.padding =
            "24px";

        card.style.background =
            "#ffffff";

        card.style.border =
            "1px solid #e5e7eb";

        card.style.borderRadius =
            "16px";

        card.style.boxShadow =
            "0 6px 20px rgba(15,23,42,0.08)";

        card.style.boxSizing =
            "border-box";


        card.innerHTML = `

            <div style="
                margin-bottom:16px;
            ">

                <h2 style="
                    margin:0 0 6px;
                    font-size:21px;
                    color:#111827;
                ">
                    🔍 Have a question about this video?
                </h2>

                <p style="
                    margin:0;
                    color:#6b7280;
                    font-size:14px;
                    line-height:1.5;
                ">
                    Ask anything about this video and AI will answer from the video content.
                </p>

            </div>


            <form id="askQuestionForm">

                <textarea
                    id="questionInput"
                    rows="3"
                    placeholder="Type your question here..."
                    style="
                        width:100%;
                        box-sizing:border-box;
                        padding:12px 14px;
                        border:1px solid #d1d5db;
                        border-radius:10px;
                        resize:vertical;
                        font-family:inherit;
                        font-size:14px;
                        outline:none;
                    "
                ></textarea>


                <div style="
                    display:flex;
                    align-items:center;
                    gap:12px;
                    margin-top:12px;
                ">

                    <button
                        type="submit"
                        id="askQuestionButton"
                        style="
                            border:none;
                            border-radius:9px;
                            padding:10px 18px;
                            background:#4f46e5;
                            color:#ffffff;
                            font-size:14px;
                            font-weight:600;
                            cursor:pointer;
                        "
                    >
                        🔍 Search
                    </button>


                    <span
                        id="askQuestionMessage"
                        style="
                            font-size:13px;
                            color:#6b7280;
                        "
                    ></span>

                </div>

            </form>


            <div
                id="answersContainer"
                style="
                    margin-top:20px;
                "
            ></div>

        `;


        // =================================================
        // INSERT AFTER QUICK REVISION
        // =================================================

        const quickRevision =
            document.getElementById(
                "quickRevision"
            );


        if (
            quickRevision &&
            quickRevision.closest(
                ".notes-card"
            )
        ) {

            quickRevision
                .closest(
                    ".notes-card"
                )
                .insertAdjacentElement(
                    "afterend",
                    card
                );

        }

        else {

            const notesPage =
                document.querySelector(
                    ".notes-page"
                ) ||
                document.body;


            notesPage.appendChild(
                card
            );
        }


        form =
            document.getElementById(
                "askQuestionForm"
            );
    }


    const input =
        document.getElementById(
            "questionInput"
        );


    const button =
        document.getElementById(
            "askQuestionButton"
        );


    const message =
        document.getElementById(
            "askQuestionMessage"
        );


    const answersContainer =
        document.getElementById(
            "answersContainer"
        );


    if (
        !form ||
        !input ||
        !button ||
        !answersContainer
    ) {

        return;
    }


    // =====================================================
    // PREVENT DUPLICATE EVENT LISTENER
    // =====================================================

    if (
        form.dataset.askQuestionReady ===
        "true"
    ) {

        return;
    }


    form.dataset.askQuestionReady =
        "true";


    // =====================================================
    // SUBMIT QUESTION
    // =====================================================

    form.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            const question =
                input.value.trim();


            if (!question) {

                if (message) {

                    message.textContent =
                        "Please enter your question.";

                    message.style.color =
                        "#dc2626";
                }


                input.focus();

                return;
            }


            if (
                question.length >
                1000
            ) {

                if (message) {

                    message.textContent =
                        "Question must be 1000 characters or less.";

                    message.style.color =
                        "#dc2626";
                }

                return;
            }


            try {

                // =========================================
                // LOADING
                // =========================================

                button.disabled =
                    true;


                button.style.opacity =
                    "0.7";


                button.textContent =
                    "Searching...";


                if (message) {

                    message.textContent =
                        "AI is finding the answer...";

                    message.style.color =
                        "#6b7280";
                }


                // =========================================
                // API REQUEST
                // =========================================

                const response =
                    await authorizedFetch(
                        "/api/ai/ask",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify({
                                    video_id:
                                        videoId,

                                    question:
                                        question
                                })
                        }
                    );


                if (!response) {
                    return;
                }


                const data =
                    await response.json();


                console.log(
                    "ASK QUESTION RESPONSE:",
                    data
                );


                // =========================================
                // ERROR
                // =========================================

                if (
                    !response.ok ||
                    !data.success
                ) {

                    if (message) {

                        message.textContent =
                            data.error ||
                            "Unable to get answer.";

                        message.style.color =
                            "#dc2626";
                    }

                    return;
                }


                // =========================================
                // SUCCESS
                // =========================================

                if (message) {

                    message.textContent =
                        "Answer found.";

                    message.style.color =
                        "#16a34a";
                }


                // =========================================
                // ANSWER CARD
                // =========================================

                const answerCard =
                    document.createElement(
                        "div"
                    );


                answerCard.style.marginTop =
                    "16px";


                answerCard.style.padding =
                    "16px";


                answerCard.style.background =
                    "#f8fafc";


                answerCard.style.border =
                    "1px solid #e2e8f0";


                answerCard.style.borderRadius =
                    "12px";


                // =========================================
                // QUESTION
                // =========================================

                const questionElement =
                    document.createElement(
                        "div"
                    );


                questionElement.style.fontWeight =
                    "700";


                questionElement.style.color =
                    "#111827";


                questionElement.style.marginBottom =
                    "10px";


                questionElement.textContent =
                    "❓ " +
                    question;


                // =========================================
                // ANSWER
                // =========================================

                const answerElement =
                    document.createElement(
                        "div"
                    );


                answerElement.style.padding =
                    "12px";


                answerElement.style.background =
                    "#ffffff";


                answerElement.style.borderRadius =
                    "10px";


                answerElement.style.border =
                    "1px solid #e5e7eb";


                answerElement.style.color =
                    "#374151";


                answerElement.style.fontSize =
                    "14px";


                answerElement.style.lineHeight =
                    "1.7";


                answerElement.style.whiteSpace =
                    "pre-wrap";


                answerElement.textContent =
                    data.answer ||
                    "No answer available.";


                // =========================================
                // ADD QUESTION + ANSWER
                // =========================================
answerCard.appendChild(
    questionElement
);

answerCard.appendChild(
    answerElement
);

// =====================================================
// DELETE ANSWER BUTTON
// =====================================================

const deleteButton =
    document.createElement(
        "button"
    );

deleteButton.type =
    "button";

deleteButton.textContent =
    "🗑️ Delete";

deleteButton.style.marginTop =
    "12px";

deleteButton.style.padding =
    "8px 14px";

deleteButton.style.border =
    "none";

deleteButton.style.borderRadius =
    "8px";

deleteButton.style.background =
    "#fee2e2";

deleteButton.style.color =
    "#dc2626";

deleteButton.style.fontSize =
    "13px";

deleteButton.style.fontWeight =
    "600";

deleteButton.style.cursor =
    "pointer";

deleteButton.addEventListener(
    "click",
    () => {

        answerCard.remove();

    }
);

answerCard.appendChild(
    deleteButton
);

answersContainer.appendChild(
    answerCard
);


                // =========================================
                // CLEAR INPUT
                // =========================================

                input.value =
                    "";


                input.focus();

            }

            catch (error) {

                console.error(
                    "ASK QUESTION ERROR:",
                    error
                );


                if (message) {

                    message.textContent =
                        "Something went wrong while getting the answer.";

                    message.style.color =
                        "#dc2626";
                }

            }

            finally {

                button.disabled =
                    false;


                button.style.opacity =
                    "1";


                button.textContent =
                    "🔍 Search";
            }

        }
    );


    // =====================================================
    // ENTER = SEARCH
    // SHIFT + ENTER = NEW LINE
    // =====================================================

    input.addEventListener(
        "keydown",
        (event) => {

            if (
                event.key === "Enter" &&
                !event.shiftKey
            ) {

                event.preventDefault();

                form.requestSubmit();
            }
        }
    );
}