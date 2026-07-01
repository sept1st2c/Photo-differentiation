"""Screen-recapture detector.

Usage:
    python predict.py some_image.jpg
Prints ONE number from 0 to 1:
    0 = real photo,  1 = photo of a screen (recapture / fraud)

Loads the classifier trained by train.py (models/model.joblib), extracts
the same patch features used at training time, and combines per-patch
"screen" probabilities into one image-level score (see
features.aggregate_patch_scores).
"""

import sys
from pathlib import Path

import joblib

from features import aggregate_patch_scores, extract_image_features

MODEL_PATH = Path(__file__).parent / "models" / "model.joblib"
_model = None


def _load_model():
    global _model
    if _model is None:
        _model = joblib.load(MODEL_PATH)
    return _model


def predict(image_path: str) -> float:
    pipeline = _load_model()["pipeline"]
    feats = extract_image_features(image_path)
    proba = pipeline.predict_proba(feats)[:, 1]
    return aggregate_patch_scores(proba, feats)


if __name__ == "__main__":
    print(predict(sys.argv[1]))
