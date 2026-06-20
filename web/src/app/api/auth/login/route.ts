import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession, verifyUser } from "@/lib/auth/session";

// node:fs is used downstream in the JSON store. Pin runtime so this never
// gets edge-bundled by accident on Vercel.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});

export async function POST(req: Request): Promise<Response> {
    try {
        const json = await req.json().catch(() => null);
        const parsed = Body.safeParse(json);
        if (!parsed.success) {
            return NextResponse.json({ error: "Invalid email or password" }, { status: 400 });
        }
        const user = verifyUser(parsed.data.email, parsed.data.password);
        if (!user) {
            return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
        }
        const session = await getSession();
        session.user = user;
        await session.save();
        return NextResponse.json({ ok: true, user });
    } catch (err) {
        // Log the real error to Vercel function logs and return a useful body.
        console.error("[api/auth/login] failed", err);
        const message = err instanceof Error ? err.message : "Internal error";
        return NextResponse.json(
            { error: "Login failed", detail: message },
            { status: 500 },
        );
    }
}
