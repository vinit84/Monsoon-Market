import { decodeEventLog, parseEther, type Hex } from "viem";
import { walletFor } from "./wallets";
import { writeEscrow, ESCROW_CONSTANTS } from "./escrow-client";
import { getPublicClient, explorerTxUrl } from "./chain";
import { monsoonMandiEscrowAbi } from "./escrow-abi";
import { getServerEnv } from "@/config/env";
import { pinJson } from "@/lib/ipfs/pin";
import { verifyProof } from "@/lib/llm/vision-verifier";
import { ipfsToHttps } from "@/lib/ipfs/pin";
import { emitEvent, registerExternalRequest, type SimRequest } from "@/lib/sim/engine";
import { VOLUNTEER_PERSONAS } from "@/lib/agents/personas";

/**
 * On-chain orchestrator. Posts a request to the deployed Monsoon Mandi escrow
 * on Monad testnet, then drives the entire agent economy flow end-to-end with
 * real transactions. Each step emits an event into the shared sim event stream
 * so the existing SSE pipeline + UI keep working unchanged — but the txHash
 * and explorer URL are real.
 *
 * Requires these env vars to be set:
 *   ESCROW_ADDRESS
 *   MONAD_TESTNET_RPC_URL, MONAD_TESTNET_CHAIN_ID
 *   RESIDENT_RELAYER_PK, VOLUNTEER_A_PK, VOLUNTEER_B_PK, VERIFIER_PK
 */

const STAKE_WEI = ESCROW_CONSTANTS.STAKE_AMOUNT_WEI;
const AUCTION_DURATION_SEC = Number(ESCROW_CONSTANTS.AUCTION_DURATION_SEC);

const AGENT_LABELS = {
    resident: "Resident Relayer",
    supply: "Supply Agent",
    route: "Route Agent",
    verifier: "Verifier Agent",
} as const;

export interface PostRequestInput {
    category: string;
    description: string;
    location: string;
    bountyMon: number;
    requesterAddress: `0x${string}`;
}

export interface PostRequestResult {
    requestId: number;
    txHash: Hex;
    ipfsUri: string;
    explorerUrl: string;
    deadline: number; // ms timestamp
}

/**
 * Phase 1: post the request on-chain and return immediately so the API can
 * respond fast with a real tx hash + requestId. The rest of the flow runs in
 * `runOrchestrationAfterPost`.
 */
export async function postRequestOnChain(input: PostRequestInput): Promise<PostRequestResult> {
    const env = getServerEnv();
    if (!env.ESCROW_ADDRESS) {
        throw new Error("ESCROW_ADDRESS is not set; cannot post on-chain");
    }

    // 1. Pin the request payload to IPFS (or get a deterministic mock URI).
    const ipfsUri = await pinJson(
        {
            category: input.category,
            description: input.description,
            location: input.location,
            bountyMon: input.bountyMon,
            requesterAddress: input.requesterAddress,
            createdAt: Date.now(),
        },
        `monsoon-request-${Date.now()}.json`,
    );

    // 2. Post on-chain via the resident-relayer wallet.
    const wallet = walletFor("resident-relayer");
    const escrow = writeEscrow(wallet);
    const bountyWei = parseEther(input.bountyMon.toString());

    const txHash = await escrow.write.postRequest([ipfsUri], {
        value: bountyWei,
        chain: wallet.chain,
        account: wallet.account!,
    });

    // 3. Wait for the receipt to extract requestId from RequestPosted event.
    const client = getPublicClient();
    const receipt = await client.waitForTransactionReceipt({ hash: txHash });

    let requestId: bigint | null = null;
    let deadline: bigint = 0n;
    for (const log of receipt.logs) {
        try {
            const decoded = decodeEventLog({
                abi: monsoonMandiEscrowAbi,
                data: log.data,
                topics: log.topics,
            });
            if (decoded.eventName === "RequestPosted") {
                const args = decoded.args as unknown as { requestId: bigint; deadline: bigint };
                requestId = args.requestId;
                deadline = args.deadline;
                break;
            }
        } catch {
            // skip non-matching logs
        }
    }
    if (requestId === null) {
        throw new Error("postRequest tx mined but no RequestPosted log found");
    }

    const explorerUrl = explorerTxUrl(txHash);
    const reqIdNum = Number(requestId);

    // Register the request in the sim store so the UI can find it.
    const simReq: SimRequest = {
        id: reqIdNum,
        category: input.category,
        description: input.description,
        location: input.location,
        bountyMon: input.bountyMon,
        requesterAddress: input.requesterAddress,
        ipfsUri,
        state: "open",
        deadline: Number(deadline) * 1000,
        bids: [],
        createdAt: Date.now(),
    };
    registerExternalRequest(simReq);

    emitEvent({
        txHash,
        blockNumber: Number(receipt.blockNumber),
        eventName: "RequestPosted",
        actionLabel: "postRequest",
        actor: wallet.account!.address,
        requestId: String(reqIdNum),
        explorerUrl,
        details: `Bounty ${input.bountyMon} MON · ${input.location} · IPFS ${ipfsUri.slice(0, 24)}…`,
    });

    return {
        requestId: reqIdNum,
        txHash,
        ipfsUri,
        explorerUrl,
        deadline: Number(deadline) * 1000,
    };
}

