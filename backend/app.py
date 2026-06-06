from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager

from config import Config
from database.db import db

from routes.auth_routes import auth_bp
from routes.interview_routes import interview_bp
from models.interview import InterviewSession, InterviewResponse

app = Flask(__name__)

# Load Config
app.config.from_object(Config)

# Initialize Extensions
db.init_app(app)
jwt = JWTManager(app)
CORS(app)

# Home Route
@app.route("/")
def home():
    return jsonify({
        "status": "success",
        "message": "AI Mock Interview Backend Running"
    })

# Register Blueprints
app.register_blueprint(auth_bp)
app.register_blueprint(interview_bp)

# Create Database Tables
with app.app_context():
    db.create_all()

# Run Server
if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )