import { NextResponse } from "next/server";
import { z } from "zod";
import { simulateRequest } from "@/lib/sim/engine";

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

    // Use simulation engine — runs entire agent flow in-memory
    const simReq = simulateRequest(parsed.data);

    return NextResponse.json({
        ok: true,
        requestId: simReq.id,
        txHash: `0xsim_${simReq.id.toString(16).padStart(8, "0")}`,
        ipfsUri: simReq.ipfsUri,
        message: "Request posted. Agent auction running (simulated). Watch the Tx Stream.",
    });
}
