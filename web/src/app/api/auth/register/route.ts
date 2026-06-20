import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession, createUser, userExists } from "@/lib/auth/session";

const Body = z.discriminatedUnion("role", [
    z.object({
        role: z.literal("resident"),
        email: z.string().email(),
        password: z.string().min(6, "Password must be at least 6 characters"),
        name: z.string().min(1, "Name required"),
    }),
    z.object({
        role: z.literal("volunteer"),
        email: z.string().email(),
        password: z.string().min(6, "Password must be at least 6 characters"),
        name: z.string().min(1, "Name required"),
        walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/u, "Connect a valid wallet"),
        displayName: z.string().min(1, "Display name required"),
        phone: z.string().optional(),
        serviceAreas: z.array(z.string()).min(1, "Pick at least one service area"),
    }),
]);

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
        const data = parsed.data;
        const user =
            data.role === "volunteer"
                ? createUser({
                      email: data.email,
                      password: data.password,
                      name: data.name,
                      role: "volunteer",
                      walletAddress: data.walletAddress,
                      volunteerFields: {
                          displayName: data.displayName,
                          phone: data.phone,
                          serviceAreas: data.serviceAreas,
                      },
                  })
                : createUser({
                      email: data.email,
                      password: data.password,
                      name: data.name,
                      role: "resident",
                  });
        const session = await getSession();
        session.user = user;
        await session.save();
        return NextResponse.json({ ok: true, user });
    } catch (e) {
        return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 400 });
    }
}
