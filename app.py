"""Entry point. Vercel imports `app` from this file; run `python app.py` to play locally."""
from backend.server import create_app

app = create_app()

if __name__ == "__main__":
    app.run(port=8000, debug=True)
