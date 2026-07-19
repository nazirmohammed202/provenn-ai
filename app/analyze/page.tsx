"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Turnstile } from "@marsidev/react-turnstile";
import { toast } from "sonner";
import type { Analysis, ProofRecord } from "@/lib/types";
import { SiteNav } from "@/components/site-nav";
import { Button } from "@/components/ui/button";
import { explorerAddressUrl, explorerTxUrl, shortHash } from "@/lib/utils";
import { secureWithInjectedWallet } from "@/lib/client/wallet";

type Item = {
  id: string;
  hash: `0x${string}`;
  fileName: string;
  analysis: Analysis;
  createdAt: string;
  expiresAt: string;
};

type Severity = "all" | "high" | "medium" | "low";

function scoreVerdict(score: number) {
  if (score >= 80)
    return {
      label: "Looks solid",
      detail: "No major red flags jumped out — still read the fine print.",
    };
  if (score >= 50)
    return {
      label: "Needs attention",
      detail: "A few clauses deserve a careful look before you sign.",
    };
  return {
    label: "High caution",
    detail: "Several terms could shift risk onto you. Review carefully.",
  };
}

function countRisks(risks: Analysis["risks"]) {
  return {
    high: risks.filter((r) => r.severity === "high").length,
    medium: risks.filter((r) => r.severity === "medium").length,
    low: risks.filter((r) => r.severity === "low").length,
  };
}

