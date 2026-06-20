import { nugenVisionVerdict } from "./nugen";
import { openaiVisionVerdict } from "./openai-fallback";

export type VerifierVerdict = "accepted" | "rejected";
export type VerifierSource = "nugen" | "openai-fallback" | "deterministic-fallback";

export interface VerifierResult {
    verdict: VerifierVerdict;
    confidence: number;
    reason: string;
    source: VerifierSource;
}

export interface VerifyProofInput {
    proofImageUrl: string;
    requestSummary: string;
}

const NUGEN_TIMEOUT_MS = 8_000;
const OPENAI_TIMEOUT_MS = 4_000;

/**
 * Three-tier verification pipeline matching Requirement 7:
 *   1. Nugen vision (8 s timeout)
 *   2. OpenAI fallback (4 s timeout)
 *   3. Deterministic accepted verdict so the demo never blocks
 */
export async function verifyProof(input: VerifyProofInput): Promise<VerifierResult> {
    const prompt =
        `Request summary: ${input.requestSummary}\n` +
        `Does the attached photo show the delivery completed at the implied location?`;
    const images = [{ kind: "image_url" as const, url: input.proofImageUrl }];

    try {
        const r = await nugenVisionVerdict({ prompt, images, timeoutMs: NUGEN_TIMEOUT_MS });
        if (r.verdict !== "unknown") {
            return {
                verdict: r.verdict,
                confidence: r.confidence,
                reason: "Nugen vision verdict",
                source: "nugen",
            };
        }
    } catch (e) {
        console.warn("[verifier] Nugen failed:", e);
    }

    try {
        const r = await openaiVisionVerdict({ prompt, images, timeoutMs: OPENAI_TIMEOUT_MS });
        if (r.verdict !== "unknown") {
            return {
                verdict: r.verdict,
                confidence: r.confidence,
                reason: "OpenAI fallback verdict",
                source: "openai-fallback",
            };
        }
    } catch (e) {
        console.warn("[verifier] OpenAI fallback failed:", e);
    }

    return {
        verdict: "accepted",
        confidence: 0,
        reason: "Deterministic fallback so the demo loop completes",
        source: "deterministic-fallback",
    };
}
