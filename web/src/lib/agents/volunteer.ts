import { walletFor, accountFor } from "@/lib/onchain/wallets";
import { writeEscrow, ESCROW_CONSTANTS } from "@/lib/onchain/escrow-client";
import { getPublicClient } from "@/lib/onchain/chain";
import { monsoonMandiEscrowAbi } from "@/lib/onchain/escrow-abi";
import { paidFetchJson } from "@/lib/onchain/x402-helper";
import type { VolunteerPersona, AgentRunHandle } from "./types";
import { getServerEnv } from "@/config/env";

interface RouteQuoteResponse {
    distanceMeters: number;
    etaSeconds: number;
    floodPenaltyMon: number;
}
interface SupplyQuoteResponse {
    available: boolean;
    costEstimateMon?: number;
}

const STAKE = ESCROW_CONSTANTS.STAKE_AMOUNT_WEI;

/**
 * Volunteer agent loop. Watches RequestPosted events, computes a quote by
 * paying the Supply and Route agent endpoints, and submits a bid if its
 * persona-adjusted total is at most the bounty.
 *
 * Implementation note: this is a server-side long-lived listener. The
 * bootstrap module starts one of these per VolunteerPersona at app boot.
 */
export function startVolunteerLoop(persona: VolunteerPersona, baseUrl: string): AgentRunHandle {
    const account = accountFor(persona.label);
    let unwatch: (() => void) | null = null;

    const client = getPublicClient();
    const env = getServerEnv();
    if (!env.ESCROW_ADDRESS) {
        console.warn(`[${persona.label}] ESCROW_ADDRESS unset; loop dormant`);
        return { label: persona.label, address: account.address, stop: () => {} };
    }

    unwatch = client.watchContractEvent({
        address: env.ESCROW_ADDRESS as `0x${string}`,
        abi: monsoonMandiEscrowAbi,
        eventName: "RequestPosted",
        onLogs: async (logs) => {
            for (const log of logs) {
                try {
                    await onRequestPosted(persona, baseUrl, log as unknown as { args?: Record<string, unknown> });
                } catch (e) {
                    console.warn(`[${persona.label}] bid failed:`, e);
                }
            }
        },
    });

    return {
        label: persona.label,
        address: account.address,
        stop: () => unwatch?.(),
    };
}

async function onRequestPosted(
    persona: VolunteerPersona,
    baseUrl: string,
    log: { args?: Record<string, unknown> },
): Promise<void> {
    const args = log.args ?? {};
    const requestId = args.requestId as bigint;
    const bountyAmount = args.bountyAmount as bigint;

    // Parallel fetches — the Volunteer hits both quote endpoints.
    const [route, supply] = await Promise.all([
        paidFetchJson<RouteQuoteResponse>(`${baseUrl}/api/route/quote?origin=andheri_w&destination=andheri_e`, {
            asAgent: persona.label,
            maxMon: 0.005,
        }),
        paidFetchJson<SupplyQuoteResponse>(`${baseUrl}/api/supply/quote?category=medicine&location=andheri_e`, {
            asAgent: persona.label,
            maxMon: 0.005,
        }),
    ]);

    if (!supply.data.available) {
        console.log(`[${persona.label}] no supply, skipping bid`);
        return;
    }
    const baseCostMon =
        (supply.data.costEstimateMon ?? 0.01) + (route.data.floodPenaltyMon ?? 0) + 0.005; // delivery markup
    const bidPriceMon = baseCostMon * persona.pricingMarkup;
    const bidEtaSec = Math.round(route.data.etaSeconds * persona.etaMultiplier);

    const bountyMon = Number(bountyAmount) / 1e18;
    if (bidPriceMon > bountyMon) {
        console.log(`[${persona.label}] price ${bidPriceMon} > bounty ${bountyMon}, skipping`);
        return;
    }

    const wallet = walletFor(persona.label);
    const escrow = writeEscrow(wallet);
    const priceWei = BigInt(Math.floor(bidPriceMon * 1e18));
    await escrow.write.submitBid([requestId, priceWei, BigInt(bidEtaSec)], {
        value: STAKE,
        chain: wallet.chain,
        account: wallet.account!,
    });
    console.log(`[${persona.label}] submitted bid for #${requestId}: ${bidPriceMon} MON / ${bidEtaSec}s`);
}
