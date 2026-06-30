# Spot the Fake Photo — Note

A handcrafted-feature classifier that scores whether a photo is a direct
capture of a real scene or a recapture of a screen — built around the
physics of what changes when light bounces off a display instead of
arriving straight from the world.

## Pipeline

```
 ┌───────────┐     ┌────────────────┐     ┌──────────────────────┐     ┌─────────────────────┐     ┌───────────┐
 │  Input    │     │   Patch grid   │     │  6 features / patch  │     │     Classifier       │     │  Image    │
 │  photo    │ ──> │  128x128 cells,│ ──> │  FFT · LBP · noise ·  │ ──> │  HistGradientBoosting│ ──> │  score    │
 │  (.jpg)   │     │  ~16/image,    │     │  color (see below)    │     │  (scikit-learn)      │     │  [0, 1]   │
 │           │     │  blanks skipped│     │                       │     │  → per-patch P(screen)│     │ mean of   │
 └───────────┘     └────────────────┘     └──────────────────────┘     └─────────────────────┘     │ patches   │
                                                                                                       └───────────┘
```

No deep learning, no GPU, no pretrained model — pure NumPy / OpenCV /
scikit-learn. The model file is ~376KB.

## Why this approach

With ~200 self-collected photos across 5-6 device pairings, a CNN has two
bad options: stay small and underfit, or get expressive enough to fit the
data and instead memorize *device* fingerprints — this iPhone's sensor
noise, this laptop's exact moiré frequency — rather than "recapture" in
general. A small handcrafted feature vector physically cannot memorize
pixels; it can only encode the signal below, which makes it far more
likely to generalize to devices and screens it's never seen.

The image is split into patches (not scored whole) because the signal is
local and high-frequency — moiré and screen subpixel texture live in fine
pixel detail that any whole-image resizing would wash out. ~16 patches per
photo also turns ~200 images into ~3000 training examples.

## The physical signal, per feature

| Feature | What it measures | Why a recapture differs from a real photo |
|---|---|---|
| `fft_radial_peakiness`, `fft_peak_to_mean` | Peakiness of the patch's 2D frequency spectrum, away from DC | A camera's sensor grid interfering with a screen's subpixel grid creates a moiré beat frequency — a sharp spectral peak. Natural scenes fall off smoothly with no such peak. **Strongest signal in the set.** |
| `lbp_uniform_fraction`, `lbp_std` | Local Binary Pattern texture histogram stats | Screens impose a regular subpixel structure (RGB stripes, anti-aliasing) on top of whatever they display — a more uniform micro-texture than organic surfaces like skin or fabric. |
| `noise_kurtosis` | Tail-heaviness of the residual after Gaussian-blurring the patch | A recapture stacks two independent sensors' noise (original capture + the recapturing camera), changing the statistical shape of the residual even when its magnitude looks similar. |
| `color_val_std` | Spread of the HSV value channel | Screens don't reproduce the full dynamic range of real-world light, and auto-exposure behaves differently pointed at a self-luminous display vs. reflected ambient light. |

These 6 were narrowed down from 19 candidates (which also covered JPEG
double-compression blockiness, color-channel correlation, sharpness, and
glare/highlight clipping) by keeping only the ones with **consistent-sign
importance across every held-out validation fold** — features that helped
in some folds and hurt in others were cut as device-specific noise rather
than genuine signal. Full per-feature reasoning and the rejected
candidates are in `docs/EXPLAINED.md`.

Patch scores combine into one image score by **averaging** — not max —
so a single odd patch can't flip the verdict either direction; the score
reflects the overall weight of evidence across the photo.

## How it's validated

Standard random train/test splitting overstates real-world accuracy here,
because it lets the same device appear in both training and testing — the
model can pass by recognizing "this is my iPhone's sensor" rather than
"this is a recapture." To get a number that actually predicts behavior on
unseen devices, evaluation uses **group k-fold cross-validation**: each
fold holds out an entire device pairing (e.g. every "laptop screen photo
via OnePlus" image) from training entirely, then tests on it. This is the
same shape of test SalesCode's held-out photos represent — devices and
screens the model has never trained on — so it's the number that matters,
not a flattering one.

This also drove concrete design decisions, not just a final score:
- Small device-pairing folds were merged so no single fold's result is
  based on too few images to be statistically meaningful.
- Per-device sample weighting ensures no single device (e.g. the 54-photo
  group vs. the 7-photo group) dominates training.
- Two plausible-looking optimizations — image resolution normalization and
  a sparser patch grid for speed — were tested against this validation and
  **reverted** because they measurably hurt generalization, even though
  they looked reasonable on paper. That's the validation loop doing its
  job: catching regressions before they ship, not after.

## Latency

```
JPEG decode (12MP)      ████████████████████████████████████   ~88ms  (49%)
Feature extraction      ████████████████████████████████       ~78ms  (44%)
Classification + score  ████                                    ~12ms  (7%)
                                                                ──────
                                                          total ~178ms  (median)
```

**~178ms median / ~220ms p95**, measured by `benchmark.py` over 50 images
on a laptop CPU (AMD Ryzen, Windows, single-threaded, model already warm).
Profiled directly: JPEG-decoding the 12MP source photo is the single
largest cost. Decoding at lower resolution would cut this further, but was
tested and measurably hurts the moiré signal (it depends on the original
sensor's native pixel grid), so full-resolution decode is kept — accuracy
over a faster but worse number.

## Cost per image

| Deployment | Cost | Assumptions |
|---|---|---|
| **On-device** | **$0 marginal cost** | No GPU, no network call, no DL runtime. ~178ms on a laptop CPU; a phone-class CPU is comfortably workable. |
| **Cloud (serverless)** | **~$1.50–2 per million images** | 512MB function, ~180ms compute/image, ~$0.0000166/GB-s + $0.20/1M requests (AWS Lambda-class pricing). No batching, no cold-start amortization — both would lower this further. |

On-device is the right default for this use case: zero marginal cost, no
data leaves the phone, and latency is already workable.

## What I'd improve with more time

- **More device/screen diversity** in training data, targeted at the
  specific gaps the validation methodology surfaces (it tells you exactly
  which device pairing is weakest, not just an aggregate number).
- A calibrated, cost-aware cutoff instead of a flat 0.5 (see below).
- Nested cross-validation for the feature-selection step itself, since
  feature selection currently uses the same folds the validation reports
  on — a known source of mild optimism worth closing with more data.

## Bonus: cutoff, adaptation, phone deployment

**Choosing the cutoff** depends on which error costs SalesCode more — a
missed recapture (fraud gets through) vs. a wrongly-flagged real photo
(user friction, support load). The right move is picking the threshold off
a precision-recall curve built from the validation folds, sized to that
cost ratio, and routing mid-confidence scores to manual review rather than
a hard auto-reject — that's exactly the band where the model is least
sure of itself.

**Keeping it accurate as cheaters adapt** means treating it as an ongoing
arms race, not a one-time model: sample false negatives in production for
human review, and periodically retrain on newly-collected recapture
examples as new screen types and techniques show up. The patch-feature
approach generalizes to *new devices* better than a CNN would (it has
nothing device-specific to overfit to), but it won't generalize to
*fundamentally new evasion techniques* (e.g. printouts instead of screens)
without new training examples covering them — no model does that for free.

**Phone deployment** is already most of the way there by construction — no
GPU, no deep learning framework, a ~376KB model file, pure NumPy/OpenCV
math. The remaining step is porting feature extraction to native code
(e.g. via OpenCV's mobile bindings), which would close most of the
remaining latency gap to instant.
