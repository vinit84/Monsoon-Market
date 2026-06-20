import { NextResponse } from "next/server";
import { z } from "zod";
import { addHumanBid } from "@/lib/sim/engine";

const Body = z.object({
    requestId: z.number().int().positive(),
    priceMon: z.number().positive(),
    etaSeconds: z.number().int().positive(),
    walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/u),
    displayName: z.string().min(1),
});

export async function POST(req: Request): Promise<Response> {
    const json = await req.json().catch(() => null);
    const parsed = Body.safeParse(json);
    if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }
    const result = addHumanBid(parsed.data);
    if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ ok: true, bid: result.bid });
}
