from flask import Flask

from routes.health_routes import health_bp
from routes.ai_routes import ai_bp
from routes.auth_routes import auth_bp


app = Flask(__name__)

app.register_blueprint(health_bp)
app.register_blueprint(ai_bp)
app.register_blueprint(auth_bp)


if __name__ == "__main__":
    app.run(debug=True)