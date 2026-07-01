import BatchTest from "@/components/BatchTest";
import CameraDemo from "@/components/CameraDemo";
import ClassifierComparisonChart from "@/components/ClassifierComparisonChart";
import CostChart from "@/components/CostChart";
import DatasetChart from "@/components/DatasetChart";
import FeatureImportanceChart from "@/components/FeatureImportanceChart";
import FreshTestChart from "@/components/FreshTestChart";
import IterationChart from "@/components/IterationChart";
import LatencyChart from "@/components/LatencyChart";
import NegativeExperimentsChart from "@/components/NegativeExperimentsChart";
import PipelineDiagram from "@/components/PipelineDiagram";
import Roadmap from "@/components/Roadmap";
import { Card, SectionHeading, StatCard } from "@/components/Section";
import { latencyStats } from "@/lib/data";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-16 sm:px-10">
      {/* Hero */}
      <div className="mb-16">
        <span className="text-xs font-semibold uppercase tracking-widest text-emerald-400">
          Spot the Fake Photo
        </span>
        <h1 className="mt-3 text-4xl font-bold text-white sm:text-5xl">
          Real photo, or a photo of a screen?
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-slate-400">
          A handcrafted-feature classifier — no deep learning, no GPU — that scores whether a
          photo was captured directly or recaptured off a display. Point your camera below and
          watch it score live, then see the data and decisions behind it.
        </p>
      </div>

      {/* 1. Live camera demo — the headline feature */}
      <section id="demo" className="mb-24">
        <SectionHeading
          eyebrow="Live"
          title="Try it with your camera"
          description="Runs the exact predict.py pipeline on live frames. Point it at something real, then at a laptop or phone screen showing a photo."
        />
        <CameraDemo />
      </section>

      {/* 1b. Batch test — for throwing a folder of held-out photos at it */}
      <section id="batch" className="mb-24">
        <SectionHeading
          eyebrow="Batch"
          title="Test it against your own photos"
          description="Drop in as many images as you like — each one is scored by the same pipeline, one request at a time, with a running scoreboard."
        />
        <Card>
          <BatchTest />
        </Card>
      </section>

      {/* 2. Required numbers: latency + cost */}
      <section id="performance" className="mb-24">
        <SectionHeading
          eyebrow="Required numbers"
          title="Latency & cost per image"
          description="Small, fast, cheap — measured directly, not estimated."
        />
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <h3 className="mb-4 text-sm font-semibold text-slate-300">Latency breakdown</h3>
            <LatencyChart />
          </Card>
          <Card>
            <h3 className="mb-4 text-sm font-semibold text-slate-300">Cost per image</h3>
            <CostChart />
          </Card>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <StatCard label="Median latency" value={`${latencyStats.medianMs}ms`} sub={latencyStats.device} />
          <StatCard label="p95 latency" value={`${latencyStats.p95Ms}ms`} sub="50-image benchmark" />
          <StatCard label="On-device cost" value="$0" sub="per image, marginal" />
        </div>
      </section>

      {/* 3. Approach */}
      <section id="approach" className="mb-24">
        <SectionHeading
          eyebrow="Approach"
          title="Why handcrafted features, not a CNN"
          description="At ~200 photos across 5-6 device pairings, a CNN would memorize device fingerprints instead of the recapture signal. A small feature vector physically can't."
        />
        <Card className="mb-8">
          <PipelineDiagram />
        </Card>
        <Card>
          <h3 className="mb-4 text-sm font-semibold text-slate-300">
            Cross-fold feature importance (why these 6 features)
          </h3>
          <FeatureImportanceChart />
        </Card>
      </section>

      {/* 4. Training & validation */}
      <section id="training" className="mb-24">
        <SectionHeading
          eyebrow="Training"
          title="The dataset & how it's validated"
          description="Self-collected across multiple device pairings. Evaluated with group k-fold cross-validation, which holds out an entire device pairing per fold — the same shape of test SalesCode's held-out photos represent."
        />
        <Card className="mb-8">
          <h3 className="mb-4 text-sm font-semibold text-slate-300">Dataset composition</h3>
          <DatasetChart />
        </Card>
        <Card>
          <h3 className="mb-4 text-sm font-semibold text-slate-300">Classifier comparison</h3>
          <ClassifierComparisonChart />
        </Card>
      </section>

      {/* 5. What we learned: iteration + what went wrong */}
      <section id="learnings" className="mb-24">
        <SectionHeading
          eyebrow="What we learned"
          title="What went right, and what didn't"
          description="Every experiment below was tested against the full validation set, not a handful of examples — several plausible-looking ideas were reverted after they measured worse."
        />
        <div className="grid gap-8 lg:grid-cols-2">
          <Card>
            <h3 className="mb-4 text-sm font-semibold text-slate-300">
              Feature pruning improved both numbers
            </h3>
            <IterationChart />
          </Card>
          <Card>
            <h3 className="mb-4 text-sm font-semibold text-slate-300">
              Ideas tried and reverted
            </h3>
            <NegativeExperimentsChart />
          </Card>
        </div>
        <Card className="mt-8">
          <h3 className="mb-4 text-sm font-semibold text-slate-300">
            Fresh-data sanity check (post-training, never trained on)
          </h3>
          <FreshTestChart />
        </Card>
      </section>

      {/* 6. What's next */}
      <section id="roadmap" className="mb-8">
        <SectionHeading eyebrow="What's next" title="What I'd improve with more time" />
        <Roadmap />
      </section>

      <footer className="mt-20 border-t border-white/10 pt-8 text-xs text-slate-500">
        Full methodology, rejected experiments, and per-feature physical reasoning:{" "}
        <code className="rounded bg-white/5 px-1.5 py-0.5">docs/EXPLAINED.md</code> in the project
        repo.
      </footer>
    </main>
  );
}
