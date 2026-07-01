"""Train + evaluate the screen-recapture detector.

Loads every image under data/real and data/screen, extracts patch features,
runs a group k-fold CV (folds = device-pairing groups, merged up to a
minimum size, fully held out from training) and a plain random image-level
split for comparison. Prints accuracy/precision/recall/confusion matrix for
three classifiers under both strategies, picks the classifier with the best
group-CV accuracy, refits it on 100% of the data, and saves it to
models/model.joblib for predict.py to load.
"""

import time
from pathlib import Path

import joblib
import numpy as np
from sklearn.ensemble import HistGradientBoostingClassifier, RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.inspection import permutation_importance
from sklearn.metrics import accuracy_score, confusion_matrix, precision_recall_fscore_support
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

from features import FEATURE_NAMES, aggregate_patch_scores, extract_image_features

DATA_DIR = Path(__file__).parent / "data"
MODELS_DIR = Path(__file__).parent / "models"
IMAGE_SUFFIXES = (".jpg", ".jpeg")
MIN_PATCHES_PER_FOLD = 150
RANDOM_STATE = 42


def load_dataset():
    """Walk data/{real,screen}/<device-pairing>/*.jpg(eg), extract patch features per image."""
    images = []
    for label_name, label in (("real", 0), ("screen", 1)):
        label_dir = DATA_DIR / label_name
        for group_dir in sorted(d for d in label_dir.iterdir() if d.is_dir()):
            paths = sorted(p for p in group_dir.iterdir() if p.suffix.lower() in IMAGE_SUFFIXES)
            for path in paths:
                images.append({
                    "path": path,
                    "label": label,
                    "label_name": label_name,
                    "group": f"{label_name}/{group_dir.name}",
                    "feats": extract_image_features(path),
                })
    return images


def compute_group_weights(images):
    """Equal total weight per class, equal total weight per device-pairing group within a class.

    A 7-image group and a 54-image group end up contributing the same total
    weight to training, so the classifier can't lean on whichever device
    pairing happens to have the most photos.
    """
    groups_by_class = {0: set(), 1: set()}
    group_sizes = {}
    for img in images:
        groups_by_class[img["label"]].add(img["group"])
        group_sizes[img["group"]] = group_sizes.get(img["group"], 0) + 1

    weights = {}
    for img in images:
        n_groups = len(groups_by_class[img["label"]])
        weights[img["path"]] = 1.0 / (n_groups * group_sizes[img["group"]])
    return weights


def merge_groups_for_folds(images, label_name, min_patches=MIN_PATCHES_PER_FOLD):
    """Merge smallest same-label device-pairing groups until each bucket clears min_patches."""
    patch_counts, group_images = {}, {}
    for img in images:
        if img["label_name"] != label_name:
            continue
        g = img["group"]
        patch_counts[g] = patch_counts.get(g, 0) + len(img["feats"])
        group_images.setdefault(g, []).append(img)

    ordered = sorted(patch_counts.items(), key=lambda kv: kv[1])

    buckets = []
    names, count, imgs = [], 0, []
    for name, n in ordered:
        names.append(name)
        count += n
        imgs.extend(group_images[name])
        if count >= min_patches:
            buckets.append((names, count, imgs))
            names, count, imgs = [], 0, []

    if names:  # leftover too small to stand alone -- fold into the last bucket
        if buckets:
            prev_names, prev_count, prev_imgs = buckets[-1]
            buckets[-1] = (prev_names + names, prev_count + count, prev_imgs + imgs)
        else:
            buckets.append((names, count, imgs))

    return buckets


