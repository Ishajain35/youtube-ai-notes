
from flask import Blueprint, request, jsonify
import jwt
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash, check_password_hash

from config import Config
from database.db import get_db_connection


auth_bp = Blueprint(
    "auth",
    __name__,
    url_prefix="/api/auth"
)


# =========================================================
# REGISTER
# =========================================================

@auth_bp.route("/register", methods=["POST"])
def register():

    data = request.get_json(silent=True)

    if not data:
        return jsonify({
            "success": False,
            "error": "Request body must contain valid JSON"
        }), 400

    name = data.get("name")
    email = data.get("email")
    password = data.get("password")

    if not name or not email or not password:
        return jsonify({
            "success": False,
            "error": "name, email and password are required"
        }), 400

    name = name.strip()
    email = email.strip().lower()

    connection = None
    cursor = None

    try:

        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Check existing email
        cursor.execute(
            "SELECT id FROM users WHERE email = %s",
            (email,)
        )

        existing_user = cursor.fetchone()

        if existing_user:
            return jsonify({
                "success": False,
                "error": "Email already registered"
            }), 409

        # Hash password
        password_hash = generate_password_hash(password)

        # Insert user
        cursor.execute(
            """
            INSERT INTO users
            (name, email, password_hash)
            VALUES (%s, %s, %s)
            """,
            (name, email, password_hash)
        )

        connection.commit()

        return jsonify({
            "success": True,
            "message": "User registered successfully"
        }), 201

    except Exception as e:

        if connection:
            connection.rollback()

        print("REGISTRATION ERROR:", e)

        return jsonify({
            "success": False,
            "error": "Something went wrong during registration"
        }), 500

    finally:

        if cursor:
            cursor.close()

        if connection:
            connection.close()


# =========================================================
# LOGIN
# =========================================================

@auth_bp.route("/login", methods=["POST"])
def login():

    data = request.get_json(silent=True)

    if not data:
        return jsonify({
            "success": False,
            "error": "Request body must contain valid JSON"
        }), 400

    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({
            "success": False,
            "error": "email and password are required"
        }), 400

    email = email.strip().lower()

    connection = None
    cursor = None

    try:

        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # =====================================================
        # FIND USER
        # =====================================================

        cursor.execute(
            """
            SELECT id, name, email, password_hash
            FROM users
            WHERE email = %s
            """,
            (email,)
        )

        user = cursor.fetchone()

        if not user:

            print(
                "LOGIN DEBUG: User not found:",
                email
            )

            return jsonify({
                "success": False,
                "error": "Invalid email or password"
            }), 401

        # =====================================================
        # CHECK PASSWORD
        # =====================================================

        password_valid = check_password_hash(
            user["password_hash"],
            password
        )

        print(
            "LOGIN DEBUG: Email:",
            email
        )

        print(
            "LOGIN DEBUG: Password valid:",
            password_valid
        )

        if not password_valid:

            return jsonify({
                "success": False,
                "error": "Invalid email or password"
            }), 401

        # =====================================================
        # CREATE JWT
        # =====================================================

        payload = {
            "user_id": user["id"],
            "email": user["email"],
            "exp": datetime.utcnow() + timedelta(hours=1)
        }

        token = jwt.encode(
            payload,
            Config.JWT_SECRET_KEY,
            algorithm="HS256"
        )

        # =====================================================
        # SUCCESS RESPONSE
        # =====================================================
        #
        # IMPORTANT:
        # We return BOTH "token" and "access_token"
        # so frontend will definitely receive it.
        #
        # =====================================================

        return jsonify({

            "success": True,

            "message": "Login successful",

            "token": token,

            "access_token": token,

            "user": {
                "id": user["id"],
                "name": user["name"],
                "email": user["email"]
            }

        }), 200

    except Exception as e:

        print(
            "LOGIN ERROR:",
            e
        )

        return jsonify({
            "success": False,
            "error": "Something went wrong during login"
        }), 500

    finally:

        if cursor:
            cursor.close()

        if connection:
            connection.close()

