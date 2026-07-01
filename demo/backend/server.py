"""Tiny backend for the live camera demo.

Wraps the real predict.py from the project root -- no reimplementation, so
the demo is guaranteed to score exactly what the submitted pipeline scores.
Keeps the model loaded in memory between requests (unlike a fresh
`python predict.py` process per frame, which pays a ~1.5s cold-start cost
every time -- see docs/EXPLAINED.md's latency profiling).

Usage:
    python server.py
Serves POST /predict (multipart image -> {"score": float}) on :5000.
"""

import sys
import tempfile
from pathlib import Path

from flask import Flask, jsonify, request
from flask_cors import CORS

PROJECT_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(PROJECT_ROOT))
from predict import predict  # noqa: E402

app = Flask(__name__)
CORS(app)

_warmup_image = PROJECT_ROOT / "data" / "real" / "photos from iphone" / "IMG_0364.JPG.jpeg"
predict(str(_warmup_image))  # warm the model once at startup, not on the first live frame


@app.route("/predict", methods=["POST"])
def predict_route():
    file = request.files.get("image")
    if file is None:
        return jsonify({"error": "no image field"}), 400

    with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
        file.save(tmp.name)
        tmp_path = tmp.name

    try:
        score = predict(tmp_path)
    except Exception as e:  # noqa: BLE001
        return jsonify({"error": str(e)}), 500
    finally:
        Path(tmp_path).unlink(missing_ok=True)

    return jsonify({"score": score})


if __name__ == "__main__":
    app.run(port=5000, debug=False)
