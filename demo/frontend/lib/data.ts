// Single source of truth for every number shown on the demo page.
// All figures come directly from train.py / benchmark.py output -- see
// docs/EXPLAINED.md in the project root for the full run logs.

export const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:5000";

export const REPO_URL = "https://github.com/sept1st2c/Photo-differentiation";
export const BACKEND_LIVE_URL = "https://recapture-detector-backend.onrender.com";

export const datasetComposition = [
  { group: "iPhone photos", label: "real", count: 30 },
  { group: "OnePlus photos", label: "real", count: 59 },
  { group: "Random / stock photos", label: "real", count: 31 },
  { group: "iPhone screen (via OnePlus)", label: "screen", count: 7 },
  { group: "Laptop screen (via iPhone)", label: "screen", count: 15 },
  { group: "Laptop screen (via OnePlus)", label: "screen", count: 60 },
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
// all held-out group-CV folds, hist_gboost, final 224-image model).
export const featureImportance = [
  { feature: "fft_radial_peakiness", importance: 0.0978, group: "FFT / moiré" },
  { feature: "lbp_uniform_fraction", importance: 0.0760, group: "Texture (LBP)" },
  { feature: "fft_peak_to_mean", importance: 0.0574, group: "FFT / moiré" },
  { feature: "lbp_std", importance: 0.0552, group: "Texture (LBP)" },
  { feature: "noise_kurtosis", importance: 0.0327, group: "Noise residual" },
  { feature: "color_val_std", importance: 0.0129, group: "Color" },
];

// The iterative improvement story, condensed for the bar chart. Full detail
// is in `journey` below.
export const iterationHistory = [
  { stage: "19 features", groupCV: 76.1, randomSplit: 90.4 },
  { stage: "6 features, mean agg.", groupCV: 80.8, randomSplit: 92.3 },
  { stage: "+ moiré-weighted agg.", groupCV: 81.5, randomSplit: 94.2 },
  { stage: "+ targeted data (shipped)", groupCV: 84.7, randomSplit: 96.4 },
];

// Every attempt, in order, kept or not. This is the full "how much effort"
// story -- each one was tested against the full held-out validation set,
// not a handful of examples, before being kept or reverted.
export const journey = [
  {
    step: 1,
    title: "19 candidate features",
    metric: "76.1%",
    status: "baseline" as const,
    detail:
      "Every physically-plausible signal thrown in: FFT/moiré, LBP texture, noise residual, color, sharpness, JPEG blockiness, glare.",
  },
  {
    step: 2,
    title: "Pruned to 6 features",
    metric: "80.8%",
    status: "improved" as const,
    detail:
      "Kept only features with consistent-sign importance across every held-out fold. The other 11 were device-specific noise, not signal.",
  },
  {
    step: 3,
    title: "Tried: resolution normalization",
    metric: "63.1%",
    status: "reverted" as const,
    detail:
      "Looked like it would remove a device confound. Actually destroyed the moiré signal itself -- reverted.",
  },
  {
    step: 4,
    title: "Tried: sparser patch grid",
    metric: "75.0%",
    status: "reverted" as const,
    detail:
      "Cut latency, but silently starved blank-heavy photos of training data -- reverted.",
  },
  {
    step: 5,
    title: "Tried: percentile / max aggregation",
    metric: "52.9–59.4%",
    status: "reverted" as const,
    detail:
      "Would have fixed 2 specific misses at the cost of flagging more real photos elsewhere -- reverted.",
  },
  {
    step: 6,
    title: "Moiré-weighted aggregation",
    metric: "81.5%",
    status: "improved" as const,
    detail:
      "Weight each patch by its own moiré magnitude instead of a flat mean. Every metric improved, nothing regressed.",
  },
  {
    step: 7,
    title: "Tried: whole-image bezel-darkness feature",
    metric: "72.3%",
    status: "reverted" as const,
    detail:
      "Good idea -- patch features have no positional awareness. But importance flipped sign across folds: a setup-specific shortcut, not real signal -- reverted.",
  },
  {
    step: 8,
    title: "Added targeted training data",
    metric: "84.7%",
    status: "shipped" as const,
    detail:
      "2 phones, 3 screen types, +16 photos aimed at a diagnosed gap: screen recaptures with smooth-gradient content the model had never seen.",
  },
];

// Ideas that looked reasonable and were tested, then reverted because they
// hurt the honest group-CV number -- plus the one that shipped.
export const negativeExperiments = [
  { name: "Shipped (moiré-weighted agg. + targeted data)", groupCV: 84.7, kept: true },
  { name: "Before targeted training data", groupCV: 81.5, kept: false },
  { name: "Flat mean aggregation", groupCV: 80.8, kept: false },
  { name: "Whole-image bezel-darkness feature", groupCV: 72.3, kept: false },
  { name: "Sparse candidate patch grid", groupCV: 75.0, kept: false },
  { name: "Resolution normalization", groupCV: 63.1, kept: false },
  { name: "90th-percentile score aggregation", groupCV: 59.4, kept: false },
  { name: "Max score aggregation", groupCV: 52.9, kept: false },
];

export const latencyBreakdown = [
  { stage: "JPEG decode (12MP)", ms: 83, pct: 49 },
  { stage: "Feature extraction", ms: 75, pct: 44 },
  { stage: "Classification", ms: 12, pct: 7 },
];

export const latencyStats = {
  medianMs: 170,
  p95Ms: 217,
  device: "Laptop CPU (AMD Ryzen, single-threaded)",
};

export const costPerImage = [
  { deployment: "On-device", costPerMillion: 0, note: "$0 marginal cost" },
  { deployment: "Cloud (serverless, 512MB)", costPerMillion: 1.75, note: "~$1.50-2 / million" },
];

export const classifierComparison = [
  { classifier: "Logistic Regression", groupCV: 77.9, randomSplit: 85.7 },
  { classifier: "Random Forest", groupCV: 81.5, randomSplit: 94.6 },
  { classifier: "HistGradientBoosting (shipped)", groupCV: 84.7, randomSplit: 96.4 },
];

export const effortStats = [
  { value: 2, suffix: "", label: "phones used to shoot" },
  { value: 3, suffix: "", label: "screen types recaptured" },
  { value: 224, suffix: "", label: "training photos" },
  { value: 8, suffix: "", label: "device pairings, cross-validated" },
  { value: 6, suffix: "", label: "features shipped, of 19 tried" },
  { value: 8, suffix: "", label: "experiments run before shipping" },
];

export const techStack = [
  { name: "Python", role: "features.py, train.py, predict.py" },
  { name: "scikit-learn", role: "HistGradientBoosting classifier" },
  { name: "OpenCV / scikit-image", role: "FFT, LBP, patch extraction" },
  { name: "Flask", role: "backend API wrapping predict.py" },
  { name: "Next.js 16 + Tailwind", role: "this page" },
  { name: "Framer Motion", role: "animations" },
  { name: "Docker", role: "backend container" },
  { name: "Render", role: "backend deployment" },
  { name: "Vercel", role: "frontend deployment" },
];

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
