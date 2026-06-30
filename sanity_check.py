"""Run predict.py over a folder of fresh images (not used in training).

Usage:
    python sanity_check.py path/to/folder
"""

import sys
from pathlib import Path

import numpy as np

from predict import predict

IMAGE_SUFFIXES = (".jpg", ".jpeg")


def main(folder):
    folder = Path(folder)
    paths = sorted(p for p in folder.rglob("*") if p.suffix.lower() in IMAGE_SUFFIXES)
    if not paths:
        print(f"no images found in {folder}")
        return

    scores = []
    for path in paths:
        score = predict(str(path))
        scores.append(score)
        verdict = "SCREEN" if score >= 0.5 else "real  "
        print(f"{score:.3f}  {verdict}  {path.relative_to(folder)}")

    scores = np.array(scores)
    print(
        f"\n{len(scores)} images: mean={scores.mean():.3f}  median={np.median(scores):.3f}  "
        f"flagged_screen={int((scores >= 0.5).sum())}  flagged_real={int((scores < 0.5).sum())}"
    )


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("usage: python sanity_check.py <folder>")
        sys.exit(1)
    main(sys.argv[1])
