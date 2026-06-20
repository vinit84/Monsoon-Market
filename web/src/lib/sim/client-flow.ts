"use client";

import { emitClient, type ClientStreamEvent } from "./client-stream";

/**
 * Client-side simulated agent tail.
 *
 * Given the response from `POST /api/request` (which contains the real
 * Monad testnet tx hash for `postRequest`), this scheduler emits the
 * subsequent agent events into the client event bus over ~22 seconds —
 * Supply quote → Route quote → Anil bid → Bina bid → auction close →
 * proof → verifier accept → reputation +1.
 *
 * Running this in the browser instead of in a Vercel `after()` callback
 * sidesteps the lambda-isolation issue: every UI panel reads from the
 * same in-tab event bus, so Tx Stream and Live Bids can never disagree.
 */

export interface KickoffInput {
    /** Real on-chain RequestPosted tx hash. */
    txHash: string;
    /** Real Monadscan URL for the postRequest tx. */
    explorerUrl: string;
    requestId: number;
    ipfsUri: string;
    deadlineMs: number;
    bountyMon: number;
    category: string;
    location: string;
    description: string;
    requesterAddress: string;
    /** When source is "simulation" (no contract configured) we skip the explorer URL fluff. */
    source: "onchain" | "simulation" | "hybrid";
}

const AGENTS = {
    resident: { label: "Resident Relayer", address: "0xD761096e542a344429CeB1a68C52bDAB1dB9C78D" },
    volunteerA: { label: "Volunteer Anil", address: "0xA111111111111111111111111111111111111111" },
    volunteerB: { label: "Volunteer Bina", address: "0xB222222222222222222222222222222222222222" },
    supply: { label: "Supply Agent", address: "0xC333333333333333333333333333333333333333" },
    route: { label: "Route Agent", address: "0xD444444444444444444444444444444444444444" },
    verifier: { label: "Verifier Agent", address: "0xE555555555555555555555555555555555555555" },
};

// Simple in-memory reputation map keyed by agent address. Persists across
// requests in the same browser tab so repeat winners get a small score boost.
const _clientReputation: Record<string, number> = {};

function fakeTxHash(): string {
    return `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`;
}

function delay(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
}

let _nextBlock = 1;
function nextBlock(): number {
    return _nextBlock++;
}

/**
 * Kicks off the simulated tail. Returns immediately; events fire over time.
 * Idempotent guard: scheduling twice for the same requestId is a no-op.
 */
const _scheduled = new Set<number>();

export function kickoffClientFlow(input: KickoffInput): void {
    if (_scheduled.has(input.requestId)) return;
    _scheduled.add(input.requestId);

    // 1. Real on-chain RequestPosted (already happened server-side; just record it).
    emitClient({
        txHash: input.txHash,
        blockNumber: nextBlock(),
        eventName: "RequestPosted",
        actionLabel: "postRequest",
        actor: AGENTS.resident.address,
        requestId: String(input.requestId),
        explorerUrl: input.explorerUrl,
        observedAt: Date.now(),
        details:
            input.source === "onchain" || input.source === "hybrid"
                ? `Bounty ${input.bountyMon} MON · ${input.location} · IPFS ${input.ipfsUri.slice(0, 24)}…`
                : `Bounty: ${input.bountyMon} MON · Location: ${input.location}`,
        payload: {
            bountyMon: input.bountyMon,
            category: input.category,
            location: input.location,
            description: input.description,
            deadline: input.deadlineMs,
            ipfsUri: input.ipfsUri,
            requesterAddress: input.requesterAddress,
        },
    });

    void runScheduledFlow(input);
}

