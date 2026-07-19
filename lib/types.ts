import { z } from "zod";

export const riskSchema = z.object({
  title: z.string().min(1),
  severity: z.enum(["low", "medium", "high"]),
  sectionReference: z.string().default("Section reference unavailable"),
  quotedClause: z.string().min(1),
  whyItMatters: z.string().min(1),
  recommendation: z.string().min(1),
});

export const analysisSchema = z.object({
  title: z.string().min(1),
  contractType: z.string().min(1),
  summary: z.string().min(1),
  parties: z.array(z.string()).default([]),
  paymentTerms: z.array(z.string()).default([]),
  keyDates: z.array(z.string()).default([]),
  obligations: z.array(z.string()).default([]),
  risks: z.array(riskSchema).default([]),
  missingClauses: z.array(z.string()).default([]),
  healthScore: z.number().min(0).max(100),
  recommendations: z.array(z.string()).default([]),
});

export type Analysis = z.infer<typeof analysisSchema>;

export type ProofRecord = {
  hash: `0x${string}`;
  owner: string;
  timestamp: number;
  transactionHash?: string | null;
};

export type StoredAnalysis = {
  id: string;
  hash: `0x${string}`;
  fileName: string;
  analysis: Analysis;
  extractedText: string;
  createdAt: string;
  expiresAt: string;
};

export type PublicAnalysis = Omit<StoredAnalysis, "extractedText"> & {
  proof?: ProofRecord | null;
};
