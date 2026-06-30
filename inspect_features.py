"""Sanity-check features.py before training anything.

Prints per-patch feature values for a sample of real/ and screen/ images,
then a summary ranking each feature by how well it separates the two
classes (Cohen's d effect size).

Usage:
    python inspect_features.py
"""

import random
from pathlib import Path

import numpy as np

from features import extract_image_features, FEATURE_NAMES

DATA_DIR = Path(__file__).parent / "data"
N_PER_CLASS = 8
SEED = 0
IMAGE_SUFFIXES = (".jpg", ".jpeg")


def sample_images(label_dir, n, seed=SEED):
    """Round-robin sample across leaf subfolders so every device pairing is represented."""
    subfolders = [d for d in label_dir.iterdir() if d.is_dir()]
    rng = random.Random(seed)

    pools = {}
    for d in subfolders:
        imgs = [p for p in d.iterdir() if p.suffix.lower() in IMAGE_SUFFIXES]
        rng.shuffle(imgs)
        pools[d] = imgs

    picks = []
    i = 0
    while len(picks) < n and any(pools.values()):
        d = subfolders[i % len(subfolders)]
        if pools[d]:
            picks.append(pools[d].pop())
        i += 1
    return picks


def print_patch_rows(label, image_path, feats):
    rel = image_path.relative_to(DATA_DIR)
    for i, row in enumerate(feats):
        values = "  ".join(f"{v:8.3f}" for v in row)
        print(f"{label:6s} {str(rel):55s} patch{i:02d}  {values}")


def main():
    header = "  ".join(f"{n:>8s}" for n in FEATURE_NAMES)
    print(f"{'LABEL':6s} {'IMAGE':55s} {'PATCH':8s}  {header}")

    all_feats = {"real": [], "screen": []}

    for label in ("real", "screen"):
        images = sample_images(DATA_DIR / label, N_PER_CLASS)
        for path in images:
            feats = extract_image_features(path)
            print_patch_rows(label, path, feats)
            all_feats[label].append(feats)

    real = np.concatenate(all_feats["real"])
    screen = np.concatenate(all_feats["screen"])

    print()
    print(f"summary over {len(real)} real patches / {len(screen)} screen patches")
    print(f"{'feature':24s} {'real_mean':>10s} {'screen_mean':>12s} {'effect_size':>12s}")

    rows = []
    for j, name in enumerate(FEATURE_NAMES):
        r, s = real[:, j], screen[:, j]
        pooled_std = np.sqrt((r.var() + s.var()) / 2) + 1e-8
        d = (s.mean() - r.mean()) / pooled_std
        rows.append((name, r.mean(), s.mean(), d))

    for name, rm, sm, d in sorted(rows, key=lambda x: -abs(x[3])):
        print(f"{name:24s} {rm:10.3f} {sm:12.3f} {d:12.3f}")


if __name__ == "__main__":
    main()
