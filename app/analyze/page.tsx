"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
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
    setProof(null);
    toast.success("Analysis complete");
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
    toast.success("Proof secured on Monad");
  }

  async function secureWallet() {
    if (!item) return;
    setWalletSecuring(true);
    try {
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

  if (!item) {
    return (
      <main className="shell">
        <SiteNav ctaHref="/verify" ctaLabel="Verify" />
        <section className="upload">
          <div
            className={`drop ${dragging ? "dragging" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              upload(e.dataTransfer.files[0]);
            }}
          >
            <div className="eyebrow">New analysis</div>
            <h1>{loading ? "Analyzing with AI..." : "Upload your contract"}</h1>
            <p className="muted">
              Drag and drop a PDF, DOCX, or TXT file here, or choose it from your
              device.
            </p>
            <Button className="mt-6" onClick={() => input.current?.click()}>
              {dragging ? "Drop file to start" : "Choose contract"}
            </Button>
            <input
              ref={input}
              hidden
              type="file"
              accept=".pdf,.docx,.txt,text/plain,application/pdf"
              onChange={(e) => upload(e.target.files?.[0])}
            />
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="results shell">
      <SiteNav ctaHref="/verify" ctaLabel="Verify" />
      <motion.div
        className="result-head"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <div className="eyebrow">Analysis complete</div>
          <h1>{item.analysis.title}</h1>
          <p className="muted">
            {item.fileName} · {item.analysis.contractType}
          </p>
        </div>
        <div className="score">{item.analysis.healthScore}</div>
      </motion.div>

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

      {proof ? (
        <article className="proof-status">
          <b>Immutable proof secured</b>
          <span>
            Recorded {new Date(proof.timestamp * 1000).toLocaleString()} ·{" "}
            {proof.transactionHash ? (
              <a href={explorerTxUrl(proof.transactionHash)} target="_blank" rel="noreferrer">
                Tx {shortHash(proof.transactionHash)}
              </a>
            ) : (
              "Transaction indexing"
            )}
            {" · "}
            <a href={explorerAddressUrl(proof.owner)} target="_blank" rel="noreferrer">
              {shortHash(proof.owner, 6)}
            </a>
          </span>
        </article>
      ) : (
        <p className="muted" style={{ marginTop: 14 }}>
          Secure stores only this document&apos;s SHA-256 hash on Monad — never
          its contents. Managed proofs use the service wallet; self-custody uses
          your injected browser wallet.
        </p>
      )}

      <section className="grid">
        <article className="card wide">
          <div className="eyebrow">Contract summary</div>
          <p>{item.analysis.summary}</p>
        </article>

        <article className="card">
          <div className="eyebrow">Parties</div>
          <List items={item.analysis.parties} />
        </article>
        <article className="card">
          <div className="eyebrow">Payment terms</div>
          <List items={item.analysis.paymentTerms} />
        </article>
        <article className="card">
          <div className="eyebrow">Key dates</div>
          <List items={item.analysis.keyDates} />
        </article>
        <article className="card">
          <div className="eyebrow">Obligations</div>
          <List items={item.analysis.obligations} />
        </article>

        <article className="card wide">
          <div className="eyebrow">Clause navigator</div>
          <h2>What needs your attention</h2>
          {!item.analysis.risks.length && (
            <p className="muted">No notable risks identified.</p>
          )}
          {item.analysis.risks.map((risk) => (
            <div className={`card risk ${risk.severity}`} key={risk.title}>
              <div className="tag">
                {risk.severity.toUpperCase()} RISK ·{" "}
                {risk.sectionReference || "Section reference unavailable"}
              </div>
              <h3>{risk.title}</h3>
              <div className="quote">“{risk.quotedClause}”</div>
              <h4>Why this matters</h4>
              <p className="muted">{risk.whyItMatters}</p>
              <p>
                <b>Recommendation:</b> {risk.recommendation}
              </p>
            </div>
          ))}
        </article>

        <article className="card">
          <div className="eyebrow">Missing clauses</div>
          <List items={item.analysis.missingClauses} />
        </article>
        <article className="card">
          <div className="eyebrow">Recommendations</div>
          <List items={item.analysis.recommendations} />
        </article>
      </section>
    </main>
  );
}

function List({ items }: { items: string[] }) {
  if (!items.length) return <p className="muted">None listed.</p>;
  return (
    <ul className="list">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}
