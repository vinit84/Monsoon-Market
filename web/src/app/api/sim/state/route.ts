import { NextResponse } from "next/server";
import { getRequests, getReputation, getEarnings } from "@/lib/sim/engine";

/** GET the current simulation state for UI polling. */
export async function GET(): Promise<Response> {
    return NextResponse.json({
        requests: getRequests(),
        reputation: getReputation(),
        earnings: getEarnings(),
    });
}