export default function AnalyzePage() {
  const input = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [item, setItem] = useState<Item | null>(null);
  const [proof, setProof] = useState<ProofRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [securing, setSecuring] = useState(false);
  const [walletSecuring, setWalletSecuring] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string>("");
  const [riskFilter, setRiskFilter] = useState<Severity>("all");
  const [openRisk, setOpenRisk] = useState<string | null>(null);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("id");
    if (!id) return;
    let cancelled = false;
    fetch(`/api/analyses/${id}`, { credentials: "same-origin" })
      .then(async (r) => {
        const data = await r.json();
        if (cancelled) return;
        if (!r.ok || data.error) {
          toast.error(data.error || "Unable to load analysis");
          return;
        }
        setItem(data);
        setProof(data.proof);
      })
      .catch(() => {
        if (!cancelled) toast.error("Unable to load analysis");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!item) return;
    const firstHigh = item.analysis.risks.find((r) => r.severity === "high");
    const first = firstHigh || item.analysis.risks[0];
    setOpenRisk(first ? first.title : null);
  }, [item?.id]);

  async function upload(file?: File) {
    if (!file) return;
    setLoading(true);
    const body = new FormData();
    body.append("file", file);
    const response = await fetch("/api/analyze", { method: "POST", body });
    const data = await response.json();
    setLoading(false);
    if (!response.ok) {
      toast.error(data.error || "Upload failed");
      return;
    }
    router.replace(`/analyze?id=${data.id}`);
    setItem(data);
    setProof(data.proof ?? null);
    toast.success(
      data.proof
        ? "Analysis complete — already secured on Monad"
        : "Analysis complete",
    );
  }

  async function secureManaged() {
    if (!item) return;
    if (siteKey && !turnstileToken) {
      toast.error("Complete the verification challenge first.");
      return;
    }
    setSecuring(true);
    const response = await fetch("/api/proofs/managed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, turnstileToken }),
    });
    const data = await response.json();
    setSecuring(false);
    if (!response.ok) {
      toast.error(data.error || "Unable to secure proof");
      return;
    }
    setProof(data.proof);
    toast.success(
      data.alreadySecured
        ? "This document is already secured on Monad"
        : "Proof secured on Monad",
    );
  }

  async function secureWallet() {
    if (!item) return;
    setWalletSecuring(true);
    try {
      const existingResponse = await fetch(`/api/proofs/${item.hash}`);
      if (existingResponse.ok) {
        const existing = await existingResponse.json();
        if (existing.proof) {
          setProof(existing.proof);
          toast.message("This document is already secured on Monad");
          return;
        }
      }
      const result = await secureWithInjectedWallet(item.hash);
      setProof({
        hash: item.hash,
        owner: result.owner,
        timestamp: Math.floor(Date.now() / 1000),
        transactionHash: result.transactionHash,
      });
      toast.success("Self-custody proof submitted");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Wallet proof failed",
      );
    } finally {
      setWalletSecuring(false);
    }
  }

  const riskCounts = useMemo(
    () => (item ? countRisks(item.analysis.risks) : { high: 0, medium: 0, low: 0 }),
    [item],
  );

  const filteredRisks = useMemo(() => {
    if (!item) return [];
    if (riskFilter === "all") return item.analysis.risks;
    return item.analysis.risks.filter((r) => r.severity === riskFilter);
  }, [item, riskFilter]);

  if (!item) {
    return (
      <main className="shell">
        <SiteNav ctaHref="/verify" ctaLabel="Verify" />
        <section className="upload analyze-upload">
          <div
            className={`analyze-stage ${loading ? "is-analyzing" : ""} ${dragging ? "dragging" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              if (!loading) setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              if (!loading) upload(e.dataTransfer.files[0]);
            }}
          >
            <div className="analyze-aura" aria-hidden>
              <span className="aura-ring aura-ring-1" />
              <span className="aura-ring aura-ring-2" />
              <span className="aura-ring aura-ring-3" />
              <span className="aura-orb aura-orb-a" />
              <span className="aura-orb aura-orb-b" />
              <span className="aura-orb aura-orb-c" />
              <span className="aura-sweep" />
            </div>

            <div className="analyze-panel">
              <div className="eyebrow">
                {loading ? "Provenn AI at work" : "New analysis"}
              </div>
              <h1>
                {loading
                  ? "Reading your contract…"
                  : "Drop in a contract. Get clarity in seconds."}
              </h1>
              <p className="analyze-copy">
                {loading ? (
                  <AnalyzingStatus />
                ) : (
                  <>
                    Upload a PDF, DOCX, or TXT. We extract the text, map risks in
                    plain English, and prepare an optional Monad proof — without
                    ever putting the document itself on-chain.
                  </>
                )}
              </p>

              {!loading && (
                <Button className="mt-6" onClick={() => input.current?.click()}>
                  {dragging ? "Drop file to start" : "Choose contract"}
                </Button>
              )}

              {loading && (
                <div className="analyze-pulse-bar" aria-hidden>
                  <span />
                </div>
              )}

              <input
                ref={input}
                hidden
                type="file"
                accept=".pdf,.docx,.txt,text/plain,application/pdf"
                onChange={(e) => upload(e.target.files?.[0])}
                disabled={loading}
              />
            </div>
          </div>
        </section>
      </main>
    );
  }

  const verdict = scoreVerdict(item.analysis.healthScore);
  const expiresLabel = new Date(item.expiresAt).toLocaleString();

  return (
    <main className="results shell briefing">
      <SiteNav ctaHref="/verify" ctaLabel="Verify" />

      <motion.header
        className="briefing-hero"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        <div className="briefing-hero-copy">
          <div className="eyebrow">Contract briefing</div>
          <h1>{item.analysis.title}</h1>
          <p className="briefing-meta">
            {item.fileName} · {item.analysis.contractType}
          </p>
          <p className="briefing-expiry muted">
            Session retained until {expiresLabel}
          </p>

          <div className={`briefing-verdict verdict-${verdict.label.replace(/\s+/g, "-").toLowerCase()}`}>
            <span className="verdict-label">{verdict.label}</span>
            <p>{verdict.detail}</p>
          </div>

          <div className="risk-tally">
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <b>{riskCounts.high}</b>
              <span>High</span>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}>
              <b>{riskCounts.medium}</b>
              <span>Medium</span>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.29 }}>
              <b>{riskCounts.low}</b>
              <span>Low</span>
            </motion.div>
          </div>
        </div>

        <div
          className="score-wrap"
          aria-label={`Health score ${item.analysis.healthScore}`}
        >
          <span className="score-flash score-flash-1" aria-hidden />
          <span className="score-flash score-flash-2" aria-hidden />
          <span className="score-flash score-flash-3" aria-hidden />
          <motion.div
            className="score"
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 220, damping: 16 }}
          >
            {item.analysis.healthScore}
          </motion.div>
          <span className="score-caption">Health score</span>
        </div>
      </motion.header>

      <div className="actions">
        <Button asChild variant="secondary">
          <a href={`/api/reports/${item.id}`}>Download report</a>
        </Button>
        <Button disabled={securing || Boolean(proof)} onClick={secureManaged}>
          {proof
            ? "Proof secured on Monad"
            : securing
              ? "Securing proof..."
              : "Secure on Monad"}
        </Button>
        {!proof && (
          <Button
            variant="secondary"
            disabled={walletSecuring}
            onClick={secureWallet}
          >
            {walletSecuring ? "Confirm in wallet..." : "Secure with wallet"}
          </Button>
        )}
      </div>

      {!proof && siteKey && (
        <div className="turnstile-wrap" style={{ marginTop: 12 }}>
          <Turnstile
            siteKey={siteKey}
            onSuccess={setTurnstileToken}
            onExpire={() => setTurnstileToken("")}
          />
        </div>
      )}

      <motion.section
        className="exec-brief"
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.4 }}
      >
        <div className="eyebrow">Executive brief</div>
        <h2>What this contract is really saying</h2>
        <p>{item.analysis.summary}</p>
      </motion.section>

      <motion.section
        className="facts-strip"
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 0.4 }}
      >
        <div className="eyebrow">Key facts</div>
        <h2>The spine of the agreement</h2>
        <div className="facts-grid">
          <FactColumn title="Parties" items={item.analysis.parties} />
          <FactColumn title="Payment terms" items={item.analysis.paymentTerms} />
          <FactColumn title="Key dates" items={item.analysis.keyDates} />
          <FactColumn title="Obligations" items={item.analysis.obligations} />
        </div>
      </motion.section>

      <motion.section
        className="risk-nav"
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.4 }}
      >
        <div className="risk-nav-head">
          <div>
            <div className="eyebrow">Clause navigator</div>
            <h2>What needs your attention</h2>
          </div>
          <div className="risk-filters" role="tablist" aria-label="Filter by severity">
            {(
              [
                ["all", "All"],
                ["high", "High"],
                ["medium", "Medium"],
                ["low", "Low"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={riskFilter === value}
                className={`risk-filter ${riskFilter === value ? "active" : ""} ${value}`}
                onClick={() => setRiskFilter(value)}
              >
                {label}
                {value !== "all" && (
                  <em>{riskCounts[value]}</em>
                )}
              </button>
            ))}
          </div>
        </div>

        {!item.analysis.risks.length && (
          <p className="muted">No notable risks identified.</p>
        )}

        {item.analysis.risks.length > 0 && !filteredRisks.length && (
          <p className="muted">No risks in this severity.</p>
        )}

        <div className="risk-list">
          {filteredRisks.map((risk, index) => {
            const open = openRisk === risk.title;
            return (
              <motion.article
                key={`${risk.title}-${risk.severity}`}
                className={`risk-row ${risk.severity} ${open ? "open" : ""}`}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05, duration: 0.35 }}
              >
                <button
                  type="button"
                  className="risk-row-toggle"
                  aria-expanded={open}
                  onClick={() =>
                    setOpenRisk(open ? null : risk.title)
                  }
                >
                  <span className={`severity-badge ${risk.severity}`}>
                    {risk.severity}
                  </span>
                  <span className="risk-row-title">
                    <strong>{risk.title}</strong>
                    <small>
                      {risk.sectionReference || "Section reference unavailable"}
                    </small>
                  </span>
                  <span className="risk-chevron" aria-hidden>
                    {open ? "−" : "+"}
                  </span>
                </button>

                <AnimatePresence initial={false}>
                  {open && (
                    <motion.div
                      className="risk-row-body"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.28 }}
                    >
                      <div className="risk-row-inner">
                        <div className="quote">“{risk.quotedClause}”</div>
                        <h4>Why this matters</h4>
                        <p className="muted">{risk.whyItMatters}</p>
                        <p>
                          <b>Recommendation:</b> {risk.recommendation}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.article>
            );
          })}
        </div>
      </motion.section>

      <motion.section
        className="gaps-next"
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.4 }}
      >
        <div className="gaps-col">
          <div className="eyebrow">Gaps</div>
          <h2>Missing clauses</h2>
          <List items={item.analysis.missingClauses} />
        </div>
        <div className="gaps-col">
          <div className="eyebrow">Next steps</div>
          <h2>Recommendations</h2>
          {item.analysis.recommendations.length ? (
            <ol className="reco-list">
              {item.analysis.recommendations.map((rec, i) => (
                <li key={rec}>
                  <span className="reco-num">{i + 1}</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="muted">None listed.</p>
          )}
        </div>
      </motion.section>

      {proof ? (
        <motion.section
          className="verify-seal proof-seal"
          initial={{ opacity: 0, scale: 0.97, y: 12 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="verify-seal-glow" aria-hidden />
          <div className="verify-seal-grid" aria-hidden />

          <motion.div
            className="seal-mark"
            initial={{ scale: 0.55, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.08, type: "spring", stiffness: 220, damping: 16 }}
          >
            <svg viewBox="0 0 120 120" className="seal-svg" aria-hidden>
              <circle cx="60" cy="60" r="52" className="seal-ring" />
              <circle cx="60" cy="60" r="42" className="seal-ring-inner" />
              <path
                className="seal-check"
                d="M38 62 L52 76 L84 44"
                fill="none"
                strokeWidth="7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </motion.div>

          <div className="eyebrow seal-eyebrow">Immutable on Monad</div>
          <h2 className="seal-title">This version is locked in.</h2>
          <p className="seal-copy">
            Only a fingerprint of <strong>{item.fileName}</strong> was written
            to the chain — never the contract text. Anyone can later prove this
            exact file is unchanged.
          </p>

          <div className="seal-assurance">
            <div>
              <span>Contents</span>
              <b>Off-chain</b>
            </div>
            <div>
              <span>Fingerprint</span>
              <b>Anchored</b>
            </div>
            <div>
              <span>Status</span>
              <b>Immutable</b>
            </div>
          </div>

          <div className="seal-meta">
            <div className="seal-meta-row">
              <span>Secured on</span>
              <b>{new Date(proof.timestamp * 1000).toLocaleString()}</b>
            </div>
            <div className="seal-meta-row">
              <span>Document fingerprint</span>
              <code>{shortHash(item.hash, 12)}</code>
            </div>
            <div className="seal-meta-row">
              <span>Proof wallet</span>
              <a
                href={explorerAddressUrl(proof.owner)}
                target="_blank"
                rel="noreferrer"
              >
                {shortHash(proof.owner, 6)}
              </a>
            </div>
            <div className="seal-meta-row">
              <span>On-chain transaction</span>
              {proof.transactionHash ? (
                <a
                  href={explorerTxUrl(proof.transactionHash)}
                  target="_blank"
                  rel="noreferrer"
                >
                  View on explorer →
                </a>
              ) : (
                <b>Indexing…</b>
              )}
            </div>
          </div>

          <div className="seal-actions">
            <a className="btn-ghost" href={`/api/reports/${item.id}`}>
              Download updated report
            </a>
            {proof.transactionHash && (
              <a
                className="btn-primary"
                href={explorerTxUrl(proof.transactionHash)}
                target="_blank"
                rel="noreferrer"
              >
                Open Monad proof
              </a>
            )}
          </div>
        </motion.section>
      ) : (
        <p className="muted proof-hint">
          Secure stores only this document&apos;s SHA-256 hash on Monad — never
          its contents. Managed proofs use the service wallet; self-custody uses
          your injected browser wallet.
        </p>
      )}
    </main>
  );
}

function FactColumn({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="fact-col">
      <h3>{title}</h3>
      <List items={items} />
    </div>
  );
}

function List({ items }: { items: string[] }) {
  if (!items.length) return <p className="muted">None listed.</p>;
  return (
    <ul className="list">
      {items.map((entry) => (
        <li key={entry}>{entry}</li>
      ))}
    </ul>
  );
}

const ANALYZE_BEATS = [
  "Parsing clauses and definitions…",
  "Spotting obligations and deadlines…",
  "Scoring risk in plain English…",
  "Drafting recommendations you can act on…",
];

function AnalyzingStatus() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % ANALYZE_BEATS.length);
    }, 2200);
    return () => window.clearInterval(id);
  }, []);

  return (
    <motion.span
      key={ANALYZE_BEATS[index]}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="analyze-status"
    >
      {ANALYZE_BEATS[index]}
    </motion.span>
  );
}
