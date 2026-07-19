"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
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

export default function VerifyPage() {
  const input = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);

  async function verify(file?: File) {
    if (!file) return;
    setLoading(true);
    setResult(null);
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
    toast.success(data.verified ? "Document verified" : "No matching proof");
  }

  return (
    <main className="shell">
      <SiteNav ctaHref="/analyze" ctaLabel="Analyze" />
      <section className="upload">
        <motion.div
          className={`drop ${dragging ? "dragging" : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            verify(e.dataTransfer.files[0]);
          }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="eyebrow">Immutable verification</div>
          <h1>Verify a document version.</h1>
          <p className="muted">
            Upload a copy to compare its SHA-256 hash against Monad.
          </p>
          <Button className="mt-6" onClick={() => input.current?.click()}>
            {loading ? "Checking Monad..." : dragging ? "Drop to verify" : "Choose file"}
          </Button>
          <input
            ref={input}
            hidden
            type="file"
            accept=".pdf,.docx,.txt,text/plain,application/pdf"
            onChange={(e) => verify(e.target.files?.[0])}
          />
        </motion.div>

        {result && (
          <motion.article
            className="card"
            style={{ marginTop: 24, textAlign: "left" }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2>
              {result.verified
                ? "Verified on Monad"
                : "Modified or never secured"}
            </h2>
            <p className="muted">Hash: {result.hash}</p>
            {result.proof && (
              <>
                <p>
                  Recorded{" "}
                  {new Date(result.proof.timestamp * 1000).toLocaleString()}
                </p>
                <p>
                  Wallet:{" "}
                  {result.proof.explorerAddressUrl ? (
                    <a
                      href={result.proof.explorerAddressUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {shortHash(result.proof.owner, 6)}
                    </a>
                  ) : (
                    result.proof.owner
                  )}
                </p>
                <p>
                  Transaction:{" "}
                  {result.proof.transactionHash ? (
                    result.proof.explorerTxUrl ? (
                      <a
                        href={result.proof.explorerTxUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {shortHash(result.proof.transactionHash)}
                      </a>
                    ) : (
                      shortHash(result.proof.transactionHash)
                    )
                  ) : (
                    "Indexing"
                  )}
                </p>
              </>
            )}
          </motion.article>
        )}
      </section>
    </main>
  );
}
