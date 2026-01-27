"""
Udo Backend - Flask Application
Local-first task management system with file-based storage
"""

from flask import Flask, send_from_directory
from flask_cors import CORS
import os

from backend.file_manager import ensure_directories
from backend.routes.pages import pages_bp
from backend.routes.tasks import tasks_bp
from backend.routes.settings import settings_bp

app = Flask(__name__)
CORS(app)

# Ensure data directories exist
ensure_directories()

# Register blueprints
app.register_blueprint(pages_bp, url_prefix='/api')
app.register_blueprint(tasks_bp, url_prefix='/api')
app.register_blueprint(settings_bp, url_prefix='/api')

# Serve React frontend
FRONTEND_DIST = os.path.join(os.path.dirname(__file__), '..', 'frontend', 'dist')


@app.route('/')
def serve_frontend():
    """Serve the React frontend"""
    if os.path.exists(os.path.join(FRONTEND_DIST, 'index.html')):
        return send_from_directory(FRONTEND_DIST, 'index.html')
    return {"message": "Udo Backend is running. Frontend not built yet."}, 200


@app.route('/<path:path>')
def serve_static(path):
    """Serve static files from React build"""
    if os.path.exists(os.path.join(FRONTEND_DIST, path)):
        return send_from_directory(FRONTEND_DIST, path)
    # For client-side routing, serve index.html
    if os.path.exists(os.path.join(FRONTEND_DIST, 'index.html')):
        return send_from_directory(FRONTEND_DIST, 'index.html')
    return {"error": "Not found"}, 404


@app.route('/api/health')
def health_check():
    """Health check endpoint"""
    return {"status": "ok", "app": "Udo"}


if __name__ == '__main__':
    print("Starting Udo backend...")
    print("Backend API: http://localhost:5000")
    app.run(debug=True, host='0.0.0.0', port=5000)
