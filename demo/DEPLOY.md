# Deploying the demo

Two independent pieces: a static Next.js frontend, and a small Python
backend that needs to stay running (it holds the sklearn model in memory).

## Frontend -> Vercel

Built by the team that makes Next.js; zero-config for this app.

1. Push the repo to GitHub.
2. [vercel.com/new](https://vercel.com/new) -> import the repo -> set
   **Root Directory** to `demo/frontend`.
3. Add an environment variable: `NEXT_PUBLIC_BACKEND_URL` = the backend's
   public URL (from whichever option below you pick).
4. Deploy. Vercel auto-builds on every push after that.

Free tier covers this comfortably -- it's a handful of static pages.

## Backend -> pick one

The backend is a plain Flask app wrapping `predict()`. No GPU, CPU-only,
~178ms/request -- any of these work. Root-level `Dockerfile` builds it from
the actual `predict.py`/`features.py`/`models/` (see `docker build -t
recapture-detector .` from the project root, or let the platform build it
directly from the Dockerfile it finds in the repo).

| Option | Cost | Setup | Notes |
|---|---|---|---|
| **Render** (web service) | Free tier | Point it at the repo + Dockerfile, done | Free tier sleeps after 15min idle -- first request after a nap takes ~30-50s to wake. Fine for an interview demo, not for production. |
| **Google Cloud Run** | Pay-per-request, scales to zero | `gcloud run deploy` with the Dockerfile | Matches the cost-per-image story already in `NOTE.md` almost exactly -- this is the "real" answer if asked how it'd run at scale. Needs a GCP account + billing enabled (free tier covers light use). |
| **Fly.io** | Free allowance | `fly launch` picks up the Dockerfile automatically | Always-on within the free allowance, no cold start, more setup than Render. |
| **A cheap VM** (Lightsail/DO droplet) | ~$4-6/mo flat | SSH in, `docker run`, done | Simplest mental model, but a fixed monthly cost instead of scale-to-zero -- worse fit for something judged on cost-per-image. |

**Recommendation for this use case:** Render for the quickest working link
to send an interviewer, or Cloud Run if you want the deployed cost model to
literally match what `NOTE.md` claims about cloud pricing.

Either way, after the backend is live:
1. Copy its public URL.
2. Set that as `NEXT_PUBLIC_BACKEND_URL` in Vercel (see above) and redeploy
   the frontend.
3. Confirm CORS -- `server.py` already calls `CORS(app)` with no origin
   restriction, which is fine for a demo but worth tightening to the actual
   Vercel domain if this becomes anything more permanent.

## What I can't do from here

Every option above needs an account (GitHub/Vercel/Render/GCP/Fly) and a
login I don't have access to. I can walk through any of these step by step
if you share screen output as you go, or you can follow the table above
directly -- but I can't create accounts or push to hosting providers on
your behalf without you driving that part.
