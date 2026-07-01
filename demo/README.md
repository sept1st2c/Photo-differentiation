# Live demo

A Next.js page with a live camera feed scoring against the real `predict.py`
pipeline, plus the data/decisions behind the model (charts, not just prose).

## Run it

Two processes, in two terminals, from the project root:

```bash
# 1. Backend -- wraps predict.py, keeps the model warm in memory
pip install -r demo/backend/requirements.txt   # if not already installed
python demo/backend/server.py                   # serves :5000

# 2. Frontend
cd demo/frontend
npm install                    # first time only
npm run dev                    # serves :3000
```

Open `http://localhost:3000`.

- **Live camera**: click **Start camera**, grant permission, point it at
  something real, then at a screen showing a photo. Score updates roughly
  every 1.2s.
- **Batch test**: click **Select images** (multi-file picker) or
  **Select a folder** (grabs every image in a directory at once), or just
  drag a batch of photos onto the drop zone. Each image is sent to the same
  `/predict` endpoint one at a time, with a live scoreboard, a sortable
  per-file table (filename / score / verdict / latency), and running
  totals -- built for exactly this: handing the interviewer a folder of
  held-out photos and letting them watch it work.

Both paths call the same backend endpoint, which calls `predict()` directly
-- no reimplementation, so the demo can never show a different result than
running `python predict.py` would.

## Why a Python backend instead of running everything in the browser

The classifier is a scikit-learn model (HistGradientBoosting) -- porting
feature extraction (FFT, LBP, etc.) to run client-side would mean
reimplementing `features.py` in JS/WASM, which risks silently diverging from
what actually gets graded. The Flask backend is ~40 lines and imports
`predict.py` directly, so the demo can never show a different result than the
CLI would.
