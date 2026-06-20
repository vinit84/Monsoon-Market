import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession, verifyUser } from "@/lib/auth/session";

const Body = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});

export async function POST(req: Request): Promise<Response> {
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
}
