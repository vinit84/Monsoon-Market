import { NextResponse } from "next/server";
import { after } from "next/server";
import { z } from "zod";
import { getServerEnv } from "@/config/env";
import {
    simulateRequest,
    runMockAgentFlowForExistingRequest,
} from "@/lib/sim/engine";
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

export async function POST(req: Request): Promise<Response> {
    const json = await req.json().catch(() => null);
    const parsed = Body.safeParse(json);
    if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    // Hybrid mode (default for the Vercel deployment):
    //   - postRequest is REAL on-chain — escrows the bounty on Monad testnet
    //     and produces a real Monadscan tx hash for the UI.
    //   - The volunteer/close/proof/attest tail runs in the in-memory simulator
    //     so Volunteer Anil and Volunteer Bina compete against each other with
    //     persona-flavoured prices, exactly like the original mock UX.
    //
    // Why hybrid: the deployed wallet is single-key (all agents share one
    // address). Doing two on-chain bids from the same address looks weird in
    // the bid list. Keeping the bidding tail as a simulation preserves the
    // "two competing volunteers" demo while still proving real Monad write
    // capability with the postRequest tx.
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

            // The on-chain post already registered a SimRequest in the sim engine
            // and emitted a real RequestPosted event. Now run the simulated tail
            // (Anil + Bina bid → close → proof → verifier) so the UI animates
            // exactly like the mock did.
            after(async () => {
                try {
                    await runMockAgentFlowForExistingRequest(result.requestId);
                } catch (err) {
                    console.error("[api/request] simulated tail failed", err);
                }
            });

            return NextResponse.json({
                ok: true,
                source: "hybrid",
                requestId: result.requestId,
                txHash: result.txHash,
                ipfsUri: result.ipfsUri,
                explorerUrl: result.explorerUrl,
                deadline: result.deadline,
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

    // Local-dev fallback: no contract configured → full in-memory simulation.
    console.warn("[api/request] ESCROW_ADDRESS not set — falling back to in-memory simulation");
    const simReq = simulateRequest(parsed.data);
    return NextResponse.json({
        ok: true,
        source: "simulation",
        requestId: simReq.id,
        txHash: `0xsim_${simReq.id.toString(16).padStart(8, "0")}`,
        ipfsUri: simReq.ipfsUri,
        message:
            "ESCROW_ADDRESS not configured — running fully simulated flow. Set the env var to use real Monad testnet for the post.",
    });
}
