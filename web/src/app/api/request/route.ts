import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerEnv } from "@/config/env";
import { simulateRequest } from "@/lib/sim/engine";
import { postRequestOnChain } from "@/lib/onchain/orchestrator";

// Real on-chain postRequest needs node runtime + extra time on Vercel.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const Body = z.object({
    category: z.string().min(1),
    description: z.string().min(1),
    location: z.string().min(1),
    bountyMon: z.number().positive(),
    requesterAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/u),
});

/**
 * Hybrid request flow.
 *
 * Server side does ONE thing: post the request on Monad testnet (real tx,
 * real bounty escrowed, real Monadscan link). It returns the full request
 * payload back to the client immediately. The agent tail (Anil's bid,
 * Bina's bid, close, proof, attest) runs in the browser via
 * `lib/sim/client-flow.ts`. This keeps Tx Stream and Live Bids consistent
 * on Vercel — both panels read from the same in-tab event bus instead of
 * fighting with module-level lambda state.
 */
export async function POST(req: Request): Promise<Response> {
    const json = await req.json().catch(() => null);
    const parsed = Body.safeParse(json);
    if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const env = getServerEnv();
    if (env.ESCROW_ADDRESS) {
        try {
            const result = await postRequestOnChain({
                category: parsed.data.category,
                description: parsed.data.description,
                location: parsed.data.location,
                bountyMon: parsed.data.bountyMon,
                requesterAddress: parsed.data.requesterAddress as `0x${string}`,
            });

            return NextResponse.json({
                ok: true,
                source: "hybrid",
                requestId: result.requestId,
                txHash: result.txHash,
                ipfsUri: result.ipfsUri,
                explorerUrl: result.explorerUrl,
                deadline: result.deadline,
                // echoed back so the client-side flow has everything it needs
                // to seed the in-tab event bus without a follow-up fetch
                bountyMon: parsed.data.bountyMon,
                category: parsed.data.category,
                location: parsed.data.location,
                description: parsed.data.description,
                requesterAddress: parsed.data.requesterAddress,
                message:
                    "Request posted on Monad testnet. Anil and Bina are bidding now — watch the Tx Stream.",
            });
        } catch (err) {
            console.error("[api/request] on-chain post failed", err);
            const detail = err instanceof Error ? err.message : String(err);
            return NextResponse.json(
                {
                    error: "Failed to post request on-chain",
                    detail,
                    hint:
                        "Check ESCROW_ADDRESS, MONAD_TESTNET_RPC_URL, and that RESIDENT_RELAYER_PK is funded with MON.",
                },
                { status: 500 },
            );
        }
    }

    // Local-dev fallback: no contract configured → return a fake request
    // payload that the client-side flow will animate locally.
    console.warn("[api/request] ESCROW_ADDRESS not set — returning simulation payload");
    const simReq = simulateRequest(parsed.data);
    return NextResponse.json({
        ok: true,
        source: "simulation",
        requestId: simReq.id,
        txHash: `0xsim_${simReq.id.toString(16).padStart(8, "0")}`,
        ipfsUri: simReq.ipfsUri,
        explorerUrl: "#",
        deadline: simReq.deadline,
        bountyMon: parsed.data.bountyMon,
        category: parsed.data.category,
        location: parsed.data.location,
        description: parsed.data.description,
        requesterAddress: parsed.data.requesterAddress,
        message:
            "ESCROW_ADDRESS not configured — running fully simulated flow. Set the env var to use real Monad testnet for the post.",
    });
}