def build_cv_folds(images):
    """Pair merged real buckets with merged screen buckets so every fold holds out both classes."""
    real_buckets = merge_groups_for_folds(images, "real")
    screen_buckets = merge_groups_for_folds(images, "screen")
    n_folds = max(len(real_buckets), len(screen_buckets))

    folds = []
    for i in range(n_folds):
        real_names, real_count, real_imgs = real_buckets[i % len(real_buckets)]
        screen_names, screen_count, screen_imgs = screen_buckets[i % len(screen_buckets)]
        test_imgs = real_imgs + screen_imgs
        test_paths = {img["path"] for img in test_imgs}
        train_imgs = [img for img in images if img["path"] not in test_paths]
        folds.append({
            "fold": i,
            "real_groups": real_names,
            "screen_groups": screen_names,
            "test_patch_count": real_count + screen_count,
            "train_imgs": train_imgs,
            "test_imgs": test_imgs,
        })
    return folds


def make_classifiers():
    return {
        "logreg": Pipeline([
            ("scale", StandardScaler()),
            ("clf", LogisticRegression(max_iter=2000, random_state=RANDOM_STATE)),
        ]),
        "random_forest": Pipeline([
            ("scale", StandardScaler()),
            ("clf", RandomForestClassifier(n_estimators=300, n_jobs=-1, random_state=RANDOM_STATE)),
        ]),
        "hist_gboost": Pipeline([
            ("scale", StandardScaler()),
            ("clf", HistGradientBoostingClassifier(random_state=RANDOM_STATE)),
        ]),
    }


def patches_to_xy(imgs, weights):
    X, y, w = [], [], []
    for img in imgs:
        n = len(img["feats"])
        X.append(img["feats"])
        y.extend([img["label"]] * n)
        w.extend([weights[img["path"]]] * n)
    return np.concatenate(X), np.array(y), np.array(w)


def predict_image_scores(pipeline, imgs):
    """Per-image score, aggregated the same way predict.py does."""
    return np.array([
        aggregate_patch_scores(pipeline.predict_proba(img["feats"])[:, 1], img["feats"])
        for img in imgs
    ])


def evaluate(pipeline, test_imgs, train_imgs, weights):
    X_train, y_train, w_train = patches_to_xy(train_imgs, weights)
    pipeline.fit(X_train, y_train, clf__sample_weight=w_train)

    y_true = np.array([img["label"] for img in test_imgs])
    y_pred = (predict_image_scores(pipeline, test_imgs) >= 0.5).astype(int)

    precision, recall, _, _ = precision_recall_fscore_support(
        y_true, y_pred, average="binary", zero_division=0
    )
    return {
        "accuracy": accuracy_score(y_true, y_pred),
        "precision": precision,
        "recall": recall,
        "confusion_matrix": confusion_matrix(y_true, y_pred, labels=[0, 1]),
    }


def print_eval(name, result):
    cm = result["confusion_matrix"]
    print(
        f"  {name:16s} acc={result['accuracy']:.3f}  precision={result['precision']:.3f}  "
        f"recall={result['recall']:.3f}  confusion=[[TN={cm[0,0]} FP={cm[0,1]}][FN={cm[1,0]} TP={cm[1,1]}]]"
    )


def run_group_cv(images, weights):
    print("\n=== Group K-Fold CV (held-out device pairings -- the honest number) ===")
    folds = build_cv_folds(images)
    print(f"{len(folds)} folds")
    for f in folds:
        print(
            f"  fold {f['fold']}: held out real={f['real_groups']}  screen={f['screen_groups']}  "
            f"test_patches={f['test_patch_count']}"
        )

    results = {name: [] for name in make_classifiers()}
    for f in folds:
        print(f"\n  -- fold {f['fold']} (real={f['real_groups']}, screen={f['screen_groups']}) --")
        for name, pipeline in make_classifiers().items():
            r = evaluate(pipeline, f["test_imgs"], f["train_imgs"], weights)
            results[name].append(r)
            print_eval(name, r)

    print("\nper-classifier mean +/- std across folds:")
    summary = {}
    for name, fold_results in results.items():
        accs = np.array([r["accuracy"] for r in fold_results])
        precs = np.array([r["precision"] for r in fold_results])
        recs = np.array([r["recall"] for r in fold_results])
        print(
            f"  {name:16s} acc={accs.mean():.3f}+/-{accs.std():.3f}  "
            f"precision={precs.mean():.3f}+/-{precs.std():.3f}  recall={recs.mean():.3f}+/-{recs.std():.3f}"
        )
        summary[name] = accs.mean()
    return summary


