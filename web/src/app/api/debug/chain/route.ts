import { NextResponse } from "next/server";
import { getServerEnv } from "@/config/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Read-only diagnostic endpoint. Returns the on-chain config the running
 * Vercel function actually sees. Use to confirm env-var updates landed
 * after a redeploy. No private keys or secrets are exposed.
 */
export async function GET(): Promise<Response> {
    try {
        const env = getServerEnv();
        return NextResponse.json({
            ok: true,
            rpcUrl: env.MONAD_TESTNET_RPC_URL,
            chainId: env.MONAD_TESTNET_CHAIN_ID,
            explorer: env.MONAD_TESTNET_EXPLORER,
            escrowAddress: env.ESCROW_ADDRESS ?? null,
            tier: env.DEMO_TIER,
            mode: env.DEMO_MODE,
            // sanity: make sure the right keys are configured (don't leak values)
            hasResidentRelayerKey: Boolean(env.RESIDENT_RELAYER_PK),
            hasVolunteerAKey: Boolean(env.VOLUNTEER_A_PK),
            hasVolunteerBKey: Boolean(env.VOLUNTEER_B_PK),
            hasVerifierKey: Boolean(env.VERIFIER_PK),
            hasNugenKey: Boolean(env.NUGEN_API_KEY),
        });
    } catch (err) {
        return NextResponse.json(
            { ok: false, error: err instanceof Error ? err.message : String(err) },
            { status: 500 },
        );
    }
}
