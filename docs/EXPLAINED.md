# How this works, and why

This is the plain-language version: what each piece does, what physical
phenomenon it's exploiting, and why the design should generalize to photos
it's never seen. Read once, defend in an interview.

## The core idea

When you photograph a screen instead of a real thing, you're not capturing
light from the world — you're capturing a *re-emission* of light from a
grid of LEDs/LCD subpixels, through a second lens and sensor, often through
glass or a glossy coating. That re-capture process leaves physical fingerprints
that have nothing to do with the *content* of the photo:

- two sensors' worth of noise stacked instead of one
- a pixel grid (the screen) interfering with another pixel grid (the camera
  sensor), which aliases into a moiré pattern
- a narrower color gamut and different gamma curve than direct light
- glare/reflection off the screen surface
- often a second round of JPEG compression baked into the original screen image

None of this requires recognizing *what's in the photo*. That's the whole
point of the handcrafted-feature approach: we're not asking "does this look
like a real object," we're asking "does this light look like it came
straight from the world or bounced off a screen first." That question has
the same answer regardless of whether the photo is a cat, a receipt, or a
landscape — which is exactly the property we want for generalizing to a
totally different held-out test set.

This isn't a novel idea — classic image-forensics literature (Cao & Kot,
*"Identification of Recaptured Photographs on LCD Screens,"* IEEE 2010)
uses nearly the same feature families: specular reflection, blurriness,
color moments, texture, and JPEG block effect, combined with a small
classifier. The feature design here converged on the same set
independently; what's specific to this project is the patch-level
aggregation and the cross-fold feature pruning described below.

## Why patches, not whole images

Two reasons:

1. **The signal is local and high-frequency.** Moiré, screen subpixel
   texture, and noise statistics live in fine pixel-level detail. If you
   resize a whole image down to feed a model, you destroy exactly the
   signal you're trying to detect. Working on native-resolution 128x128
   patches keeps that detail intact.
2. **More training examples from the same data.** ~16 patches per image
   turns ~200 images into ~3000 patches. Each patch is a noisier label
   (an individual patch doesn't always show clear screen artifacts — a
   flat or blurry patch is uninformative) but in aggregate this gives the
   classifier far more to learn from than one feature vector per image
   would, and patch averaging at inference time smooths out the noisy
   ones.

Near-blank patches (sky, a flat wall, blown-out highlights — anything with
grayscale std below `BLANK_STD_THRESHOLD = 5.0`) are skipped because they
carry no texture/frequency signal either way; including them would just add
label noise. The candidate grid is built *densely* across the full image
(not just enough cells to reach the patch cap) specifically so that
blank-heavy outdoor/landscape photos still have enough non-blank candidates
left after filtering to fill out a full 16-patch sample — see the
"what didn't work" section below for why a sparser candidate grid was tried
and reverted.

## Why handcrafted features instead of a CNN

With ~200 images from 5-6 device pairings, a CNN has two bad options: stay
small and underfit, or get expressive enough to fit the data and instead
memorize device-specific cues — *this iPhone's sensor noise*, *this laptop
screen's exact moiré frequency*, *this room's lighting* — rather than the
general "recapture" signal. That memorization shows up as great training/val
accuracy and a cliff on SalesCode's held-out photos, taken with devices and
screens we've never seen.

A small handcrafted feature vector, by contrast, can't memorize pixels — it
can only encode the physical signatures above. With a low-dimensional
feature space and thousands of patches, a small classifier (logistic
regression / random forest / gradient boosting) is *underparameterized
relative to the data*, which is the regime where train and held-out
accuracy track each other closely. It's also three orders of magnitude
faster (milliseconds, not requiring a GPU), free to run on-device, and
every feature is individually inspectable — if accuracy is ever wrong, you
can point at *which* feature failed, not stare at an opaque weight matrix.

The trade-off, honestly: a CNN given enough varied data would likely beat
this on raw accuracy ceiling. This approach is the right call *at this data
scale*, not as a universal claim.

## The feature groups

`features.py` computes seven physically-grounded feature groups per patch
(FFT, LBP texture, noise residual, color, sharpness, JPEG blockiness,
glare). Cross-fold permutation importance (below) showed only six
individual measurements out of the original nineteen carry real,
fold-consistent signal at this data scale — those six are what
`extract_patch_features` actually computes and what ships in the final
model. The rest are kept as documented, standalone functions for
transparency and future extension, but are not called in the hot path.

### Shipped (`FEATURE_NAMES`, 6 dims)

