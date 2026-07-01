"""Patch-level feature extraction for screen-recapture detection.

Each image is split into patches; each patch yields a feature vector from
7 physically-grounded groups (FFT, LBP texture, noise residual, color,
sharpness, JPEG blockiness, glare). See docs/EXPLAINED.md for the reasoning
behind each one.
"""

import cv2
import numpy as np
import pywt
from scipy.stats import kurtosis
from skimage.feature import local_binary_pattern

PATCH_SIZE = 128
MAX_PATCHES = 16
BLANK_STD_THRESHOLD = 5.0  # skip near-uniform patches (walls, sky, blown highlights)

ALL_FEATURE_NAMES = [
    "fft_high_freq_ratio", "fft_peak_to_mean", "fft_radial_peakiness",        # 0-2
    "lbp_entropy", "lbp_uniform_fraction", "lbp_hist_std", "lbp_std",          # 3-6
    "noise_std", "noise_kurtosis", "noise_energy",                              # 7-9
    "color_sat_mean", "color_sat_std", "color_val_std", "color_rg_corr", "color_gb_corr",  # 10-14
    "sharpness_lap_var",                                                         # 15
    "jpeg_blockiness",                                                           # 16
    "glare_highlight_frac", "glare_shadow_frac",                                # 17-18
    "wavelet_d1_mean", "wavelet_d1_std", "wavelet_d1_kurt",                    # 19-21
    "wavelet_d2_mean", "wavelet_d2_std", "wavelet_d2_kurt",                    # 22-24
    "wavelet_hv_ratio",                                                          # 25
]

# Kept features = positive permutation importance in every held-out group-CV fold (see
# docs/EXPLAINED.md). The other 11 were near-zero or flipped sign between folds -- noise
# the classifier could fit per-device rather than genuine recapture signal.
# Wavelet features added for evaluation -- will prune after seeing per-fold importance.
FEATURE_NAMES = [
    "fft_peak_to_mean", "fft_radial_peakiness",
    "lbp_uniform_fraction", "lbp_std",
    "noise_kurtosis",
    "color_val_std",
    "wavelet_hv_ratio",
]
SELECTED_INDICES = [ALL_FEATURE_NAMES.index(name) for name in FEATURE_NAMES]


