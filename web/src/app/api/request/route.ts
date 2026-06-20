import { NextResponse } from "next/server";
import { z } from "zod";
import { residentPostRequest } from "@/lib/agents/resident-relayer";
import { pinJson } from "@/lib/ipfs/pin";

const Body = z.object({
    category: z.string().min(1),
    description: z.string().min(1),
    location: z.string().min(1),
    bountyMon: z.number().positive(),
    requesterAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/u),
    requesterSignature: z.string().optional(),
});

export async function POST(req: Request): Promise<Response> {
    const json = await req.json().catch(() => null);
    const parsed = Body.safeParse(json);
    if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const ipfsUri = await pinJson(parsed.data, `request-${Date.now()}.json`);
    const txHash = await residentPostRequest({ bountyMon: parsed.data.bountyMon, ipfsUri });
    return NextResponse.json({ ok: true, txHash, ipfsUri });
}
