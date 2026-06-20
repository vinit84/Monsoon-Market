import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession, createUser, userExists } from "@/lib/auth/session";

const Body = z.object({
    email: z.string().email(),
    password: z.string().min(6, "Password must be at least 6 characters"),
    name: z.string().min(1, "Name required"),
});

export async function POST(req: Request): Promise<Response> {
    const json = await req.json().catch(() => null);
    const parsed = Body.safeParse(json);
    if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }
    if (userExists(parsed.data.email)) {
        return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }
    try {
        const user = createUser(parsed.data.email, parsed.data.password, parsed.data.name);
        const session = await getSession();
        session.user = user;
        await session.save();
        return NextResponse.json({ ok: true, user });
    } catch (e) {
        return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 400 });
    }
}
