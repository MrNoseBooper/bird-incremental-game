"""HTTP layer: serves the game content API and, when running locally, the frontend in public/."""
import mimetypes
from pathlib import Path

from flask import Flask, jsonify, send_from_directory

from .content import build_content

PUBLIC_DIR = Path(__file__).resolve().parent.parent / "public"

# Some Windows registries map .js to text/plain, which browsers refuse to run as a module.
mimetypes.add_type("text/javascript", ".js")
mimetypes.add_type("text/css", ".css")


def create_app() -> Flask:
    # On Vercel the CDN serves public/ before requests reach Flask; locally Flask serves it.
    app = Flask(__name__, static_folder=PUBLIC_DIR, static_url_path="")
    content = build_content()

    @app.get("/api/content")
    def get_content():
        return jsonify(content)

    @app.get("/")
    def index():
        return send_from_directory(PUBLIC_DIR, "index.html")

    return app
