from flask import Blueprint

health_bp = Blueprint("health", __name__)


@health_bp.get("/health")
def health_check():
    return {
        "status": "success",
        "message": "YouTube AI Notes API is running"
    }