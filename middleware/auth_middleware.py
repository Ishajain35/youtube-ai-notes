from functools import wraps

import jwt
from flask import request, jsonify

from config import Config


def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):

        auth_header = request.headers.get("Authorization")

        if not auth_header:
            return jsonify({
                "error": "Authorization token is required"
            }), 401

        try:
            token = auth_header.split(" ")[1]

            payload = jwt.decode(
                token,
                Config.JWT_SECRET_KEY,
                algorithms=["HS256"]
            )

        except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
            return jsonify({
                "error": "Invalid or expired token"
            }), 401

        return f(*args, **kwargs)

    return decorated