**`fft_radial_peakiness`, `fft_peak_to_mean`** (`fft_features`) — how
peaky/off-axis the patch's 2D Fourier spectrum is, away from DC. A camera
sensor has its own regular pixel grid; photographing a screen, which has
*its own* regular subpixel grid, creates a moiré interference pattern — a
beat frequency between the two grids that shows up as a sharp, off-axis
spectral peak. Natural scenes have frequency spectra that fall off smoothly
(roughly 1/f) with no sharp peaks, because nothing in nature is a perfect
repeating grid at camera-pixel scale. These were the two strongest,
most fold-consistent features by a wide margin.

**`lbp_uniform_fraction`, `lbp_std`** (`lbp_features`) — Local Binary
Pattern histogram stats: for every pixel, compare it to its 8 neighbors,
encode "brighter/darker" as a bit pattern, histogram those patterns. Real
surfaces have organic, irregular micro-texture; screens impose a regular
subpixel structure (RGB stripes, PenTile, anti-aliasing/sub-pixel
rendering) on top of whatever they're displaying, producing a different,
more uniform LBP signature than skin, paper, or fabric.

**`noise_kurtosis`** (`noise_residual_features`) — kurtosis (tail
heaviness) of the residual after subtracting a Gaussian-blurred copy of
the patch. A direct photo has one sensor's noise profile; a recapture has
*two* stacked — the original capture's noise plus the noise from
photographing the screen. Stacking two independent noise sources changes
the statistical shape of the residual even when raw noise magnitude looks
similar, which is a more device-agnostic signal than noise level alone.

**`color_val_std`** (`color_features`) — standard deviation of the HSV
value channel. Screens (especially phone/laptop LCDs) don't reproduce the
full dynamic range of real-world light, and auto-exposure behaves
differently pointed at a self-luminous screen vs. reflected ambient light.

### Computed but not shipped (kept as documented functions)

**`fft_high_freq_ratio`, `lbp_entropy`, `lbp_hist_std`, `noise_std`,
`noise_energy`, `color_sat_mean`, `color_sat_std`, `color_rg_corr`,
`color_gb_corr`** — present in the same functions above but pruned from
`FEATURE_NAMES`; see "what didn't work" for why.

**`sharpness_features`** (Laplacian variance) — a focus/detail proxy.
Weak and inconsistent across folds: real photos can be blurry, recaptures
can be sharp, depending entirely on the source image and the recapturing
camera's focus.

**`jpeg_block_features`** (8x8 block-boundary blockiness ratio) — the
classic double-JPEG forensic signal. Consistently *negative* importance
across every fold — see below.

**`glare_features`** (highlight/shadow clipping fraction) — physically
sound (screens are self-luminous, often glossy) but didn't survive
pruning at this sample size; only fires on a subset of photos (bright
glare or dark-room screens), too sparse a signal for ~200 images.

## From patch scores to one image score

Each patch gets its own probability from the classifier; the image's final
score is a **moiré-magnitude-weighted average** of its patch scores
(`aggregate_patch_scores` in `features.py`) -- each patch's contribution is
weighted by its own `fft_radial_peakiness`, so patches with a stronger
periodic signal get more say than patches that are comparatively flat.
This started as a flat mean; the weighted version was tested against the
full group-CV set and adopted after it improved accuracy, precision, *and*
the random-split number with zero recall cost (0.808 -> 0.815 group-CV,
0.923 -> 0.942 random-split -- see "what worked" below). Either way
(flat mean or weighted), a single odd patch can't flip the verdict on its
own -- the score reflects the overall weight of evidence across the image,
not any one patch.

## How overfitting is prevented (and what it would look like if it weren't)

What overfitting would look like here: near-perfect accuracy on a random
train/test split of *our own* photos, but a big drop on SalesCode's
held-out photos — because the model learned "this specific iPhone's noise
profile" or "this specific laptop's moiré frequency" instead of "recapture
in general." This is exactly what the first training run showed, and the
rest of this section is the story of diagnosing and partially fixing it.

Design choices that guard against it:

- **Group k-fold cross-validation**, where each fold holds out an entire
  device-pairing subfolder (e.g. all "laptop screen photos from oneplus")
  from training, not just a random subset of images. This directly
  measures generalization to an unseen device/screen combination.
- **Small subfolders are merged before being used as a fold.** A 7-image
  held-out fold produces a noisy, untrustworthy accuracy number, so
  same-label subfolders below a minimum patch count are merged with the
  next-smallest same-label subfolder before fold assignment. Every
  constituent subfolder is still fully excluded from training for that
  fold; merging only stabilizes the reported number.
