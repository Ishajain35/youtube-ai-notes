from flask import Flask, send_from_directory

from routes.health_routes import health_bp
from routes.ai_routes import ai_bp
from routes.auth_routes import auth_bp
from routes.video_routes import video_bp


app = Flask(__name__)


# ===============================
# API ROUTES
# ===============================

app.register_blueprint(health_bp)
app.register_blueprint(ai_bp)
app.register_blueprint(auth_bp)
app.register_blueprint(video_bp)


# ===============================
# FRONTEND
# ===============================

@app.route("/")
def home():
    return send_from_directory("frontend", "index.html")


@app.route("/<path:filename>")
def frontend_files(filename):
    return send_from_directory("frontend", filename)


# ===============================
# RUN APPLICATION
# ===============================

if __name__ == "__main__":
    app.run(debug=True)