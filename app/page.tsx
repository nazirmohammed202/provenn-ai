"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import Link from "next/link";

export default function Home() {
  const input = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);

  async function start(file?: File) {
    if (!file) return;
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
    toast.success("Analysis ready");
    router.push(`/analyze?id=${data.id}`);
  }

  return (
    <>
      <header className="landing-hero">
        <div className="shell">
          <nav className="nav nav-dark">
            <Link className="brand" href="/">
              provenn<span>.</span>
            </Link>
            <Link className="pill" href="/verify">
              Verify a document
            </Link>
          </nav>

          <div className="landing-hero-grid">
            <motion.div
              className="hero-copy"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="eyebrow">Contract intelligence, with proof</div>
              <div className="hero-brand">provenn.</div>
              <h1>Understand every contract in seconds.</h1>
              <p>
                AI explains legal documents in plain English while Monad
                guarantees the integrity of every version.
              </p>
              <div className="actions">
                <Link className="btn-primary" href="/analyze">
                  Upload contract
                </Link>
                <Link className="btn-ghost" href="/verify">
                  Verify document
                </Link>
              </div>
            </motion.div>

            <motion.div
              className="product-stage"
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="product-panel" aria-hidden>
                <div className="product-chrome">
                  <span />
                  <span />
                  <span />
                </div>
                <div className="product-screen">
                  <div className="product-top">
                    <div>
                      <div className="eyebrow">Analysis complete</div>
                      <h3>Vendor Master Services Agreement</h3>
                      <p className="muted" style={{ margin: 0, fontSize: 13 }}>
                        msa-acme.pdf · Services agreement
                      </p>
                    </div>
                    <div className="score-orb">78</div>
                  </div>
                  <div className="risk-row">
                    <b>Unilateral termination</b>
                    <span className="muted" style={{ fontSize: 13 }}>
                      30-day notice with no cure period for material breach.
                    </span>
                  </div>
                  <div className="risk-row medium">
                    <b>Broad indemnity</b>
                    <span className="muted" style={{ fontSize: 13 }}>
                      Customer bears liability beyond ordinary negligence.
                    </span>
                  </div>
                  <div className="proof-chip">Immutable proof secured on Monad</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </header>

      <main>
        <section className="section shell">
          <motion.div
            className={`quick-upload ${dragging ? "dragging" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              start(e.dataTransfer.files[0]);
            }}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
          >
            <div>
              <div className="eyebrow">Start now</div>
              <h3>
                {loading ? "Analyzing your contract..." : "Drop a document here"}
              </h3>
              <p className="muted" style={{ margin: 0 }}>
                PDF, DOCX, or TXT — no wallet required to analyze.
              </p>
            </div>
            <button
              className="secondary"
              type="button"
              onClick={() => input.current?.click()}
            >
              {dragging ? "Drop to upload" : loading ? "Working..." : "Choose file"}
            </button>
            <input
              ref={input}
              hidden
              type="file"
              accept=".pdf,.docx,.txt,text/plain,application/pdf"
              onChange={(e) => start(e.target.files?.[0])}
            />
          </motion.div>
        </section>

        <section className="section shell">
          <div className="eyebrow">How it works</div>
          <h2>From upload to immutable proof.</h2>
          <p className="section-lead">
            Provenn keeps the workflow simple: understand the agreement first,
            then optionally anchor only its hash on Monad.
          </p>
          <div className="steps">
            {[
              [
                "01",
                "Analyze",
                "Gemini Flash turns dense legal language into a plain-English brief with scores and risks.",
              ],
              [
                "02",
                "Review",
                "Inspect parties, dates, obligations, and the clauses that deserve attention.",
              ],
              [
                "03",
                "Prove",
                "Secure the SHA-256 hash with a managed signer or your own injected wallet.",
              ],
            ].map(([n, title, copy], i) => (
              <motion.article
                key={title}
                className="step"
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
              >
                <div className="step-index">{n}</div>
                <h3>{title}</h3>
                <p>{copy}</p>
              </motion.article>
            ))}
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="shell">
          Provenn AI · Understand every contract. Prove every version.
        </div>
      </footer>
    </>
  );
}
