from flask import Blueprint, request, jsonify
import jwt
from datetime import datetime, timedelta

from config import Config


auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()

    username = data.get("username")
    password = data.get("password")

    if username != "admin" or password != "admin123":
        return jsonify({
            "error": "Invalid username or password"
        }), 401

    payload = {
        "username": username,
        "exp": datetime.utcnow() + timedelta(hours=1)
    }

    token = jwt.encode(
        payload,
        Config.JWT_SECRET_KEY,
        algorithm="HS256"
    )

    return jsonify({
        "access_token": token
    }), 200