- **Per-group sample weighting during training.** Device-pairing subfolder
  sizes range from 7 to 59 images. Each patch is weighted so every
  device-pairing group — and every class (real/screen) — contributes equal
  total weight to training, regardless of how many photos it has:
  `weight = 1 / (n_groups_in_class * group_size)`. Verified in `train.py`'s
  output: both classes land at exactly 1.0 total weight.
  - this fix alone wasn't the bottleneck (see below), but is good practice
    and keeps the device with the most photos (54 images) from dominating.
- **Cross-fold permutation importance.** A feature is only trustworthy if
  it has *consistent-sign* importance across every held-out fold, not just
  on average. Computed once per held-out fold (not just the easiest one),
  this is what drove the final feature pruning.
- **Reporting both group-CV and a plain random-split accuracy, side by
  side.** The gap between them is the actual measurement of
  device-specific overfitting.
- **Low feature dimensionality relative to data size** (6 dims, ~3000
  patches) keeps the classifier in an underparameterized regime where it
  physically can't memorize individual patches the way a CNN could.

### The honest numbers, end to end

| iteration | group-CV acc (honest) | random-split acc (optimistic) | gap |
|---|---|---|---|
| all 19 features | 0.761 ± 0.066 | 0.904 | 0.143 |
| pruned to 6 features | 0.808 ± 0.049 | 0.923 | 0.115 |
| + moiré-weighted aggregation | **0.815 ± 0.050** | **0.942** | 0.127 |

Per-fold breakdown showed the failure wasn't uniform: the model did fine
catching screens, but had poor *precision* on two folds (0.36-0.58) where
an entire real-photo device (iPhone or OnePlus) was held out — i.e. real
photos from an unseen device were being misflagged as screens. This points
at the remaining gap being about *real-photo diversity per device*, not a
missing feature type.

### What worked: moiré-weighted aggregation

Two fresh, never-trained-on screen photos (loosely-framed laptop-screen
recaptures, shot after training was finalized) were misclassified as real.
Per-patch inspection showed a more interesting failure than "background
dilutes the average": the patches that scored *high* (0.86, 0.69) turned
out to be the wall and the laptop's own keyboard -- not the screen -- while
the patch showing actual displayed photo content, with visible moiré
banding clearly present, scored 0.007 (confidently "real"). That patch's
`color_val_std` was ~0.64, near zero -- a very flat gradient region.
Checked directly rather than guessed: across all 3328 training patches,
the minimum `color_val_std` ever seen is 2.05 -- this patch's value is
*below the entire training distribution* (0th percentile). It isn't that
the classifier learned a bad shortcut from many examples of flat patches;
it's that this exact patch is a genuine out-of-distribution input the
tree-based model has never had grounds to learn from, and is effectively
extrapolating blindly on. That's a sharper, more actionable version of
"needs more data": specifically, screen recaptures with very
smooth/gradient content (skies, soft-focus backgrounds), not general
diversity.

The fix that came out of this diagnosis: weight each patch's contribution
to the image score by its own `fft_radial_peakiness` (raw feature
magnitude) instead of a flat mean, so patches with strong periodic signal
get more say. This is a different lever than the percentile/max experiment
below -- it weights by an independent physical measurement, not by the
classifier's own (sometimes wrong) confidence. Tested against the full
group-CV set before being adopted:

| aggregation | group-CV accuracy | precision | recall | random-split acc |
|---|---|---|---|---|
| flat mean | 0.808 | 0.721 | 0.776 | 0.923 |
| moiré-weighted (shipped) | **0.815** | **0.735** | 0.776 (unchanged) | **0.942** |

Every metric held or improved, nothing regressed -- adopted. Worth being
honest about its limits, though: re-checking the same two photos afterward,
one score didn't move at all and the other moved slightly in the *wrong*
direction (0.334 -> 0.317), because that specific low-confidence patch
happens to also have high raw FFT peakiness, so upweighting it pulled the
average further from correct. This aggregation change is a genuine average-case
win, not a fix for this specific failure mode -- the actual fix for
"smooth gradient content confuses the classifier" is training examples of
screen recaptures that include smooth gradient/sky content, which the
model doesn't currently have.

### What was tried and didn't work (kept here so it isn't re-tried blindly)

**Resolution normalization.** Different phones have different native
resolutions (iPhone 4032x3024, OnePlus 4096x2304), so a fixed 128x128 patch
covers a different fraction of the scene depending on device — a plausible
confound. Resizing every image to a common short-side before patching was
tested and made group-CV accuracy *worse* (0.808 → ~0.58-0.63). Reason:
moiré is fundamentally tied to the interaction between the *original*
sensor's native pixel grid and the screen's subpixel grid; downsizing acts
as a low-pass filter that washes out exactly that interference pattern
before it can be measured. The resolution difference is entangled with the
real signal, not just a confound — reverted.

