from flask import Flask

app = Flask(__name__)


@app.get("/health")
def health_check():
    return {
        "status": "success",
        "message": "YouTube AI Notes API is running"
    }


if __name__ == "__main__":
    app.run(debug=True)