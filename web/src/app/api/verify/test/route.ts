import { NextResponse } from "next/server";
import { verifyProof } from "@/lib/llm/vision-verifier";

/**
 * Test endpoint to confirm Nugen vision is working end-to-end.
 * GET /api/verify/test
 */
export async function GET(): Promise<Response> {
    try {
        const result = await verifyProof({
            proofImageUrl: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400",
            requestSummary: "Test: medicine delivery photo verification",
        });
        return NextResponse.json({
            ok: true,
            ...result,
            note: "If source='nugen', the API is working live. If 'deterministic-fallback', check NUGEN_API_KEY.",
        });
    } catch (e) {
        return NextResponse.json(
            { ok: false, error: e instanceof Error ? e.message : String(e) },
            { status: 500 },
        );
    }
}
