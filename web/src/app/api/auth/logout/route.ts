import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(): Promise<Response> {
    try {
        const session = await getSession();
        session.destroy();
        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error("[api/auth/logout] failed", err);
        return NextResponse.json({ ok: true });
    }
}
