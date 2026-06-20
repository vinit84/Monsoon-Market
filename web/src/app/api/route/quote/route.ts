import { NextResponse } from "next/server";
import { getRouteQuote } from "@/lib/core/route-service";
import { isX402FacilitatorEnabled } from "@/config/tiers";
import { getServerEnv } from "@/config/env";

/**
 * Route Agent paid endpoint.
 * MVP_Tier: returns 200 with the quote and `X-Demo-Tier: mvp`.
 * Demo_Plus_Tier: 402 + payment-required payload until x402 settle is verified.
 */
export async function GET(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const origin = url.searchParams.get("origin") ?? "andheri_w";
    const destination = url.searchParams.get("destination") ?? "andheri_e";

    if (isX402FacilitatorEnabled()) {
        const paymentHeader = req.headers.get("x-payment");
        if (!paymentHeader) {
            return new NextResponse(
                JSON.stringify({
                    x402: {
                        scheme: "exact",
                        network: `eip155:${getServerEnv().MONAD_TESTNET_CHAIN_ID}`,
                        amountMon: 0.001,
                        payTo: getServerEnv().IDENTITY_REGISTRY, // placeholder; replace with Route Agent address at boot
                        facilitator: getServerEnv().X402_FACILITATOR_URL,
                    },
                    error: "payment required",
                }),
                {
                    status: 402,
                    headers: { "content-type": "application/json", "X-Demo-Tier": "demo-plus" },
                },
            );
        }
        // TODO(monsoon-mandi): verify paymentHeader via facilitator before serving
    }

    const quote = getRouteQuote(origin, destination);
    if (!quote) {
        return NextResponse.json({ error: "no route" }, { status: 404, headers: { "X-Demo-Tier": "mvp" } });
    }
    return NextResponse.json(quote, { headers: { "X-Demo-Tier": isX402FacilitatorEnabled() ? "demo-plus" : "mvp" } });
}
