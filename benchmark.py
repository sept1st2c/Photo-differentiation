"""Measure predict.py latency per image.

Usage:
    python benchmark.py
"""

import platform
import time
from pathlib import Path

import numpy as np

from predict import predict

DATA_DIR = Path(__file__).parent / "data"
IMAGE_SUFFIXES = (".jpg", ".jpeg")
N_IMAGES = 50


def collect_sample_images(n=N_IMAGES):
    all_paths = sorted(p for p in DATA_DIR.rglob("*") if p.suffix.lower() in IMAGE_SUFFIXES)
    step = max(1, len(all_paths) // n)
    return all_paths[::step][:n]


def main():
    paths = collect_sample_images()
    predict(str(paths[0]))  # warm up: model load + first-call overhead, excluded from timing

    times_ms = []
    for path in paths:
        t0 = time.perf_counter()
        predict(str(path))
        times_ms.append((time.perf_counter() - t0) * 1000)
    times_ms = np.array(times_ms)

    print(f"device: {platform.processor() or platform.machine()} ({platform.system()} {platform.release()})")
    print(
        f"n={len(times_ms)}  median={np.median(times_ms):.1f}ms  p95={np.percentile(times_ms, 95):.1f}ms  "
        f"mean={times_ms.mean():.1f}ms  min={times_ms.min():.1f}ms  max={times_ms.max():.1f}ms"
    )


if __name__ == "__main__":
    main()
