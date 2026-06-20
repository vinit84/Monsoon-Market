import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
    try {
        const session = await getSession();
        return NextResponse.json({ user: session.user ?? null });
    } catch (err) {
        console.error("[api/auth/me] failed", err);
        // Treat decryption / cookie errors as "no session" rather than 500ing.
        return NextResponse.json({ user: null });
    }
}
