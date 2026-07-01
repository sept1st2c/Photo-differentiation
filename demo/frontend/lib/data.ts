// Single source of truth for every number shown on the demo page.
// All figures come directly from train.py / benchmark.py output -- see
// docs/EXPLAINED.md in the project root for the full run logs.

export const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:5000";

export const datasetComposition = [
  { group: "iPhone photos", label: "real", count: 30 },
  { group: "OnePlus photos", label: "real", count: 59 },
  { group: "Random photos", label: "real", count: 21 },
  { group: "iPhone screen (via OnePlus)", label: "screen", count: 7 },
  { group: "Laptop screen (via iPhone)", label: "screen", count: 15 },
  { group: "Laptop screen (via OnePlus)", label: "screen", count: 54 },
  { group: "OnePlus screen (via iPhone)", label: "screen", count: 7 },
  { group: "OnePlus-on-laptop (via OnePlus)", label: "screen", count: 15 },
];

export const totalReal = datasetComposition
  .filter((d) => d.label === "real")
  .reduce((a, b) => a + b.count, 0);
export const totalScreen = datasetComposition
  .filter((d) => d.label === "screen")
  .reduce((a, b) => a + b.count, 0);

// Cross-fold permutation importance for the 6 shipped features (mean across
// all held-out group-CV folds, hist_gboost).
export const featureImportance = [
  { feature: "fft_radial_peakiness", importance: 0.0877, group: "FFT / moiré" },
  { feature: "lbp_std", importance: 0.0556, group: "Texture (LBP)" },
  { feature: "fft_peak_to_mean", importance: 0.0462, group: "FFT / moiré" },
  { feature: "lbp_uniform_fraction", importance: 0.0366, group: "Texture (LBP)" },
  { feature: "noise_kurtosis", importance: 0.0205, group: "Noise residual" },
  { feature: "color_val_std", importance: 0.0083, group: "Color" },
];

// The iterative improvement story: pruning 19 candidate features down to
// the 6 with consistent-sign importance across every fold, then switching
// from a flat patch-score mean to a moiré-magnitude-weighted average.
export const iterationHistory = [
  { stage: "19 features", groupCV: 76.1, randomSplit: 90.4 },
  { stage: "6 features, mean agg.", groupCV: 80.8, randomSplit: 92.3 },
  { stage: "+ moiré-weighted agg. (shipped)", groupCV: 81.5, randomSplit: 94.2 },
];

// Ideas that looked reasonable and were tested, then reverted because they
// hurt the honest group-CV number -- plus the one that worked.
export const negativeExperiments = [
  { name: "Shipped (moiré-weighted aggregation, dense grid, full-res)", groupCV: 81.5, kept: true },
  { name: "Flat mean aggregation (previous baseline)", groupCV: 80.8, kept: false },
  { name: "Resolution normalization", groupCV: 63.1, kept: false },
  { name: "Sparse candidate patch grid", groupCV: 75.0, kept: false },
  { name: "90th-percentile score aggregation", groupCV: 59.4, kept: false },
  { name: "Max score aggregation", groupCV: 52.9, kept: false },
];

export const latencyBreakdown = [
  { stage: "JPEG decode (12MP)", ms: 88, pct: 49 },
  { stage: "Feature extraction", ms: 78, pct: 44 },
  { stage: "Classification", ms: 12, pct: 7 },
];

export const latencyStats = {
  medianMs: 178,
  p95Ms: 220,
  device: "Laptop CPU (AMD Ryzen, single-threaded)",
};

export const costPerImage = [
  { deployment: "On-device", costPerMillion: 0, note: "$0 marginal cost" },
  { deployment: "Cloud (serverless, 512MB)", costPerMillion: 1.75, note: "~$1.50-2 / million" },
];

export const classifierComparison = [
  { classifier: "Logistic Regression", groupCV: 76.6, randomSplit: 84.6 },
  { classifier: "Random Forest", groupCV: 79.2, randomSplit: 94.2 },
  { classifier: "HistGradientBoosting (shipped)", groupCV: 81.5, randomSplit: 94.2 },
];

export const freshTestResults = {
  realPhotosCorrect: 10,
  realPhotosTotal: 10,
  screenPhotosCorrect: 4,
  screenPhotosTotal: 6,
};

export const roadmap = [
  {
    title: "More device/screen diversity",
    detail:
      "Targeted at the specific gaps validation surfaces -- it names which device pairing is weak, not just an aggregate score.",
  },
  {
    title: "Calibrated, cost-aware cutoff",
    detail:
      "Pick the 0.5 threshold off a precision-recall curve sized to the real cost ratio (missed fraud vs. user friction) instead of a flat default.",
  },
  {
    title: "Nested cross-validation for feature selection",
    detail:
      "The 6 shipped features were chosen using the same folds the validation reports on -- a known, flagged source of mild optimism.",
  },
];