/**
 * Phase 2: run the rest of the agent flow on-chain. Designed to be invoked
 * via Next 16 `after()` so the API response returns immediately.
 *
 * Sequential steps:
 *   1. Both volunteer agents submit bids.
 *   2. Wait until on-chain auction deadline.
 *   3. Close the auction (real tx).
 *   4. Winner submits proof (mock IPFS image URI).
 *   5. Verifier runs the vision check and submits attestation.
 */
export async function runOrchestrationAfterPost(input: {
    requestId: number;
    bountyMon: number;
    deadlineMs: number;
}): Promise<void> {
    try {
        await submitVolunteerBids(input.requestId, input.bountyMon);
        await waitUntilDeadline(input.deadlineMs);
        const winner = await closeAuction(input.requestId);
        await submitProofForWinner(input.requestId, winner);
        await runVerification(input.requestId, winner);
    } catch (err) {
        console.error("[orchestrator] flow failed", err);
        emitEvent({
            txHash: ("0x" + "0".repeat(64)) as Hex,
            blockNumber: 0,
            eventName: "OrchestrationFailed",
            actionLabel: "error",
            actor: "0x0000000000000000000000000000000000000000",
            requestId: String(input.requestId),
            explorerUrl: "",
            details: err instanceof Error ? err.message : String(err),
        });
    }
}

async function submitVolunteerBids(requestId: number, bountyMon: number): Promise<void> {
    for (const persona of VOLUNTEER_PERSONAS) {
        try {
            // Persona-flavored pricing. Lower price wins (with reputation tiebreaker).
            const baseCost = bountyMon * 0.7; // ~70% of bounty as baseline
            const bidPriceMon = Number((baseCost * persona.pricingMarkup).toFixed(4));
            const bidEtaSec = Math.round(360 * persona.etaMultiplier);

            if (bidPriceMon > bountyMon) continue;

            const wallet = walletFor(persona.label);
            const escrow = writeEscrow(wallet);
            const priceWei = parseEther(bidPriceMon.toString());

            const txHash = await escrow.write.submitBid(
                [BigInt(requestId), priceWei, BigInt(bidEtaSec)],
                {
                    value: STAKE_WEI,
                    chain: wallet.chain,
                    account: wallet.account!,
                },
            );

            emitEvent({
                txHash,
                blockNumber: 0,
                eventName: "BidSubmitted",
                actionLabel: "submitBid",
                actor: wallet.account!.address,
                requestId: String(requestId),
                explorerUrl: explorerTxUrl(txHash),
                details: `${persona.displayName} · ${bidPriceMon} MON · ETA ${bidEtaSec}s · stake 0.01 MON`,
            });
        } catch (err) {
            console.warn(`[orchestrator] ${persona.label} bid failed`, err);
        }
    }
}

async function waitUntilDeadline(deadlineMs: number): Promise<void> {
    const buffer = 1500; // 1.5s past on-chain deadline so block timestamp catches up
    const wait = Math.max(0, deadlineMs - Date.now() + buffer);
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
}

interface WinnerInfo {
    address: `0x${string}`;
    priceMon: number;
}

