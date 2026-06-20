import { NextResponse } from "next/server";
import { bootstrapAgents, activeAgents } from "@/lib/agents/bootstrap";

export async function POST(req: Request): Promise<Response> {
    const baseUrl = new URL(req.url).origin;
    const handles = bootstrapAgents(baseUrl);
    return NextResponse.json({
        ok: true,
        agents: handles.map((h) => ({ label: h.label, address: h.address })),
    });
}

export async function GET(): Promise<Response> {
    return NextResponse.json({
        agents: activeAgents().map((h) => ({ label: h.label, address: h.address })),
    });
}
