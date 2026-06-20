import { NextResponse } from "next/server";
import { z } from "zod";
import { walletFor } from "@/lib/onchain/wallets";
import { writeEscrow } from "@/lib/onchain/escrow-client";
import { isStagedMode } from "@/config/tiers";

const Body = z.object({ requestId: z.string().regex(/^\d+$/u) });

export async function POST(req: Request): Promise<Response> {
    if (!isStagedMode()) {
        return NextResponse.json({ error: "force-close only available in staged mode" }, { status: 403 });
    }
    const json = await req.json().catch(() => null);
    const parsed = Body.safeParse(json);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const wallet = walletFor("resident-relayer");
    const escrow = writeEscrow(wallet);
    const txHash = await escrow.write.closeAuction([BigInt(parsed.data.requestId)], {
        chain: wallet.chain,
        account: wallet.account!,
    });
    return NextResponse.json({ ok: true, txHash });
}
