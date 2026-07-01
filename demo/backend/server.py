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

import os
import sys
import tempfile
from pathlib import Path

import cv2
import numpy as np
from flask import Flask, jsonify, request
from flask_cors import CORS

PROJECT_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(PROJECT_ROOT))
from predict import predict  # noqa: E402

app = Flask(__name__)
CORS(app)


def _warm_up():
    """Run one prediction at startup, not on the first live frame.

    Uses a synthetic image rather than a training photo so the backend has
    no dependency on data/ being present -- deployed containers ship the
    model, not the training set.
    """
    noise = np.random.default_rng(0).integers(0, 256, (512, 512, 3), dtype=np.uint8)
    with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
        cv2.imwrite(tmp.name, noise)
        tmp_path = tmp.name
    try:
        predict(tmp_path)
    finally:
        Path(tmp_path).unlink(missing_ok=True)


_warm_up()


@app.route("/health")
def health():
    return jsonify({"status": "ok"})


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
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)), debug=False)
