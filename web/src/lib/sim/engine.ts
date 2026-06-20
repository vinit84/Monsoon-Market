/**
 * Simulation Engine — runs the entire Monsoon Market agent economy in-memory.
 * No blockchain needed. Used when ESCROW_ADDRESS is not set or RPC is unreachable.
 * Produces the same event shapes as the real on-chain flow for UI compatibility.
 */

export type SimState = "idle" | "open" | "awarded" | "fulfilled" | "disputed" | "failed";

export interface SimRequest {
    id: number;
    category: string;
    description: string;
    location: string;
    bountyMon: number;
    requesterAddress: string;
    ipfsUri: string;
    state: SimState;
    deadline: number; // timestamp ms
    bids: SimBid[];
    winner?: SimBid;
    proofUri?: string;
    verdict?: "accepted" | "rejected";
    createdAt: number;
}

export interface SimBid {
    agentLabel: string;
    agentAddress: string;
    priceMon: number;
    etaSeconds: number;
    completedTasks: number;
    score: number;
    txHash: string;
}

export interface SimEvent {
    txHash: string;
    blockNumber: number;
    eventName: string;
    actionLabel: string;
    actor: string;
    requestId: string;
    explorerUrl: string;
    observedAt: number;
    details?: string;
}

type Listener = (e: SimEvent) => void;

let _nextId = 0;
let _blockNumber = 1;
const _requests: SimRequest[] = [];
const _events: SimEvent[] = [];
const _listeners = new Set<Listener>();
const _reputation: Record<string, number> = {};
const _earnings: Record<string, number> = {};

function fakeTxHash(): string {
    return `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`;
}

function emit(event: Omit<SimEvent, "observedAt">): SimEvent {
    const e: SimEvent = { ...event, observedAt: Date.now() };
    _events.push(e);
    _listeners.forEach((l) => l(e));
    _blockNumber++;
    return e;
}

/**
 * External entry point so on-chain orchestrators can push real events into the
 * same UI event stream the simulation uses. Real events carry real tx hashes
 * and Monadscan explorer URLs.
 */
export function emitEvent(event: Omit<SimEvent, "observedAt">): SimEvent {
    return emit(event);
}

/** Used by orchestrator when an on-chain request is created so subsequent flow steps can attach to it. */
export function registerExternalRequest(request: SimRequest): void {
    if (!_requests.find((r) => r.id === request.id)) {
        _requests.push(request);
    }
    if (request.id > _nextId) _nextId = request.id;
}

export function findRequest(id: number): SimRequest | undefined {
    return _requests.find((r) => r.id === id);
}

export function subscribe(l: Listener): () => void {
    _listeners.add(l);
    return () => _listeners.delete(l);
}

export function getRequests(): SimRequest[] {
    return [..._requests];
}

export function getEvents(): SimEvent[] {
    return [..._events];
}

export function getReputation(): Record<string, number> {
    return { ..._reputation };
}

export function getEarnings(): Record<string, number> {
    return { ..._earnings };
}

// --- Agent definitions ---
const AGENTS = {
    resident: { label: "Resident Relayer", address: "0xD761096e542a344429CeB1a68C52bDAB1dB9C78D" },
    volunteerA: { label: "Volunteer Anil", address: "0xA111111111111111111111111111111111111111" },
    volunteerB: { label: "Volunteer Bina", address: "0xB222222222222222222222222222222222222222" },
    supply: { label: "Supply Agent", address: "0xC333333333333333333333333333333333333333" },
    route: { label: "Route Agent", address: "0xD444444444444444444444444444444444444444" },
    verifier: { label: "Verifier Agent", address: "0xE555555555555555555555555555555555555555" },
};

// Ensure initial reputation
Object.values(AGENTS).forEach((a) => {
    if (!_reputation[a.address]) _reputation[a.address] = 0;
});

/**
 * Simulate the full agent flow for a new request.
 * Returns immediately, but events are emitted asynchronously over ~15 seconds
 * to mimic the real on-chain timing.
 */
