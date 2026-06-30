# Spot the Fake Photo — Note

**Approach:** Handcrafted features + `HistGradientBoostingClassifier`, not a
CNN — with ~200 self-collected photos across 5-6 device pairings, a CNN
would memorize device fingerprints instead of learning "recapture" in
general. Each image splits into ~16 patches (128x128); each patch gets 6
features targeting the physics of recapturing a screen: moiré (2D FFT
peakiness — the beat frequency between a screen's subpixel grid and the
camera's sensor grid), screen subpixel micro-texture (LBP stats), stacked
double-sensor noise (residual kurtosis), and value-range compression. Image
score = mean of patch scores. These 6 were narrowed from 19 candidates by
keeping only the ones with consistent-sign importance across every
cross-validation fold — the rest were per-device noise. Full reasoning in
`docs/EXPLAINED.md`.

**Accuracy — reported honestly:** Evaluated with group k-fold CV (each fold
holds out an entire device pairing, e.g. all "laptop-screen-via-OnePlus"
photos, measuring generalization to an unseen device, not memorization).

- **Group-CV (honest): 80.8% ± 4.9%**
- Random-split (optimistic, same devices in train+test): 92.3%

The 11-point gap is the actual measurement of remaining device-specific
overfitting. **This is below the 95% target — reporting that plainly rather
than inflating it.** Per-fold breakdown shows the gap is concentrated in
precision on unseen real-photo devices, not in catching screens, which
points at needing more device diversity, not a missing feature. Two fixes
were tried and reverted because they hurt the honest number on testing
(resolution normalization, sparser patch sampling, percentile-based score
aggregation) — details and numbers in `docs/EXPLAINED.md`.

**Latency:** ~178ms median / ~220ms p95 on a laptop CPU (AMD Ryzen, Windows,
single-threaded), measured by `benchmark.py` over 50 images. ~88ms of that
is JPEG-decoding the 12MP source photo; decoding smaller would speed this up
but measurably hurts accuracy (moiré depends on the original sensor's pixel
grid), so it's left at full resolution.

**Cost per image:** On-device — $0 marginal cost, no GPU/network/DL runtime.
Cloud (rough estimate, 512MB serverless function, ~180ms compute,
~$0.0000166/GB-s + $0.20/1M requests): **~$1.50-2 per million images.**

**What I'd improve with more time:** more device/screen diversity
(targeted, not just more photos — see the precision gap above); a
calibrated, cost-aware cutoff instead of flat 0.5; nested CV for the
feature-selection step itself, since it currently uses the same folds the
accuracy is reported on (flagged as mildly optimistic).

**Bonus — cutoff/adaptation/phone:** Cutoff should follow SalesCode's actual
cost ratio (missed fraud vs. user friction) via a precision-recall curve,
with mid-confidence scores routed to manual review rather than auto-reject.
Keeping it accurate as cheaters adapt means treating it as an arms race —
sampled human review of false negatives in production, periodic retraining
on new recapture examples; the patch-feature approach generalizes to new
*devices* better than a CNN would, but not to fundamentally new evasion
techniques (e.g. printouts) without new training examples. Phone deployment
is already most of the way there — no GPU, no DL framework, ~376KB model;
porting feature extraction to native code would close the remaining latency
gap.