def extract_patches(image, patch_size=PATCH_SIZE, max_patches=MAX_PATCHES):
    """Grid-split a BGR image into patches, skipping near-blank ones.

    Returns a list of (patch_bgr, patch_gray) tuples -- grayscale is computed once
    here (needed for the blank check anyway) and reused by the feature functions.
    """
    h, w = image.shape[:2]
    if h < patch_size or w < patch_size:
        scale = patch_size / min(h, w)
        image = cv2.resize(image, (int(w * scale) + 1, int(h * scale) + 1))
        h, w = image.shape[:2]

    n_rows = max(1, h // patch_size)
    n_cols = max(1, w // patch_size)
    ys = np.linspace(0, h - patch_size, n_rows).astype(int)
    xs = np.linspace(0, w - patch_size, n_cols).astype(int)

    patches = []
    for y in ys:
        for x in xs:
            patch = image[y:y + patch_size, x:x + patch_size]
            gray = cv2.cvtColor(patch, cv2.COLOR_BGR2GRAY)
            if gray.std() < BLANK_STD_THRESHOLD:
                continue
            patches.append((patch, gray))

    if not patches:
        # whole image was flat (e.g. a test swatch) -- fall back to center crop
        cy, cx = (h - patch_size) // 2, (w - patch_size) // 2
        patch = image[cy:cy + patch_size, cx:cx + patch_size]
        patches = [(patch, cv2.cvtColor(patch, cv2.COLOR_BGR2GRAY))]

    if len(patches) > max_patches:
        idx = np.linspace(0, len(patches) - 1, max_patches).astype(int)
        patches = [patches[i] for i in idx]

    return patches


def fft_features(gray):
    """Energy/peakiness away from DC -- moire shows up as off-axis spectral peaks."""
    f = np.fft.fft2(gray.astype(np.float64))
    mag_log = np.log1p(np.abs(np.fft.fftshift(f)))

    h, w = gray.shape
    cy, cx = h // 2, w // 2
    yy, xx = np.ogrid[:h, :w]
    r = np.sqrt((yy - cy) ** 2 + (xx - cx) ** 2)
    dc_mask = r < 4  # exclude DC and its immediate neighborhood

    ac = mag_log[~dc_mask]
    total_energy = mag_log.sum() + 1e-8
    high_freq_ratio = ac.sum() / total_energy
    peak_to_mean = ac.max() / (ac.mean() + 1e-8)

    r_int = r.astype(int)
    max_r = max(int(r_int.max()), 5)
    step = max(1, max_r // 32)
    radial_means = []
    for k in range(4, max_r, step):
        ring = mag_log[(r_int == k) & (~dc_mask)]
        radial_means.append(ring.mean() if ring.size else 0.0)
    radial_means = np.array(radial_means)
    radial_peakiness = radial_means.std() / (radial_means.mean() + 1e-8)

    return np.array([high_freq_ratio, peak_to_mean, radial_peakiness])


def lbp_features(gray, P=8, R=1):
    """Local binary pattern histogram stats -- screens impose a subpixel micro-texture."""
    lbp = local_binary_pattern(gray, P, R, method="uniform")
    n_bins = P + 2
    hist, _ = np.histogram(lbp, bins=n_bins, range=(0, n_bins), density=True)
    hist = hist + 1e-8
    entropy = -np.sum(hist * np.log(hist))
    uniform_fraction = hist[:-1].sum()  # bins 0..P-1 are "uniform" patterns; last bin is everything else
    return np.array([entropy, uniform_fraction, hist.std(), lbp.std()])


def noise_residual_features(gray):
    """Stats of (patch - blurred patch) -- recaptures stack two sensors' noise."""
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    residual = gray.astype(np.float64) - blurred.astype(np.float64)
    std = residual.std()
    kurt = kurtosis(residual.ravel(), fisher=True)
    energy = np.mean(residual ** 2)
    return np.array([std, kurt, energy])


def color_features(bgr):
    """Saturation stats + channel correlation -- screens have narrower gamut / gamma shifts."""
    hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV)
    sat = hsv[:, :, 1].astype(np.float64)
    val = hsv[:, :, 2].astype(np.float64)
    b, g, r = (bgr[:, :, i].astype(np.float64) for i in range(3))

    rg_corr = np.corrcoef(r.ravel(), g.ravel())[0, 1]
    gb_corr = np.corrcoef(g.ravel(), b.ravel())[0, 1]

    return np.array([sat.mean(), sat.std(), val.std(), rg_corr, gb_corr])


def sharpness_features(gray):
    """Variance of Laplacian -- a coarse focus/detail proxy."""
    lap = cv2.Laplacian(gray, cv2.CV_64F)
    return np.array([lap.var()])


def jpeg_block_features(gray):
    """Pixel-difference ratio at 8x8 block boundaries vs interior -- double-compression signature."""
    gray = gray.astype(np.float64)
    h, w = gray.shape

    cols = np.arange(1, w)
    bcols, icols = cols[cols % 8 == 0], cols[cols % 8 != 0]
    h_boundary = np.abs(gray[:, bcols] - gray[:, bcols - 1]).mean() if bcols.size else 0.0
    h_interior = np.abs(gray[:, icols] - gray[:, icols - 1]).mean() if icols.size else 1e-8

    rows = np.arange(1, h)
    brows, irows = rows[rows % 8 == 0], rows[rows % 8 != 0]
    v_boundary = np.abs(gray[brows, :] - gray[brows - 1, :]).mean() if brows.size else 0.0
    v_interior = np.abs(gray[irows, :] - gray[irows - 1, :]).mean() if irows.size else 1e-8

    blockiness = ((h_boundary / h_interior) + (v_boundary / v_interior)) / 2
    return np.array([blockiness])


def glare_features(bgr):
    """Clipped highlight / shadow fraction -- recaptures often show glare off the screen."""
    gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY).astype(np.float64)
    highlight_frac = np.mean(gray > 250)
    shadow_frac = np.mean(gray < 5)
    return np.array([highlight_frac, shadow_frac])


def wavelet_features(gray):
    """Multi-scale Haar wavelet subband statistics.

    Moiré creates a periodic beat frequency that shows up as elevated energy in the
    diagonal detail subband (cD) at the level whose frequency matches the beat.
    Level 1 catches high-frequency moiré (fine pixel grid), level 2 catches
    lower-frequency moiré (coarser grid or photographed from farther away).
    H/V energy ratio captures anisotropy -- screen content is often directional
    (horizontal scan lines, text rows) in a way natural scenes aren't.
    """
    g = gray.astype(np.float64)
    cA1, (cH1, cV1, cD1) = pywt.dwt2(g, "haar")
    cA2, (cH2, cV2, cD2) = pywt.dwt2(cA1, "haar")

    d1 = np.abs(cD1).ravel()
    d2 = np.abs(cD2).ravel()
    hv_ratio = np.abs(cH1).mean() / (np.abs(cV1).mean() + 1e-8)

    return np.array([
        d1.mean(), d1.std(), kurtosis(d1, fisher=True),   # 19-21
        d2.mean(), d2.std(), kurtosis(d2, fisher=True),   # 22-24
        hv_ratio,                                          # 25
    ])


def extract_patch_features(patch, gray=None):
    """Concatenate all feature groups (indices must stay aligned with ALL_FEATURE_NAMES), then select FEATURE_NAMES subset."""
    if gray is None:
        gray = cv2.cvtColor(patch, cv2.COLOR_BGR2GRAY)
    feats = np.concatenate([
        fft_features(gray),              # 0-2
        lbp_features(gray),              # 3-6
        noise_residual_features(gray),   # 7-9
        color_features(patch),           # 10-14
        sharpness_features(gray),        # 15
        jpeg_block_features(gray),       # 16
        glare_features(patch),           # 17-18
        wavelet_features(gray),          # 19-25
    ])
    feats = np.nan_to_num(feats, nan=0.0, posinf=0.0, neginf=0.0)
    return feats[SELECTED_INDICES]


def extract_image_features(image_path, patch_size=PATCH_SIZE, max_patches=MAX_PATCHES):
    """Read an image, split into patches, return an (n_patches, n_features) array."""
    image = cv2.imread(str(image_path))
    if image is None:
        raise ValueError(f"could not read image: {image_path}")
    patches = extract_patches(image, patch_size=patch_size, max_patches=max_patches)
    return np.stack([extract_patch_features(patch, gray) for patch, gray in patches])


_FFT_PEAK_INDEX = FEATURE_NAMES.index("fft_radial_peakiness")


def aggregate_patch_scores(patch_probs, patch_feats):
    """Combine per-patch P(screen) into one image score.

    Weighted by each patch's own moiré magnitude (fft_radial_peakiness) rather than
    a flat mean -- patches with stronger periodic signal get more say. Validated via
    group k-fold CV: +0.7pp accuracy over a flat mean with no recall cost (see
    docs/EXPLAINED.md). Not a fix for every patch-level miscall -- a patch can still
    have high peakiness for reasons other than screen moiré (any real periodic
    texture does this too) -- but it's a small, tested win on average.
    """
    weights = np.clip(patch_feats[:, _FFT_PEAK_INDEX], 1e-6, None)
    return float(np.average(patch_probs, weights=weights))
