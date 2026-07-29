"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";

const TRUST_ITEMS = [
  { value: "< 30s", label: "Typical analysis time" },
  { value: "Hash-only", label: "Stored on Monad" },
  { value: "No wallet", label: "Needed to analyze" },
];

const FEATURES = [
  {
    title: "Plain-English briefings",
    copy: "Dense legal language becomes a scored briefing with risks, obligations, and key dates.",
  },
  {
    title: "Privacy by design",
    copy: "Contract text never leaves your session. Only a SHA-256 fingerprint can go on-chain.",
  },
  {
    title: "Tamper detection",
    copy: "Verify any file against its Monad proof — even a single changed byte breaks the match.",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Upload",
    copy: "Drop a PDF, DOCX, or TXT. Analysis starts immediately — no signup required.",
  },
  {
    n: "02",
    title: "Review",
    copy: "Inspect health scores, flagged clauses, parties, and obligations in one view.",
  },
  {
    n: "03",
    title: "Prove",
    copy: "Optionally anchor the document hash on Monad with a managed signer or your wallet.",
  },
];

const fadeUp = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
};

export default function Home() {
  const input = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);

  async function start(file?: File) {
    if (!file || loading) return;
    setLoading(true);
    const body = new FormData();
    body.append("file", file);
    const response = await fetch("/api/analyze", { method: "POST", body });
    const data = await response.json();
    if (!response.ok) {
      setLoading(false);
      toast.error(data.error || "Analysis failed");
      return;
    }
    toast.success(
      data.proof
        ? "Analysis ready — already secured on Monad"
        : "Analysis ready",
    );
    router.push(`/analyze?id=${data.id}`);
  }

  return (
    <div className="landing">
      <header className="landing-top shell">
        <nav className="landing-nav" aria-label="Primary">
          <BrandLogo />
          <div className="landing-nav-actions">
            <Link className="landing-nav-link" href="/verify">
              Verify
            </Link>
            <Link className="landing-nav-cta" href="/analyze">
              Analyze contract
            </Link>
          </div>
        </nav>
      </header>

      <section className="landing-hero shell">
        <div className="landing-hero-grid">
          <motion.div
            className="landing-hero-copy"
            {...fadeUp}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="eyebrow">Contract intelligence, with proof</div>
            <h1>
              Understand every contract.
              <span> Prove every version.</span>
            </h1>
            <p>
              Provenn turns agreements into plain-English briefings, then lets
              you anchor an immutable hash on Monad — without putting the
              document itself on-chain.
            </p>
            <div className="landing-hero-actions">
              <Button
                size="lg"
                type="button"
                disabled={loading}
                onClick={() => input.current?.click()}
              >
                {loading ? "Analyzing…" : "Upload contract"}
              </Button>
              <Button size="lg" variant="secondary" asChild>
                <Link href="/verify">Verify a document</Link>
              </Button>
            </div>
          </motion.div>

          <motion.div
            className={`landing-dropzone ${dragging ? "dragging" : ""} ${loading ? "is-loading" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              if (!loading) setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              start(e.dataTransfer.files[0]);
            }}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.1,
              duration: 0.6,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <div className="landing-dropzone-glow" aria-hidden />
            <div className="landing-dropzone-icon" aria-hidden>
              {loading ? "…" : "↑"}
            </div>
            <div className="landing-dropzone-title">
              {loading
                ? "Reading your contract"
                : dragging
                  ? "Drop to analyze"
                  : "Drop your contract here"}
            </div>
            <p className="landing-dropzone-copy">
              {loading
                ? "Extracting text and mapping risks…"
                : "PDF, DOCX, or TXT up to 15 MB"}
            </p>
            {!loading && (
              <button
                className="landing-dropzone-btn"
                type="button"
                onClick={() => input.current?.click()}
              >
                {dragging ? "Release to upload" : "Browse files"}
              </button>
            )}
            {loading && <div className="landing-dropzone-progress" aria-hidden />}
          </motion.div>
        </div>
      </section>

      <section className="landing-trust" aria-label="Highlights">
        <div className="shell landing-trust-grid">
          {TRUST_ITEMS.map((item, i) => (
            <motion.div
              key={item.label}
              className="landing-trust-item"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, duration: 0.35 }}
            >
              <strong>{item.value}</strong>
              <span>{item.label}</span>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="landing-showcase shell">
        <motion.div
          className="landing-showcase-panel"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
        >
          <div className="landing-showcase-copy">
            <div className="eyebrow landing-showcase-eyebrow">
              Live briefing preview
            </div>
            <h2>Risks surfaced before you sign.</h2>
            <p>
              Every analysis includes a health score, severity-tagged risks,
              and a downloadable report — so you know exactly what deserves a
              closer look.
            </p>
            <ul className="landing-showcase-list">
              <li>Health score with plain-English verdict</li>
              <li>High, medium, and low severity risk filters</li>
              <li>Optional Monad proof for the document hash</li>
            </ul>
          </div>

          <div className="landing-preview" aria-hidden>
            <div className="landing-preview-chrome">
              <span />
              <span />
              <span />
            </div>
            <div className="landing-preview-body">
              <div className="landing-preview-head">
                <div>
                  <div className="eyebrow">Analysis complete</div>
                  <h3>Vendor Master Services Agreement</h3>
                  <p className="muted">msa-acme.pdf · Services agreement</p>
                </div>
                <div className="landing-preview-score">78</div>
              </div>
              <div className="landing-preview-risk high">
                <b>Unilateral termination</b>
                <span>30-day notice with no cure period for material breach.</span>
              </div>
              <div className="landing-preview-risk medium">
                <b>Broad indemnity</b>
                <span>Customer bears liability beyond ordinary negligence.</span>
              </div>
              <div className="landing-preview-chip">Immutable proof secured on Monad</div>
            </div>
          </div>
        </motion.div>
      </section>

      <section className="landing-features shell">
        <div className="landing-section-head">
          <div className="eyebrow">Why Provenn</div>
          <h2>Built for contracts that matter.</h2>
        </div>
        <div className="landing-features-grid">
          {FEATURES.map((feature, i) => (
            <motion.article
              key={feature.title}
              className="landing-feature-card"
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ delay: i * 0.07, duration: 0.4 }}
            >
              <h3>{feature.title}</h3>
              <p>{feature.copy}</p>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="landing-steps shell">
        <div className="landing-section-head">
          <div className="eyebrow">How it works</div>
          <h2>From upload to immutable proof.</h2>
          <p className="landing-section-lead">
            Understand the agreement first, then optionally anchor only its hash
            on Monad.
          </p>
        </div>
        <div className="landing-steps-grid">
          {STEPS.map((step, i) => (
            <motion.article
              key={step.title}
              className="landing-step-card"
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
            >
              <div className="landing-step-index">{step.n}</div>
              <h3>{step.title}</h3>
              <p>{step.copy}</p>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="landing-cta-band">
        <div className="shell landing-cta-inner">
          <div>
            <h2>Ready to read your next contract?</h2>
            <p>Upload now or verify an existing proof in seconds.</p>
          </div>
          <div className="landing-cta-actions">
            <Button size="lg" type="button" disabled={loading} onClick={() => input.current?.click()}>
              Upload contract
            </Button>
            <Button size="lg" variant="secondary" asChild>
              <Link href="/verify">Verify document</Link>
            </Button>
          </div>
        </div>
      </section>

      <input
        ref={input}
        hidden
        type="file"
        accept=".pdf,.docx,.txt,text/plain,application/pdf"
        onChange={(e) => start(e.target.files?.[0])}
        disabled={loading}
      />
    </div>
  );
}
