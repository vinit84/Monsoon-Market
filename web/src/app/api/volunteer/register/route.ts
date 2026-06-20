import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/store";

const Body = z.object({
    walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/u),
    displayName: z.string().min(1),
    phone: z.string().optional(),
    serviceAreas: z.array(z.string()).min(1, "Pick at least one service area"),
});

export async function POST(req: Request): Promise<Response> {
    const session = await getSession();
    if (!session.user) {
        return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    }

    const json = await req.json().catch(() => null);
    const parsed = Body.safeParse(json);
    if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }

    if (db.findVolunteerByWallet(parsed.data.walletAddress)) {
        return NextResponse.json({ error: "This wallet is already registered as a volunteer" }, { status: 409 });
    }
    if (db.findVolunteerByEmail(session.user.email)) {
        return NextResponse.json({ error: "You're already registered as a volunteer" }, { status: 409 });
    }

    const volunteer = db.createVolunteer({
        walletAddress: parsed.data.walletAddress,
        userEmail: session.user.email,
        displayName: parsed.data.displayName,
        phone: parsed.data.phone,
        serviceAreas: parsed.data.serviceAreas,
        completedTasks: 0,
        createdAt: Date.now(),
    });

    // Attach wallet to user record
    db.attachWallet(session.user.email, parsed.data.walletAddress);
    session.user.walletAddress = parsed.data.walletAddress.toLowerCase();
    await session.save();

    return NextResponse.json({ ok: true, volunteer });
}

export async function GET(): Promise<Response> {
    const session = await getSession();
    if (!session.user) {
        return NextResponse.json({ volunteer: null });
    }
    const volunteer = db.findVolunteerByEmail(session.user.email);
    return NextResponse.json({ volunteer });
}
