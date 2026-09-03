# YouTube AI Notes

An AI-powered Flask application that converts YouTube videos into clear and structured study notes using YouTube transcripts and Gemini AI.

## 🚀 Features

* User registration and login
* JWT-based authentication
* YouTube video information extraction
* YouTube transcript extraction
* AI-generated study notes
* English summaries
* Important key points
* Concepts explained simply
* Examples from the video
* Quick revision notes
* Revision and interview questions
* MySQL database integration
* Saved video history
* Fetch notes for a specific video
* Delete saved videos
* Protected APIs using JWT
* Responsive web frontend

## 🛠️ Technologies Used

### Backend

* Python
* Flask
* MySQL
* PyJWT
* Gemini AI
* yt-dlp
* YouTube Transcript API

### Frontend

* HTML
* CSS
* JavaScript

## 📁 Project Structure

```text
youtube-ai-notes/
│
├── app.py
├── config.py
├── requirements.txt
├── .env
├── .env.example
├── .gitignore
├── README.md
│
├── database/
│   ├── __init__.py
│   ├── db.py
│   └── schema.sql
│
├── middleware/
│   └── auth_middleware.py
│
├── routes/
│   ├── health_routes.py
│   ├── auth_routes.py
│   ├── ai_routes.py
│   └── video_routes.py
│
├── services/
│   ├── __init__.py
│   ├── youtube_service.py
│   ├── transcript_service.py
│   └── ai_service.py
│
└── frontend/
    ├── index.html
    ├── register.html
    ├── dashboard.html
    ├── notes.html
    ├── app.js
    └── style.css
```

## ⚙️ Installation

### 1. Clone the repository

```bash
git clone https://github.com/Ishajain35/youtube-ai-notes.git
cd youtube-ai-notes
```

### 2. Create a virtual environment

```bash
python -m venv venv
```

### 3. Activate the virtual environment

#### Windows PowerShell

```powershell
venv\Scripts\Activate.ps1
```

### 4. Install dependencies

```bash
pip install -r requirements.txt
```

## 🔐 Environment Variables

Create a `.env` file in the project root.

Use `.env.example` as a reference.

Example:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=youtube_ai_notes

JWT_SECRET_KEY=your_jwt_secret_key

GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=your_gemini_model
```

**Never commit the real `.env` file or API keys to GitHub.**

## 🗄️ Database Setup

Create the MySQL database:

```sql
CREATE DATABASE youtube_ai_notes;
```

Then execute:

```text
database/schema.sql
```

The database contains the following main tables:

* `users`
* `videos`
* `notes`
* `revision_questions`

## ▶️ Run the Application

Start the Flask server:

```bash
python app.py
```

The application runs at:

```text
http://127.0.0.1:5000
```

Open the application in your browser.

## 🔑 API Endpoints

### Authentication

#### Register

```text
POST /api/auth/register
```

Request:

```json
{
    "name": "Your Name",
    "email": "your@email.com",
    "password": "your_password"
}
```

#### Login

```text
POST /api/auth/login
```

Request:

```json
{
    "email": "your@email.com",
    "password": "your_password"
}
```

The login API returns a JWT access token.

---

### AI Notes

#### Generate Notes

```text
POST /api/ai/notes
```

Header:

```text
Authorization: Bearer <JWT_TOKEN>
```

Request:

```json
{
    "youtube_url": "https://www.youtube.com/watch?v=VIDEO_ID"
}
```

The API processes the YouTube video and generates:

* Summary
* Key points
* Detailed notes
* Concepts
* Examples
* Quick revision
* Revision questions

The generated data is saved in MySQL.

---

### Videos

#### Get Saved Videos

```text
GET /api/videos
```

Header:

```text
Authorization: Bearer <JWT_TOKEN>
```

Returns videos saved by the logged-in user.

#### Get Video Notes

```text
GET /api/videos/<video_id>/notes
```

Header:

```text
Authorization: Bearer <JWT_TOKEN>
```

Returns:

* Video information
* Summary
* Key points
* Detailed notes
* Revision questions

#### Delete Video

```text
DELETE /api/videos/<video_id>
```

Header:

```text
Authorization: Bearer <JWT_TOKEN>
```

Deletes the selected video and its related data according to the database relationship configuration.

## 🔒 Authentication

The application uses JSON Web Tokens (JWT) to protect authenticated API endpoints.

Authenticated requests must include:

```text
Authorization: Bearer <JWT_TOKEN>
```

Requests with missing, invalid, expired, or malformed tokens are rejected.

## 🧠 AI Processing Flow

```text
YouTube URL
     ↓
Extract Video Information
     ↓
Extract Transcript
     ↓
Send Transcript to Gemini AI
     ↓
Generate Study Notes
     ↓
Generate Revision Questions
     ↓
Save Data in MySQL
     ↓
Return JSON Response
     ↓
Display Notes in Frontend
```

## 🖥️ Application Flow

```text
User
 ↓
Register / Login
 ↓
JWT Authentication
 ↓
Dashboard
 ↓
Enter YouTube URL
 ↓
Generate AI Notes
 ↓
View Structured Notes
 ↓
Save Video History
 ↓
View / Delete Saved Videos
```

## 🧪 API Testing

The APIs were tested using PowerShell and `Invoke-RestMethod`.

Tested scenarios include:

* Successful registration
* Successful login
* JWT authentication
* Invalid JWT token
* Invalid Authorization header
* YouTube video processing
* Transcript extraction
* AI note generation
* Saved videos retrieval
* Notes retrieval
* Video deletion
* Database cascade deletion

## 🔮 Future Improvements

* Search saved videos
* Notes editing
* Download notes as PDF
* Dark mode
* Better transcript language handling
* Refresh token authentication
* Pagination for saved videos
* Improved AI personalization
* Multiple language support

## 👩‍💻 Author

**Isha Jain**

YouTube AI Notes — Flask + MySQL + Gemini AI
