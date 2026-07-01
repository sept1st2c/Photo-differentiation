import ClassifierComparisonChart from "@/components/ClassifierComparisonChart";
import CostChart from "@/components/CostChart";
import DatasetChart from "@/components/DatasetChart";
import EffortStats from "@/components/EffortStats";
import FeatureImportanceChart from "@/components/FeatureImportanceChart";
import Journey from "@/components/Journey";
import LatencyChart from "@/components/LatencyChart";
import PipelineDiagram from "@/components/PipelineDiagram";
import Reveal from "@/components/Reveal";
import Roadmap from "@/components/Roadmap";
import { Card, SectionHeading, StatCard } from "@/components/Section";
import TechStack from "@/components/TechStack";
import TryItYourself from "@/components/TryItYourself";
import { latencyStats } from "@/lib/data";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-5xl px-6 sm:px-10">
      {/* Hero — compact on purpose: the live demo below should be reachable
          with barely any scroll, since not every reviewer scrolls far. */}
      <div className="pt-14 pb-8 sm:pt-20">
        <span className="text-xs font-semibold uppercase tracking-widest text-emerald-400">
          Spot the Fake Photo — SalesCode AI take-home
        </span>
        <h1 className="mt-4 text-4xl font-bold leading-[1.05] text-white sm:text-5xl">
          Is this photo real, or a photo of a screen?
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-slate-400">
          A fullstack build, not just a notebook — try it right now below, then scroll for the
          data and decisions behind it.
        </p>
      </div>

      {/* 1. The live demo — camera + batch, together, first thing on the page */}
      <section id="demo" className="mb-16">
        <Reveal>
          <TryItYourself />
        </Reveal>
      </section>

      {/* Effort stats — the "how much work went into this" bar */}
      <section id="stats" className="mb-24">
        <Reveal>
          <EffortStats />
        </Reveal>
      </section>

      {/* 2. Required numbers: latency + cost */}
      <section id="performance" className="mb-24">
        <Reveal>
          <SectionHeading
            eyebrow="Required numbers"
            title="Latency & cost per image"
            description="Small, fast, cheap — measured directly, not estimated."
          />
        </Reveal>
        <div className="grid gap-6 md:grid-cols-2">
          <Reveal delay={0.05}>
            <Card>
              <h3 className="mb-4 text-sm font-semibold text-slate-300">Latency breakdown</h3>
              <LatencyChart />
            </Card>
          </Reveal>
          <Reveal delay={0.15}>
            <Card>
              <h3 className="mb-4 text-sm font-semibold text-slate-300">Cost per image</h3>
              <CostChart />
            </Card>
          </Reveal>
        </div>
        <Reveal delay={0.1} className="mt-6 grid gap-4 sm:grid-cols-3">
          <StatCard label="Median latency" value={`${latencyStats.medianMs}ms`} sub={latencyStats.device} />
          <StatCard label="p95 latency" value={`${latencyStats.p95Ms}ms`} sub="50-image benchmark" />
          <StatCard label="On-device cost" value="$0" sub="per image, marginal" />
        </Reveal>
      </section>

      {/* 2b. Built like a real product */}
      <section id="stack" className="mb-24">
        <Reveal>
          <SectionHeading
            eyebrow="Fullstack"
            title="Built and shipped like a real product"
            description="Not just predict.py in a folder — a Python ML backend containerized with Docker, a Next.js frontend, both deployed and live right now."
          />
        </Reveal>
        <Reveal delay={0.1}>
          <TechStack />
        </Reveal>
      </section>

      {/* 3. Approach */}
      <section id="approach" className="mb-24">
        <Reveal>
          <SectionHeading
            eyebrow="Approach"
            title="Why handcrafted features, not a CNN"
            description="At 224 photos across 8 device pairings, a CNN would memorize device fingerprints instead of the recapture signal. A small feature vector physically can't."
          />
        </Reveal>
        <Reveal delay={0.1} className="mb-8">
          <Card>
            <PipelineDiagram />
          </Card>
        </Reveal>
        <Reveal delay={0.2}>
          <Card>
            <h3 className="mb-4 text-sm font-semibold text-slate-300">
              Cross-fold feature importance (why these 6 features)
            </h3>
            <FeatureImportanceChart />
          </Card>
        </Reveal>
      </section>

      {/* 4. Training & validation */}
      <section id="training" className="mb-24">
        <Reveal>
          <SectionHeading
            eyebrow="Training"
            title="The dataset & how it's validated"
            description="Self-collected across multiple device pairings. Evaluated with group k-fold cross-validation, which holds out an entire device pairing per fold — the same shape of test SalesCode's held-out photos represent."
          />
        </Reveal>
        <Reveal delay={0.1} className="mb-8">
          <Card>
            <h3 className="mb-4 text-sm font-semibold text-slate-300">Dataset composition</h3>
            <DatasetChart />
          </Card>
        </Reveal>
        <Reveal delay={0.2}>
          <Card>
            <h3 className="mb-4 text-sm font-semibold text-slate-300">Classifier comparison</h3>
            <ClassifierComparisonChart />
          </Card>
        </Reveal>
      </section>

      {/* 5. The journey: every attempt, kept or reverted */}
      <section id="journey" className="mb-24">
        <Reveal>
          <SectionHeading
            eyebrow="The full journey"
            title="Every attempt, in order — kept or reverted"
            description="Each step was tested against the full held-out validation set, not a handful of examples. Several plausible-looking ideas were reverted after they measured worse."
          />
        </Reveal>
        <Reveal delay={0.1}>
          <Card>
            <Journey />
          </Card>
        </Reveal>
      </section>

      {/* 6. What's next */}
      <section id="roadmap" className="mb-8">
        <Reveal>
          <SectionHeading eyebrow="What's next" title="What I'd improve with more time" />
        </Reveal>
        <Reveal delay={0.1}>
          <Roadmap />
        </Reveal>
      </section>

      <footer className="mt-20 border-t border-white/10 pt-8 pb-16 text-xs text-slate-500">
        Full methodology, rejected experiments, and per-feature physical reasoning:{" "}
        <code className="rounded bg-white/5 px-1.5 py-0.5">docs/EXPLAINED.md</code> in the project
        repo.
      </footer>
    </main>
  );
}
