import { z } from "zod";

export const riskSchema = z.object({
  title: z.string(), severity: z.enum(["low", "medium", "high"]),
  sectionReference: z.string().default("Section reference unavailable"),
  quotedClause: z.string(), whyItMatters: z.string(), recommendation: z.string(),
});
export const analysisSchema = z.object({
  title: z.string(), contractType: z.string(), summary: z.string(),
  parties: z.array(z.string()), paymentTerms: z.array(z.string()), keyDates: z.array(z.string()),
  obligations: z.array(z.string()), risks: z.array(riskSchema), missingClauses: z.array(z.string()),
  healthScore: z.number().min(0).max(100), recommendations: z.array(z.string()),
});
export type Analysis = z.infer<typeof analysisSchema>;
export type StoredAnalysis = { id: string; hash: `0x${string}`; fileName: string; analysis: Analysis; createdAt: string };
