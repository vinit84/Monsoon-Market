import { NextResponse } from "next/server";
import { db } from "@/lib/db/store";

export async function GET(): Promise<Response> {
    const volunteers = db.listVolunteers().map((v) => ({
        walletAddress: v.walletAddress,
        displayName: v.displayName,
        serviceAreas: v.serviceAreas,
        completedTasks: v.completedTasks,
        createdAt: v.createdAt,
    }));
    return NextResponse.json({ volunteers });
}
