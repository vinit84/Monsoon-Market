import { NextResponse } from "next/server";
import { z } from "zod";
import { walletFor } from "@/lib/onchain/wallets";
import { writeEscrow } from "@/lib/onchain/escrow-client";
import { pinImage } from "@/lib/ipfs/pin";
import { isStagedMode } from "@/config/tiers";

const Body = z.object({
    requestId: z.string().regex(/^\d+$/u),
    /** Volunteer label that won the auction and is submitting proof. */
    asAgent: z.enum(["volunteer-a", "volunteer-b"]),
    /** Base64-encoded proof image, optional in staged mode. */
    imageBase64: z.string().optional(),
});

export async function POST(req: Request): Promise<Response> {
    const json = await req.json().catch(() => null);
    const parsed = Body.safeParse(json);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    const { requestId, asAgent, imageBase64 } = parsed.data;

    let ipfsUri: string;
    if (imageBase64) {
        const buf = Buffer.from(imageBase64, "base64");
        ipfsUri = await pinImage(buf, `proof-${requestId}.jpg`);
    } else if (isStagedMode()) {
        // Staged-mode placeholder URI; the Verifier will use the deterministic fallback.
        ipfsUri = `ipfs://staged/proof-${requestId}.jpg`;
    } else {
        return NextResponse.json({ error: "image required in live mode" }, { status: 400 });
    }

    const wallet = walletFor(asAgent);
    const escrow = writeEscrow(wallet);
    const txHash = await escrow.write.submitProof([BigInt(requestId), ipfsUri], {
        chain: wallet.chain,
        account: wallet.account!,
    });
    return NextResponse.json({ ok: true, txHash, ipfsUri });
}