async function closeAuction(requestId: number): Promise<WinnerInfo> {
    const wallet = walletFor("resident-relayer");
    const escrow = writeEscrow(wallet);

    const txHash = await escrow.write.closeAuction([BigInt(requestId)], {
        chain: wallet.chain,
        account: wallet.account!,
    });
    const client = getPublicClient();
    const receipt = await client.waitForTransactionReceipt({ hash: txHash });

    let winnerAddr: `0x${string}` = "0x0000000000000000000000000000000000000000";
    let winningPriceWei = 0n;

    for (const log of receipt.logs) {
        try {
            const decoded = decodeEventLog({
                abi: monsoonMandiEscrowAbi,
                data: log.data,
                topics: log.topics,
            });
            if (decoded.eventName === "AuctionClosed") {
                const args = decoded.args as unknown as {
                    winner: `0x${string}`;
                    winningPrice: bigint;
                };
                winnerAddr = args.winner;
                winningPriceWei = args.winningPrice;
                break;
            }
            if (decoded.eventName === "AuctionFailed") {
                emitEvent({
                    txHash,
                    blockNumber: Number(receipt.blockNumber),
                    eventName: "AuctionFailed",
                    actionLabel: "auctionFailed",
                    actor: wallet.account!.address,
                    requestId: String(requestId),
                    explorerUrl: explorerTxUrl(txHash),
                    details: "No bids — bounty refunded to resident",
                });
                throw new Error("Auction failed: no bids");
            }
        } catch {
            // skip non-matching logs
        }
    }

    const winningPriceMon = Number(winningPriceWei) / 1e18;
    emitEvent({
        txHash,
        blockNumber: Number(receipt.blockNumber),
        eventName: "AuctionClosed",
        actionLabel: "closeAuction",
        actor: wallet.account!.address,
        requestId: String(requestId),
        explorerUrl: explorerTxUrl(txHash),
        details: `Winner ${winnerAddr.slice(0, 10)}… · ${winningPriceMon} MON · losing stakes refunded`,
    });

    return { address: winnerAddr, priceMon: winningPriceMon };
}

async function submitProofForWinner(requestId: number, winner: WinnerInfo): Promise<void> {
    // Map the winner address back to a configured volunteer label.
    const personaLabel = matchPersonaToAddress(winner.address);
    if (!personaLabel) {
        console.warn(`[orchestrator] winner ${winner.address} is not a known persona; skipping proof`);
        return;
    }

    // Mock proof image URI — IPFS pin is best-effort; deterministic fallback otherwise.
    const proofIpfsUri = await pinJson(
        { type: "delivery-proof", requestId, winner: winner.address, ts: Date.now() },
        `monsoon-proof-${requestId}.json`,
    );

    const wallet = walletFor(personaLabel);
    const escrow = writeEscrow(wallet);
    const txHash = await escrow.write.submitProof([BigInt(requestId), proofIpfsUri], {
        chain: wallet.chain,
        account: wallet.account!,
    });

    emitEvent({
        txHash,
        blockNumber: 0,
        eventName: "ProofSubmitted",
        actionLabel: "submitProof",
        actor: wallet.account!.address,
        requestId: String(requestId),
        explorerUrl: explorerTxUrl(txHash),
        details: `Proof IPFS ${proofIpfsUri.slice(0, 24)}…`,
    });
}

async function runVerification(requestId: number, winner: WinnerInfo): Promise<void> {
    // Read proofIpfsUri off-chain — use deterministic fallback if Nugen unreachable.
    const wallet = walletFor("verifier");

    const verdict = await verifyProof({
        proofImageUrl: ipfsToHttps(`ipfs://bafymockproof${requestId}/delivery.jpg`),
        requestSummary: `Monsoon Market delivery proof for request #${requestId}`,
    });

    const escrow = writeEscrow(wallet);
    const accepted = verdict.verdict === "accepted";
    const txHash = await escrow.write.submitAttestation([BigInt(requestId), accepted], {
        chain: wallet.chain,
        account: wallet.account!,
    });

    emitEvent({
        txHash,
        blockNumber: 0,
        eventName: accepted ? "AttestationAccepted" : "AttestationRejected",
        actionLabel: accepted ? "attestation ✓" : "attestation ✗",
        actor: wallet.account!.address,
        requestId: String(requestId),
        explorerUrl: explorerTxUrl(txHash),
        details: `${accepted ? "ACCEPTED" : "REJECTED"} (${verdict.source}) · winner ${winner.priceMon} MON + stake released`,
    });
}

function matchPersonaToAddress(address: string): "volunteer-a" | "volunteer-b" | null {
    const target = address.toLowerCase();
    for (const persona of VOLUNTEER_PERSONAS) {
        try {
            const wallet = walletFor(persona.label);
            if (wallet.account?.address.toLowerCase() === target) return persona.label;
        } catch {
            // not configured
        }
    }
    return null;
}

// Re-export so the route handler can name-check this module easily.
export { AGENT_LABELS };
