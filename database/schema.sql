CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE videos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    youtube_url VARCHAR(500) NOT NULL,
    video_title VARCHAR(255),
    thumbnail_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_videos_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

CREATE TABLE notes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    video_id INT NOT NULL,
    summary TEXT,
    detailed_notes LONGTEXT,
    key_points TEXT,
    visual_notes LONGTEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_notes_video
        FOREIGN KEY (video_id)
        REFERENCES videos(id)
        ON DELETE CASCADE
);

CREATE TABLE revision_questions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    notes_id INT NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    question_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_questions_notes
        FOREIGN KEY (notes_id)
        REFERENCES notes(id)
        ON DELETE CASCADE
);