def run_random_split(images, weights):
    print("\n=== Random image-level split (optimistic comparison number) ===")
    train_imgs, test_imgs = train_test_split(
        images, test_size=0.25, random_state=RANDOM_STATE, stratify=[img["label"] for img in images]
    )
    summary = {}
    for name, pipeline in make_classifiers().items():
        r = evaluate(pipeline, test_imgs, train_imgs, weights)
        print_eval(name, r)
        summary[name] = r["accuracy"]
    return summary


def print_group_weights(images, weights):
    print("\ndevice-pairing groups (weighting check -- totals should match within each class):")
    seen = {}
    for img in images:
        seen.setdefault(img["group"], []).append(img)
    totals = {0: 0.0, 1: 0.0}
    for group, imgs in sorted(seen.items()):
        total_w = sum(weights[i["path"]] for i in imgs)
        totals[imgs[0]["label"]] += total_w
        print(f"  {group:55s} n={len(imgs):3d}  total_weight={total_w:.3f}")
    print(f"  class totals: real={totals[0]:.3f}  screen={totals[1]:.3f}")


def print_feature_importance(images, weights, classifier_name):
    """Permutation importance averaged across every held-out fold -- a feature that only
    looks useful in one fold is fold-specific noise, not a real signal."""
    folds = build_cv_folds(images)
    per_fold = []
    for f in folds:
        pipeline = make_classifiers()[classifier_name]
        X_train, y_train, w_train = patches_to_xy(f["train_imgs"], weights)
        pipeline.fit(X_train, y_train, clf__sample_weight=w_train)
        X_test, y_test, _ = patches_to_xy(f["test_imgs"], weights)
        result = permutation_importance(pipeline, X_test, y_test, n_repeats=10, random_state=RANDOM_STATE, n_jobs=-1)
        per_fold.append(result.importances_mean)
    per_fold = np.array(per_fold)  # (n_folds, n_features)

    mean_imp, std_imp = per_fold.mean(axis=0), per_fold.std(axis=0)
    print(f"\n=== Feature importance ({classifier_name}, permutation averaged across {len(folds)} held-out folds) ===")
    for i in np.argsort(mean_imp)[::-1]:
        per_fold_str = ", ".join(f"{v:+.3f}" for v in per_fold[:, i])
        print(f"  {FEATURE_NAMES[i]:24s} mean={mean_imp[i]:+.4f}  std={std_imp[i]:.4f}  per_fold=[{per_fold_str}]")
    return mean_imp


def train_final_model(images, weights, winner_name):
    print(f"\n=== Training final model ({winner_name}) on 100% of data ===")
    pipeline = make_classifiers()[winner_name]
    X, y, w = patches_to_xy(images, weights)
    pipeline.fit(X, y, clf__sample_weight=w)

    MODELS_DIR.mkdir(exist_ok=True)
    out_path = MODELS_DIR / "model.joblib"
    joblib.dump({"pipeline": pipeline, "feature_names": FEATURE_NAMES, "classifier_name": winner_name}, out_path)
    print(f"saved {out_path}")


def main():
    t0 = time.time()
    print("loading dataset + extracting features...")
    images = load_dataset()
    n_real = sum(1 for i in images if i["label"] == 0)
    n_screen = sum(1 for i in images if i["label"] == 1)
    total_patches = sum(len(i["feats"]) for i in images)
    print(f"{len(images)} images ({n_real} real / {n_screen} screen), {total_patches} patches, {time.time()-t0:.1f}s")

    weights = compute_group_weights(images)
    print_group_weights(images, weights)

    cv_summary = run_group_cv(images, weights)
    run_random_split(images, weights)

    winner = max(cv_summary, key=cv_summary.get)
    print(f"\nbest classifier by group-CV accuracy: {winner} ({cv_summary[winner]:.3f})")
    print_feature_importance(images, weights, winner)
    train_final_model(images, weights, winner)


if __name__ == "__main__":
    main()
