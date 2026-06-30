# Spot the Fake Photo — Note

A handcrafted-feature classifier that scores whether a photo is a direct
capture of a real scene or a recapture of a screen, built around the
physics of what changes when light bounces off a display first.

## Pipeline

```
 ┌───────────┐     ┌────────────────┐     ┌──────────────────────┐     ┌──────────────────────┐     ┌───────────┐
 │  Input    │     │   Patch grid   │     │  6 features / patch  │     │     Classifier        │     │  Image    │
 │  photo    │ ──> │  128x128 cells,│ ──> │  FFT · LBP · noise ·  │ ──> │  HistGradientBoosting │ ──> │  score    │
 │  (.jpg)   │     │  ~16/image     │     │  color (below)        │     │  → per-patch P(screen)│     │  [0, 1]   │
 └───────────┘     └────────────────┘     └──────────────────────┘     └──────────────────────┘     └───────────┘
```

No deep learning, no GPU, no pretrained model — pure NumPy / OpenCV /
scikit-learn, ~376KB model file.

## Why this approach

With ~200 self-collected photos across 5-6 device pairings, a CNN would
likely memorize *device* fingerprints (this iPhone's sensor noise, this
laptop's moiré frequency) rather than learn "recapture" in general. A
small handcrafted feature vector can't memorize pixels — only the physical
signal below — which generalizes better to devices it's never seen.

Patches, not whole images: the signal is local and high-frequency (moiré,
screen subpixel texture), and resizing a whole image would wash it out.
~16 patches/photo also turns ~200 images into ~3000 training examples.

## The physical signal

| Feature | What it measures | Why a recapture differs |
|---|---|---|
| `fft_radial_peakiness`, `fft_peak_to_mean` | Peakiness of the patch's frequency spectrum away from DC | Camera-sensor grid × screen-subpixel grid creates a moiré beat frequency — a sharp spectral peak absent in natural scenes. **Strongest signal.** |
| `lbp_uniform_fraction`, `lbp_std` | Local texture histogram stats | Screens impose a regular subpixel structure — more uniform micro-texture than organic surfaces. |
| `noise_kurtosis` | Tail-heaviness of the blur residual | A recapture stacks two sensors' noise, changing the residual's statistical shape even when its magnitude looks similar. |
| `color_val_std` | Spread of the HSV value channel | Screens don't reproduce real-world dynamic range; auto-exposure behaves differently on a self-luminous display. |

Narrowed from 19 candidates by keeping only features with **consistent-sign
importance across every held-out validation fold** — inconsistent ones
were device-specific noise, not signal. Patch scores combine into one
image score by averaging, so no single odd patch flips the verdict.
Full reasoning and rejected candidates: `docs/EXPLAINED.md`.

## How it's validated

Random train/test splitting overstates accuracy here, since the same
device can appear in both halves. Evaluation instead uses **group k-fold
cross-validation**: each fold holds out an entire device pairing from
training, then tests on it — the same shape of test SalesCode's held-out
photos represent. This drove real decisions, not just a final score: small
folds were merged for statistical stability, per-device sample weighting
stops any one device from dominating, and two plausible-looking
optimizations (resolution normalization, a sparser patch grid) were tested
and **reverted** after they measurably hurt generalization.

## Latency

```
JPEG decode (12MP)      ████████████████████████████████████   ~88ms  (49%)
Feature extraction      ████████████████████████████████       ~78ms  (44%)
Classification + score  ████                                    ~12ms  (7%)
                                                                ──────
                                                          total ~178ms  (median)
```

**~178ms median / ~220ms p95** (`benchmark.py`, 50 images, laptop CPU,
single-threaded, model warm). JPEG decode dominates; decoding smaller would
speed this up but measurably hurts the moiré signal, so full resolution is
kept — accuracy over a faster, worse number.

## Cost per image

| Deployment | Cost | Assumptions |
|---|---|---|
| **On-device** | **$0 marginal** | No GPU/network/DL runtime; phone-class CPU is comfortably workable. |
| **Cloud (serverless)** | **~$1.50–2 / million images** | 512MB function, ~180ms compute, ~$0.0000166/GB-s + $0.20/1M requests (Lambda-class). No batching/cold-start amortization yet. |

On-device is the right default: zero marginal cost, no data leaves the
phone, latency already workable.

## What I'd improve with more time

- More device/screen diversity, targeted at the specific gaps validation
  surfaces (it tells you which device pairing is weak, not just an
  aggregate score).
- A calibrated, cost-aware cutoff instead of a flat 0.5.
- Nested cross-validation for the feature-selection step itself, since it
  currently uses the same folds validation reports on.

## Bonus: cutoff, adaptation, phone deployment

**Cutoff:** depends on which error costs more — missed fraud vs. user
friction. Pick the threshold off a precision-recall curve from the
validation folds, sized to that cost ratio, and route mid-confidence
scores to manual review rather than auto-reject.

**Adapting to cheaters:** an ongoing arms race, not a one-time model —
sample false negatives in production, retrain periodically on new
recapture examples. The patch-feature approach generalizes to new
*devices* better than a CNN (nothing device-specific to overfit to), but
not to fundamentally new evasion techniques (e.g. printouts) without new
training examples.

**Phone deployment:** already most of the way there — no GPU, no DL
framework, ~376KB model, pure NumPy/OpenCV math. Porting feature
extraction to native code would close most of the remaining latency gap.