export function simulateRequest(req: {
    category: string;
    description: string;
    location: string;
    bountyMon: number;
    requesterAddress: string;
}): SimRequest {
    const id = ++_nextId;
    const ipfsUri = `ipfs://bafymock${id.toString(16).padStart(8, "0")}/request-${id}.json`;
    const now = Date.now();
    const request: SimRequest = {
        id,
        ...req,
        ipfsUri,
        state: "open",
        deadline: now + 20_000,
        bids: [],
        createdAt: now,
    };
    _requests.push(request);

    // Emit RequestPosted
    emit({
        txHash: fakeTxHash(),
        blockNumber: _blockNumber,
        eventName: "RequestPosted",
        actionLabel: "postRequest",
        actor: AGENTS.resident.address,
        requestId: String(id),
        explorerUrl: `#tx-${_blockNumber}`,
        details: `Bounty: ${req.bountyMon} MON · Location: ${req.location}`,
    });

    // Schedule agent actions
    scheduleAgentFlow(request);
    return request;
}

async function scheduleAgentFlow(request: SimRequest) {
    const { id } = request;

    // 1. Supply Agent quotes (1s delay)
    await delay(1000);
    emit({
        txHash: fakeTxHash(),
        blockNumber: _blockNumber,
        eventName: "SupplyQuote",
        actionLabel: "supplyQuote",
        actor: AGENTS.supply.address,
        requestId: String(id),
        explorerUrl: `#tx-${_blockNumber}`,
        details: "Checked inventory: medicine available at Andheri Pharma Co-op",
    });
    // 2. Route Agent quotes (1.5s delay)
    await delay(500);
    emit({
        txHash: fakeTxHash(),
        blockNumber: _blockNumber,
        eventName: "RouteQuote",
        actionLabel: "routeQuote (x402 paid)",
        actor: AGENTS.route.address,
        requestId: String(id),
        explorerUrl: `#tx-${_blockNumber}`,
        details: "Route: Andheri W → Andheri E via Marol (avoiding Sion flood). ETA: 480s",
    });

    // 3. Volunteer A bids (2s delay)
    await delay(500);
    const bidA: SimBid = {
        agentLabel: AGENTS.volunteerA.label,
        agentAddress: AGENTS.volunteerA.address,
        priceMon: Math.round((request.bountyMon * 0.7 + Math.random() * 0.01) * 1000) / 1000,
        etaSeconds: 300 + Math.floor(Math.random() * 60),
        completedTasks: _reputation[AGENTS.volunteerA.address] ?? 0,
        score: 0,
        txHash: fakeTxHash(),
    };
    bidA.score = bidA.priceMon / (1 + bidA.completedTasks);
    request.bids.push(bidA);
    emit({
        txHash: bidA.txHash,
        blockNumber: _blockNumber,
        eventName: "BidSubmitted",
        actionLabel: "submitBid",
        actor: bidA.agentAddress,
        requestId: String(id),
        explorerUrl: `#tx-${_blockNumber}`,
        details: `Price: ${bidA.priceMon} MON · ETA: ${bidA.etaSeconds}s · Stake: 0.01 MON`,
    });

    // 4. Volunteer B bids (3s delay)
    await delay(1000);
    const bidB: SimBid = {
        agentLabel: AGENTS.volunteerB.label,
        agentAddress: AGENTS.volunteerB.address,
        priceMon: Math.round((request.bountyMon * 0.6 + Math.random() * 0.01) * 1000) / 1000,
        etaSeconds: 400 + Math.floor(Math.random() * 60),
        completedTasks: _reputation[AGENTS.volunteerB.address] ?? 0,
        score: 0,
        txHash: fakeTxHash(),
    };
    bidB.score = bidB.priceMon / (1 + bidB.completedTasks);
    request.bids.push(bidB);
    emit({
        txHash: bidB.txHash,
        blockNumber: _blockNumber,
        eventName: "BidSubmitted",
        actionLabel: "submitBid",
        actor: bidB.agentAddress,
        requestId: String(id),
        explorerUrl: `#tx-${_blockNumber}`,
        details: `Price: ${bidB.priceMon} MON · ETA: ${bidB.etaSeconds}s · Stake: 0.01 MON`,
    });

    // 5. Wait for auction deadline (give humans time to bid via MetaMask)
    await delay(15000);

    // Close auction — lowest score wins
    const sorted = [...request.bids].sort((a, b) => a.score - b.score);
    const winner = sorted[0];
    request.winner = winner;
    request.state = "awarded";
    emit({
        txHash: fakeTxHash(),
        blockNumber: _blockNumber,
        eventName: "AuctionClosed",
        actionLabel: "closeAuction",
        actor: AGENTS.resident.address,
        requestId: String(id),
        explorerUrl: `#tx-${_blockNumber}`,
        details: `Winner: ${winner.agentLabel} · Price: ${winner.priceMon} MON · Losing stake refunded`,
    });

    // 6. Winner submits proof (2s)
    await delay(2000);
    request.proofUri = `ipfs://bafymockproof${id}/delivery.jpg`;
    emit({
        txHash: fakeTxHash(),
        blockNumber: _blockNumber,
        eventName: "ProofSubmitted",
        actionLabel: "submitProof",
        actor: winner.agentAddress,
        requestId: String(id),
        explorerUrl: `#tx-${_blockNumber}`,
        details: "Photo proof uploaded: delivery confirmed at location",
    });

    // 7. Verifier attests (2s — simulates Nugen vision call)
    await delay(2000);
    request.verdict = "accepted";
    request.state = "fulfilled";
    _reputation[winner.agentAddress] = (_reputation[winner.agentAddress] ?? 0) + 1;
    const stakeAmount = 0.01;
    const payout = winner.priceMon + stakeAmount;
    _earnings[winner.agentAddress] = (_earnings[winner.agentAddress] ?? 0) + payout;
    emit({
        txHash: fakeTxHash(),
        blockNumber: _blockNumber,
        eventName: "AttestationAccepted",
        actionLabel: "attestation ✓",
        actor: AGENTS.verifier.address,
        requestId: String(id),
        explorerUrl: `#tx-${_blockNumber}`,
        details: `Verdict: ACCEPTED (Nugen vision) · ${winner.agentLabel} earned ${payout.toFixed(4)} MON (price ${winner.priceMon} + stake ${stakeAmount}) · Surplus ${(request.bountyMon - winner.priceMon).toFixed(4)} MON refunded`,
    });

    // 8. ERC-8004 reputation write (0.5s)
    await delay(500);
    emit({
        txHash: fakeTxHash(),
        blockNumber: _blockNumber,
        eventName: "ReputationUpdated",
        actionLabel: "reputation +1",
        actor: winner.agentAddress,
        requestId: String(id),
        explorerUrl: `#tx-${_blockNumber}`,
        details: `${winner.agentLabel} now has ${_reputation[winner.agentAddress]} completed tasks`,
    });
}

