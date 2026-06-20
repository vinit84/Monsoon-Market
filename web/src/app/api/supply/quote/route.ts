import { NextResponse } from "next/server";
import { getInventoryQuote } from "@/lib/core/inventory-matcher";
import { isX402FacilitatorEnabled } from "@/config/tiers";

/** Supply Agent paid endpoint — same tier semantics as /api/route/quote. */
export async function GET(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const category = url.searchParams.get("category") ?? "medicine";

    if (isX402FacilitatorEnabled()) {
        const paymentHeader = req.headers.get("x-payment");
        if (!paymentHeader) {
            return new NextResponse(
                JSON.stringify({
                    x402: { scheme: "exact", amountMon: 0.001, payTo: "0x", error: "payment required" },
                }),
                { status: 402, headers: { "content-type": "application/json", "X-Demo-Tier": "demo-plus" } },
            );
        }
    }

    const quote = getInventoryQuote(category);
    return NextResponse.json(quote, { headers: { "X-Demo-Tier": isX402FacilitatorEnabled() ? "demo-plus" : "mvp" } });
}