**Sparse candidate patch grid.** To cut latency, the patch-candidate grid
was shrunk from "every possible 128x128 cell" to roughly `2 * max_patches`
candidates before blank-filtering. This silently hurt accuracy (0.808 →
~0.72) because blank-heavy photos (skies, plain walls — disproportionately
common in the `real/random photos` group) couldn't always find 16
non-blank survivors from the smaller candidate pool, quietly shrinking
their training data. Reverted to a dense candidate grid; latency is
dominated by JPEG decode (~88ms of ~178ms median, profiled directly) which
is not worth trading accuracy to shave further, especially since resizing
to speed up decode has the exact same downside as the resolution-fix
above.

**Percentile/max patch-score aggregation instead of mean.** (Predates the
moiré-weighted aggregation above -- at this point the baseline was still a
flat mean.) Fresh real-world test photos (loosely-framed laptop-screen
recaptures with a lot of bezel/desk/wall in shot) surfaced two misses where
only 2-5 of 16 patches scored above 0.5 — the patches landing on the actual
displayed photo did catch the signal, but got diluted by patches landing on
the (genuinely real) bezel/background. Switching the image-level
aggregation from mean to a high percentile or max was tested against the
full group-CV set, not just those two photos, to check whether it would
generalize:

| aggregation | group-CV accuracy | precision | recall |
|---|---|---|---|
| mean (baseline at the time) | **0.808** | 0.721 | 0.776 |
| 60th percentile | 0.789 | 0.682 | 0.824 |
| 75th percentile | 0.707 | 0.584 | 0.863 |
| 90th percentile | 0.594 | 0.505 | 0.904 |
| max | 0.529 | 0.470 | 0.949 |

Every alternative trades precision for recall and makes overall accuracy
*worse* — it would have fixed those two photos at the cost of flagging
more real photos as screens elsewhere. Rejected in favor of a flat mean at
the time; later superseded by moiré-weighted aggregation above, which is a
different mechanism (weights by an independent physical measurement, not
by the classifier's own confidence) and doesn't have this failure mode.
The underlying limitation (loose framing dilutes the patch average) is real
but is judged lower-risk than it first appears: someone *trying* to pass a
screen photo off as real has an incentive to crop tight and hide the
bezel (the bezel is the obvious visual tell), so this failure mode is more
likely in casual test photos than in actual fraud attempts.

**A whole-image bezel-darkness feature.** All 6 shipped features are
patch-level, with zero awareness of where in the frame a patch sits. A
plausible, distinct idea: a screen recapture often shows a dark, uniform
bezel margin framing a brighter, busier center -- a purely geometric signal
patch-level features can't see by construction. Implemented as two
whole-image scalars (center-vs-border brightness gap, fraction of
near-black border pixels), broadcast to every patch, and tested by adding
them to the shipped 6:

| feature set | group-CV accuracy | precision | recall |
|---|---|---|---|
| 6 features (shipped) | **0.815** | 0.735 | 0.776 |
| 6 + border-darkness (8 features) | 0.723 | 0.700 | 0.743 |

A 9-point accuracy drop, despite `border_darkness_gap` showing the
*highest* permutation importance of all 8 features (0.111, higher than
`fft_radial_peakiness`). That combination -- high average importance, but
negative in one fold (`[+0.193, +0.189, -0.043, +0.103]`) -- is the same
signature used to prune the original 19 candidate features down to 6: the
model leans on it heavily, but that reliance doesn't generalize. Likely
cause: border darkness is confounded with *setup*, not just device -- a
dark, uniform border shows up both from a bezel and from a real photo shot
against a dark background or with natural lens vignetting, and one
particular recapture setup (a room, a desk, a camera angle) has a very
consistent border signature the model can key on as "this specific setup"
rather than "a bezel." Rejected.

## What I'd improve with more time

- **More device/screen diversity**, not more total photos. The diagnostic
  evidence points specifically at real-photo generalization to unseen
  devices as the remaining gap, not at missing feature types or
  insufficient screen examples.
- A learned, calibrated cutoff threshold (Platt scaling / isotonic
  regression on the group-CV predictions) instead of a flat 0.5, and
  picking it based on the cost asymmetry SalesCode cares about (a missed
  recapture vs. a wrongly-flagged real photo are not equally bad).
- Edge/bezel detection (Hough lines) to catch recaptures where the screen
  frame is visible — left out of v1 to control scope and because it's easy
  to crop around.
- Nested cross-validation for the feature-pruning step itself: the 6
  shipped features were selected using the same 4 folds the accuracy is
  reported on, which is mildly optimistic. With more device-pairing
  diversity, a proper nested CV (select features on an inner loop, report
  accuracy on an untouched outer loop) would give a cleaner number.
