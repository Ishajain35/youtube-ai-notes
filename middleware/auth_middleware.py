from functools import wraps

import jwt
from flask import request, jsonify

from config import Config


def token_required(f):

    @wraps(f)
    def decorated(*args, **kwargs):

        auth_header = request.headers.get("Authorization")

        # Authorization header missing
        if not auth_header:
            return jsonify({
                "success": False,
                "error": "Authorization token is required"
            }), 401

        # Check Bearer format
        parts = auth_header.split(" ")

        if len(parts) != 2 or parts[0] != "Bearer":
            return jsonify({
                "success": False,
                "error": "Authorization header must be in Bearer <token> format"
            }), 401

        token = parts[1]

        try:
            payload = jwt.decode(
                token,
                Config.JWT_SECRET_KEY,
                algorithms=["HS256"]
            )

            request.user_id = payload["user_id"]

        except jwt.ExpiredSignatureError:

            return jsonify({
                "success": False,
                "error": "Token has expired"
            }), 401

        except jwt.InvalidTokenError:

            return jsonify({
                "success": False,
                "error": "Invalid token"
            }), 401

        return f(*args, **kwargs)

    return decorated