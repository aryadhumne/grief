from flask import Flask
from flask_cors import CORS
from routes.chat import chat_bp
from routes.mood import mood_bp
from routes.journal import journal_bp

app = Flask(__name__)
CORS(app, origins=["http://localhost:5173"])  # React dev server

# Register blueprints
app.register_blueprint(chat_bp, url_prefix="/api")
app.register_blueprint(mood_bp, url_prefix="/api")
app.register_blueprint(journal_bp, url_prefix="/api")

if __name__ == "__main__":
    app.run(debug=True, port=5000)