async function runScheduledFlow(input: KickoffInput): Promise<void> {
    const { requestId, bountyMon } = input;
    const reqIdStr = String(requestId);

    await delay(1000);
    emitClient({
        txHash: fakeTxHash(),
        blockNumber: nextBlock(),
        eventName: "SupplyQuote",
        actionLabel: "supplyQuote",
        actor: AGENTS.supply.address,
        requestId: reqIdStr,
        explorerUrl: "#",
        observedAt: Date.now(),
        details: "Checked inventory: medicine available at Andheri Pharma Co-op",
    });

    await delay(500);
    emitClient({
        txHash: fakeTxHash(),
        blockNumber: nextBlock(),
        eventName: "RouteQuote",
        actionLabel: "routeQuote (x402 paid)",
        actor: AGENTS.route.address,
        requestId: reqIdStr,
        explorerUrl: "#",
        observedAt: Date.now(),
        details: "Route: Andheri W → Andheri E via Marol (avoiding Sion flood). ETA: 480s",
    });

    // Volunteer Anil (faster, slightly higher fee — markup 1.15, ETA × 0.85)
    await delay(500);
    const anilPrice = round3(bountyMon * 0.7 + Math.random() * 0.01);
    const anilEta = 300 + Math.floor(Math.random() * 60);
    const anilCompleted = _clientReputation[AGENTS.volunteerA.address] ?? 0;
    const anilScore = anilPrice / (1 + anilCompleted);
    emitClient({
        txHash: fakeTxHash(),
        blockNumber: nextBlock(),
        eventName: "BidSubmitted",
        actionLabel: "submitBid",
        actor: AGENTS.volunteerA.address,
        requestId: reqIdStr,
        explorerUrl: "#",
        observedAt: Date.now(),
        details: `Price: ${anilPrice} MON · ETA: ${anilEta}s · Stake: 0.01 MON`,
        payload: {
            agentLabel: AGENTS.volunteerA.label,
            agentAddress: AGENTS.volunteerA.address,
            priceMon: anilPrice,
            etaSeconds: anilEta,
            completedTasks: anilCompleted,
            score: anilScore,
        },
    });

    // Volunteer Bina (slower, lower fee — markup 1.05, ETA × 1.1)
    await delay(1000);
    const binaPrice = round3(bountyMon * 0.6 + Math.random() * 0.01);
    const binaEta = 400 + Math.floor(Math.random() * 60);
    const binaCompleted = _clientReputation[AGENTS.volunteerB.address] ?? 0;
    const binaScore = binaPrice / (1 + binaCompleted);
    emitClient({
        txHash: fakeTxHash(),
        blockNumber: nextBlock(),
        eventName: "BidSubmitted",
        actionLabel: "submitBid",
        actor: AGENTS.volunteerB.address,
        requestId: reqIdStr,
        explorerUrl: "#",
        observedAt: Date.now(),
        details: `Price: ${binaPrice} MON · ETA: ${binaEta}s · Stake: 0.01 MON`,
        payload: {
            agentLabel: AGENTS.volunteerB.label,
            agentAddress: AGENTS.volunteerB.address,
            priceMon: binaPrice,
            etaSeconds: binaEta,
            completedTasks: binaCompleted,
            score: binaScore,
        },
    });

    // Auction window — give the bids time to settle visually.
    await delay(15_000);

    const winnerIsAnil = anilScore <= binaScore;
    const winner = winnerIsAnil
        ? { label: AGENTS.volunteerA.label, address: AGENTS.volunteerA.address, price: anilPrice }
        : { label: AGENTS.volunteerB.label, address: AGENTS.volunteerB.address, price: binaPrice };

    emitClient({
        txHash: fakeTxHash(),
        blockNumber: nextBlock(),
        eventName: "AuctionClosed",
        actionLabel: "closeAuction",
        actor: AGENTS.resident.address,
        requestId: reqIdStr,
        explorerUrl: "#",
        observedAt: Date.now(),
        details: `Winner: ${winner.label} · Price: ${winner.price} MON · Losing stake refunded`,
        payload: {
            winnerAddress: winner.address,
            winnerLabel: winner.label,
            winningPriceMon: winner.price,
        },
    });

    await delay(2000);
    emitClient({
        txHash: fakeTxHash(),
        blockNumber: nextBlock(),
        eventName: "ProofSubmitted",
        actionLabel: "submitProof",
        actor: winner.address,
        requestId: reqIdStr,
        explorerUrl: "#",
        observedAt: Date.now(),
        details: "Photo proof uploaded: delivery confirmed at location",
    });

    await delay(2000);
    _clientReputation[winner.address] = (_clientReputation[winner.address] ?? 0) + 1;
    const stake = 0.01;
    const payout = winner.price + stake;
    const surplus = round4(bountyMon - winner.price);
    emitClient({
        txHash: fakeTxHash(),
        blockNumber: nextBlock(),
        eventName: "AttestationAccepted",
        actionLabel: "attestation ✓",
        actor: AGENTS.verifier.address,
        requestId: reqIdStr,
        explorerUrl: "#",
        observedAt: Date.now(),
        details: `Verdict: ACCEPTED (Nugen vision) · ${winner.label} earned ${payout.toFixed(4)} MON (price ${winner.price} + stake ${stake}) · Surplus ${surplus.toFixed(4)} MON refunded`,
        payload: { verdict: "accepted" },
    });

    await delay(500);
    emitClient({
        txHash: fakeTxHash(),
        blockNumber: nextBlock(),
        eventName: "ReputationUpdated",
        actionLabel: "reputation +1",
        actor: winner.address,
        requestId: reqIdStr,
        explorerUrl: "#",
        observedAt: Date.now(),
        details: `${winner.label} now has ${_clientReputation[winner.address]} completed task${_clientReputation[winner.address] === 1 ? "" : "s"}`,
    });
}

function round3(n: number): number {
    return Math.round(n * 1000) / 1000;
}

function round4(n: number): number {
    return Math.round(n * 10_000) / 10_000;
}
