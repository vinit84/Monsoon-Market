import { isX402FacilitatorEnabled } from "@/config/tiers";
import { getServerEnv } from "@/config/env";
import type { AgentLabel } from "./wallets";

/**
 * x402 Payment Helper.
 *
 * MVP_Tier: passes the request through with `X-Demo-Tier: mvp` header.
 * Demo_Plus_Tier: when receiving a 402, signs an authorization payload and
 * settles via the Monad facilitator at https://x402-facilitator.molandak.org.
 *
 * The implementation here is intentionally tier-aware so call sites do not need
 * to branch on the tier themselves.
 */

export interface PaidFetchOptions {
    /** Agent label whose wallet should sign the payment authorization. */
    asAgent: AgentLabel;
    /** Maximum MON amount the caller is willing to pay (Demo-Plus only). */
    maxMon: number;
}

export interface PaidFetchResult<T> {
    data: T;
    paid: boolean;
    txHash?: `0x${string}`;
    /** "mvp" when no payment was required, "demo-plus" when settled via facilitator. */
    tier: "mvp" | "demo-plus";
}

export async function paidFetchJson<T>(
    url: string,
    options: PaidFetchOptions & { method?: "GET" | "POST"; body?: unknown },
): Promise<PaidFetchResult<T>> {
    const method = options.method ?? "GET";
    const body = options.body ? JSON.stringify(options.body) : undefined;

    const initial = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body,
    });

    if (initial.status === 200) {
        const data = (await initial.json()) as T;
        const tier = (initial.headers.get("X-Demo-Tier") as "mvp" | "demo-plus") ?? "mvp";
        return { data, paid: false, tier };
    }

    if (initial.status !== 402) {
        throw new Error(`paidFetchJson: unexpected ${initial.status} from ${url}`);
    }

    if (!isX402FacilitatorEnabled()) {
        // MVP: shouldn't happen because endpoints don't 402 in MVP, but be defensive.
        throw new Error(`paidFetchJson: 402 received in MVP tier — endpoint misconfigured?`);
    }

    // Demo-Plus path — settle via Monad facilitator and retry with payment header.
    // TODO(monsoon-mandi): implement EIP-712 signing of the payment authorization
    //   and POST to `${X402_FACILITATOR_URL}/settle`. Refer to:
    //   https://docs.monad.xyz/guides/x402-guide
    void getServerEnv().X402_FACILITATOR_URL;
    void options.asAgent;
    void options.maxMon;
    throw new Error("paidFetchJson: x402 facilitator settle not implemented yet");
}