function delay(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
}


/**
 * Inject a human-submitted bid into an open simulation request.
 * Called from /api/volunteer/bid-sim when a registered volunteer places a bid via the dashboard.
 */
export function addHumanBid(input: {
    requestId: number;
    priceMon: number;
    etaSeconds: number;
    walletAddress: string;
    displayName: string;
}): { ok: true; bid: SimBid } | { ok: false; error: string } {
    const r = _requests.find((x) => x.id === input.requestId);
    if (!r) return { ok: false, error: "Request not found" };
    if (r.state !== "open") return { ok: false, error: "Auction is closed" };
    if (input.priceMon > r.bountyMon) return { ok: false, error: "Price exceeds bounty" };
    if (input.priceMon <= 0) return { ok: false, error: "Price must be positive" };
    // Prevent duplicate bids from the same wallet on the same request
    if (r.bids.some((b) => b.agentAddress.toLowerCase() === input.walletAddress.toLowerCase())) {
        return { ok: false, error: "You've already bid on this request" };
    }

    const completedTasks = _reputation[input.walletAddress.toLowerCase()] ?? 0;
    const bid: SimBid = {
        agentLabel: `🧑 ${input.displayName}`,
        agentAddress: input.walletAddress.toLowerCase(),
        priceMon: input.priceMon,
        etaSeconds: input.etaSeconds,
        completedTasks,
        score: input.priceMon / (1 + completedTasks),
        txHash: fakeTxHash(),
    };
    r.bids.push(bid);

    emit({
        txHash: bid.txHash,
        blockNumber: _blockNumber,
        eventName: "BidSubmitted",
        actionLabel: "submitBid (human)",
        actor: bid.agentAddress,
        requestId: String(r.id),
        explorerUrl: `#tx-${_blockNumber}`,
        details: `${input.displayName} bid ${input.priceMon} MON · ETA ${input.etaSeconds}s · stake 0.01 MON`,
    });

    return { ok: true, bid };
}
