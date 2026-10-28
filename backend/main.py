"""
Uvicorn entrypoint shim.
Run locally:  uv run uvicorn main:app --reload --port 8000
In Docker / Render the start command points to app.main:app directly.
"""
from app.main import app  # noqa: F401 — re-exported for uvicorn main:app
