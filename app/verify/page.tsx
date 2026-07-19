"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { SiteNav } from "@/components/site-nav";
import { Button } from "@/components/ui/button";
import { shortHash } from "@/lib/utils";

type VerifyResult = {
  hash: string;
  verified: boolean;
  status: string;
  proof?: {
    owner: string;
    timestamp: number;
    transactionHash?: string | null;
    explorerTxUrl?: string | null;
    explorerAddressUrl?: string | null;
  } | null;
};

const SCAN_BEATS = [
  "Fingerprinting every byte…",
  "Querying Monad for a matching proof…",
  "Comparing hashes on-chain…",
];

export default function VerifyPage() {
  const input = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [scanIndex, setScanIndex] = useState(0);

  useEffect(() => {
    if (!loading) return;
    const id = window.setInterval(() => {
      setScanIndex((i) => (i + 1) % SCAN_BEATS.length);
    }, 1800);
    return () => window.clearInterval(id);
  }, [loading]);

  async function verify(file?: File) {
    if (!file || loading) return;
    setLoading(true);
    setResult(null);
    setFileName(file.name);
    setScanIndex(0);
    const form = new FormData();
    form.append("file", file);
    const response = await fetch("/api/verify", { method: "POST", body: form });
    const data = await response.json();
    setLoading(false);
    if (!response.ok) {
      toast.error(data.error || "Verification failed");
      return;
    }
    setResult(data);
    toast.success(
      data.verified
        ? "Document intact — proof matched"
        : "No matching on-chain proof",
    );
  }

  return (
    <main className="verify-page">
      <SiteNav ctaHref="/analyze" ctaLabel="Analyze" />

      <section className="shell verify-shell">
        {!result && (
          <motion.div
            className={`analyze-stage verify-stage ${loading ? "is-analyzing is-scanning" : ""} ${dragging ? "dragging" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              if (!loading) setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              verify(e.dataTransfer.files[0]);
            }}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
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

            <div className="analyze-panel verify-panel">
              <div className="eyebrow">
                {loading ? "Scanning the ledger" : "Immutable verification"}
              </div>
              <h1>
                {loading
                  ? "Checking this copy…"
                  : "Is this copy still the real one?"}
              </h1>
              <p className="analyze-copy">
                {loading ? (
                  <motion.span
                    key={SCAN_BEATS[scanIndex]}
                    className="analyze-status"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {SCAN_BEATS[scanIndex]}
                  </motion.span>
                ) : (
                  <>
                    Upload any PDF, DOCX, or TXT. We fingerprint the file and
                    check Monad — so you know if a single character changed
                    since it was secured.
                  </>
                )}
              </p>

              {!loading && (
                <Button
                  className="mt-6"
                  size="lg"
                  onClick={() => input.current?.click()}
                >
                  {dragging ? "Drop to verify" : "Choose document"}
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
                onChange={(e) => verify(e.target.files?.[0])}
                disabled={loading}
              />
            </div>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {result?.verified && result.proof && (
            <motion.section
              key="verified"
              className="verify-seal"
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="verify-seal-glow" aria-hidden />
              <div className="verify-seal-grid" aria-hidden />
              <div className="seal-scanline" aria-hidden />

              <div className="seal-mark-wrap">
                <span className="score-flash score-flash-1 seal-flash" aria-hidden />
                <span className="score-flash score-flash-2 seal-flash" aria-hidden />
                <span className="score-flash score-flash-3 seal-flash" aria-hidden />
                <motion.div
                  className="seal-mark"
                  initial={{ scale: 0.6, opacity: 0, rotate: -12 }}
                  animate={{ scale: 1, opacity: 1, rotate: 0 }}
                  transition={{
                    delay: 0.1,
                    type: "spring",
                    stiffness: 220,
                    damping: 14,
                  }}
                >
                  <svg viewBox="0 0 120 120" className="seal-svg" aria-hidden>
                    <circle cx="60" cy="60" r="52" className="seal-ring seal-ring-spin" />
                    <circle cx="60" cy="60" r="42" className="seal-ring-inner" />
                    <motion.path
                      className="seal-check"
                      d="M38 62 L52 76 L84 44"
                      fill="none"
                      strokeWidth="7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 1 }}
                      transition={{ delay: 0.35, duration: 0.55, ease: "easeOut" }}
                    />
                  </svg>
                </motion.div>
              </div>

              <motion.div
                className="eyebrow seal-eyebrow"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
              >
                Chain-anchored proof
              </motion.div>
              <motion.h2
                className="seal-title"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.32 }}
              >
                This document is intact.
              </motion.h2>
              <motion.p
                className="seal-copy"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                The file you uploaded matches the exact version locked on Monad.
                Nothing has been altered — not a clause, not a comma, not a
                single byte — since the proof was recorded.
              </motion.p>

              {fileName && (
                <motion.p
                  className="seal-file"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.48 }}
                >
                  Verified file <strong>{fileName}</strong>
                </motion.p>
              )}

              <div className="seal-assurance">
                {[
                  ["Fingerprint match", "Identical"],
                  ["Tamper status", "Untouched"],
                  ["Ledger", "Monad"],
                ].map(([label, value], i) => (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + i * 0.08 }}
                  >
                    <span>{label}</span>
                    <b>{value}</b>
                  </motion.div>
                ))}
              </div>

              <motion.div
                className="seal-meta"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.72 }}
              >
                <div className="seal-meta-row">
                  <span>Secured on</span>
                  <b>
                    {new Date(result.proof.timestamp * 1000).toLocaleString()}
                  </b>
                </div>
                <div className="seal-meta-row">
                  <span>Document fingerprint</span>
                  <code>{shortHash(result.hash, 12)}</code>
                </div>
                <div className="seal-meta-row">
                  <span>Proof wallet</span>
                  {result.proof.explorerAddressUrl ? (
                    <a
                      href={result.proof.explorerAddressUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {shortHash(result.proof.owner, 6)}
                    </a>
                  ) : (
                    <code>{shortHash(result.proof.owner, 6)}</code>
                  )}
                </div>
                <div className="seal-meta-row">
                  <span>On-chain transaction</span>
                  {result.proof.transactionHash ? (
                    result.proof.explorerTxUrl ? (
                      <a
                        href={result.proof.explorerTxUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        View on explorer →
                      </a>
                    ) : (
                      <code>{shortHash(result.proof.transactionHash)}</code>
                    )
                  ) : (
                    <b>Indexing…</b>
                  )}
                </div>
              </motion.div>

              <motion.div
                className="seal-actions"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.85 }}
              >
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => {
                    setResult(null);
                    setFileName("");
                  }}
                >
                  Verify another file
                </button>
                {result.proof.explorerTxUrl && (
                  <a
                    className="btn-primary"
                    href={result.proof.explorerTxUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open Monad proof
                  </a>
                )}
              </motion.div>
            </motion.section>
          )}

          {result && !result.verified && (
            <motion.section
              key="failed"
              className="verify-fail"
              initial={{ opacity: 0, y: 14, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="fail-mark"
                aria-hidden
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 14 }}
              >
                !
              </motion.div>
              <div className="eyebrow" style={{ color: "#b33b3b" }}>
                Proof mismatch
              </div>
              <h2>This copy does not match a secured version.</h2>
              <p>
                Either the document was never locked on Monad, or something in
                the file changed after it was secured. Treat this copy as
                unverified.
              </p>
              {fileName && (
                <p className="muted">
                  Checked file: <strong>{fileName}</strong>
                </p>
              )}
              <p className="fail-hash">
                Fingerprint <code>{shortHash(result.hash, 12)}</code>
              </p>
              <Button
                className="mt-4"
                variant="secondary"
                onClick={() => {
                  setResult(null);
                  setFileName("");
                }}
              >
                Try another file
              </Button>
            </motion.section>
          )}
        </AnimatePresence>
      </section>
    </main>
  );
}
