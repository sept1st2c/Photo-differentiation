# Spot the Fake Photo

Given one photo, decide whether it's a **real photo** or a **photo of a screen**
(someone recapturing a phone/laptop display instead of the real thing). Take-home
for SalesCode AI — full brief in `ASSIGNMENT.pdf`.

**Approach:** handcrafted physical features (moiré, screen subpixel texture, noise
residual, color) feeding a small scikit-learn classifier — no deep learning, no GPU,
~178ms/image, $0 marginal cost on-device.

**Live demo:** [photo-differentiation.vercel.app](https://photo-differentiation.vercel.app/)
— camera + batch-upload testing against the real pipeline.

## Quick start

```bash
pip install -r requirements.txt
python predict.py path/to/image.jpg   # prints a float in [0, 1]
```

## Read this first

| Doc | What's in it |
|---|---|
| **[NOTE.md](NOTE.md)** | The submission note — approach, latency, cost, what I'd improve. Start here. |
| **[docs/EXPLAINED.md](docs/EXPLAINED.md)** | Full methodology: what each feature measures and why, the validation approach, and every experiment that was tried and reverted (with numbers). |
| **[demo/README.md](demo/README.md)** | Running the live camera + batch-test demo locally. |
| **[demo/DEPLOY.md](demo/DEPLOY.md)** | How the demo is deployed (Vercel + Render), and how to redeploy it. |

## Project structure

```
predict.py              -- the required interface: python predict.py image.jpg -> float
features.py              -- patch extraction + the 6 shipped features
train.py                  -- group k-fold CV, classifier comparison, trains + saves the final model
sanity_check.py           -- score every image in a folder (for fresh/held-out photos)
benchmark.py               -- latency benchmark (median/p95, reports device)
inspect_features.py         -- per-patch feature dump + real-vs-screen effect sizes

data/                      -- training photos: real/ and screen/, by device pairing
models/model.joblib          -- the trained classifier predict.py loads

docs/EXPLAINED.md            -- full methodology writeup
NOTE.md                       -- the submission note

demo/                          -- live camera + batch-test web demo (optional bonus)
  backend/server.py               -- Flask wrapper around predict.py (no reimplementation)
  frontend/                        -- Next.js page: camera demo, batch tester, data/decisions charts

Dockerfile, render.yaml, .dockerignore   -- deploying demo/backend/
```

## Running the full pipeline

```bash
python inspect_features.py                # sanity-check feature separation before training
python train.py                            # group k-fold CV + trains + saves models/model.joblib
python sanity_check.py path/to/folder      # score a folder of fresh (non-training) images
python benchmark.py                        # latency: median/p95 over 50 images
```

## Results, honestly

Group k-fold cross-validation (each fold holds out an entire device pairing —
e.g. every "laptop screen via OnePlus" photo — to measure generalization to
unseen devices, not memorization of these specific phones). The full numbers,
including two ideas that looked reasonable and were reverted after measuring
worse, are in `docs/EXPLAINED.md`.

## Dependencies

`numpy`, `scipy`, `opencv-python`, `scikit-learn`, `scikit-image`, `joblib` —
pinned in `requirements.txt` to the exact versions the shipped model was
trained with (sklearn pickles are version-sensitive; this bit us once during
deployment, see the git history for `requirements.txt`).
