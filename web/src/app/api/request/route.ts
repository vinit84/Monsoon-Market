import { NextResponse } from "next/server";
import { after } from "next/server";
import { z } from "zod";
import { getServerEnv } from "@/config/env";
import { simulateRequest } from "@/lib/sim/engine";
import {
    postRequestOnChain,
    runOrchestrationAfterPost,
} from "@/lib/onchain/orchestrator";

// Real on-chain calls plus IPFS pinning need node runtime + extra time on Vercel.
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

export async function POST(req: Request): Promise<Response> {
    const json = await req.json().catch(() => null);
    const parsed = Body.safeParse(json);
    if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    // Real Monad testnet path is taken when the deployed escrow address is set.
    // If it's missing (e.g., local dev without `forge script Deploy`), fall back
    // to the in-memory simulation so the demo never hard-fails.
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

            // Drive the rest of the agent flow on-chain after the response is sent.
            // Vercel keeps the function alive for tasks scheduled via `after`.
            after(async () => {
                await runOrchestrationAfterPost({
                    requestId: result.requestId,
                    bountyMon: parsed.data.bountyMon,
                    deadlineMs: result.deadline,
                });
            });

            return NextResponse.json({
                ok: true,
                source: "onchain",
                requestId: result.requestId,
                txHash: result.txHash,
                ipfsUri: result.ipfsUri,
                explorerUrl: result.explorerUrl,
                deadline: result.deadline,
                message:
                    "Request posted on Monad testnet. Volunteer agents will bid in the 10s window — watch the Tx Stream.",
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

    // Fallback: in-memory simulation (used only when no contract is configured).
    console.warn("[api/request] ESCROW_ADDRESS not set — falling back to in-memory simulation");
    const simReq = simulateRequest(parsed.data);
    return NextResponse.json({
        ok: true,
        source: "simulation",
        requestId: simReq.id,
        txHash: `0xsim_${simReq.id.toString(16).padStart(8, "0")}`,
        ipfsUri: simReq.ipfsUri,
        message:
            "ESCROW_ADDRESS not configured — running simulated flow. Set the env var to use real Monad testnet.",
    });
}
