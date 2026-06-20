import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";

export async function POST(): Promise<Response> {
    const session = await getSession();
    session.destroy();
    return NextResponse.json({ ok: true });
}
