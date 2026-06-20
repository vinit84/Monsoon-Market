import { type Hex, getContract, type WalletClient } from "viem";
import { getPublicClient } from "./chain";
import { monsoonMandiEscrowAbi } from "./escrow-abi";
import { getServerEnv } from "@/config/env";

export type RequestState = "None" | "Open" | "Awarded" | "Fulfilled" | "Disputed" | "Failed";
const STATE_NAMES: RequestState[] = ["None", "Open", "Awarded", "Fulfilled", "Disputed", "Failed"];

export interface EscrowRequest {
    requestId: bigint;
    resident: `0x${string}`;
    bountyAmount: bigint;
    deadline: bigint;
    state: RequestState;
    winner: `0x${string}`;
    winningPrice: bigint;
    winningStake: bigint;
    ipfsUri: string;
    proofIpfsUri: string;
}

export interface EscrowBid {
    bidder: `0x${string}`;
    priceMon: bigint;
    etaSeconds: bigint;
    stake: bigint;
}

function escrowAddress(): `0x${string}` {
    const env = getServerEnv();
    if (!env.ESCROW_ADDRESS) throw new Error("ESCROW_ADDRESS is not set in environment");
    return env.ESCROW_ADDRESS as `0x${string}`;
}

/** Read-only contract handle (uses public client). */
export function readEscrow() {
    return getContract({
        address: escrowAddress(),
        abi: monsoonMandiEscrowAbi,
        client: { public: getPublicClient() },
    });
}

/** Write-enabled contract handle for the given wallet. */
export function writeEscrow(wallet: WalletClient) {
    return getContract({
        address: escrowAddress(),
        abi: monsoonMandiEscrowAbi,
        client: { public: getPublicClient(), wallet },
    });
}

/** Convert a tuple-returning getter shape to the friendlier EscrowRequest. */
export function decodeRequest(requestId: bigint, raw: readonly unknown[]): EscrowRequest {
    const [
        resident,
        bountyAmount,
        deadline,
        stateNum,
        winner,
        winningPrice,
        winningStake,
        ipfsUri,
        proofIpfsUri,
    ] = raw as readonly [
        `0x${string}`,
        bigint,
        bigint,
        number,
        `0x${string}`,
        bigint,
        bigint,
        string,
        string,
    ];
    return {
        requestId,
        resident,
        bountyAmount,
        deadline,
        state: STATE_NAMES[Number(stateNum)] ?? "None",
        winner,
        winningPrice,
        winningStake,
        ipfsUri,
        proofIpfsUri,
    };
}

export function decodeBid(raw: readonly unknown[]): EscrowBid {
    const [bidder, priceMon, etaSeconds, stake] = raw as readonly [
        `0x${string}`,
        bigint,
        bigint,
        bigint,
    ];
    return { bidder, priceMon, etaSeconds, stake };
}

/** Helper for the deterministic event-name → human-friendly action label mapping. */
export const ESCROW_EVENT_LABELS: Record<string, string> = {
    RequestPosted: "postRequest",
    BidSubmitted: "submitBid",
    AuctionClosed: "closeAuction",
    AuctionFailed: "auctionFailed",
    ProofSubmitted: "submitProof",
    AttestationAccepted: "attestationAccepted",
    AttestationRejected: "attestationRejected",
};

/** Helpful constants mirrored from the contract (kept in sync manually). */
export const ESCROW_CONSTANTS = {
    AUCTION_DURATION_SEC: 10n,
    STAKE_AMOUNT_WEI: 10n ** 16n, // 0.01 MON
    MIN_BOUNTY_WEI: 10n ** 16n, // 0.01 MON
} as const;

/** Build a tx-stream entry shape from a decoded log. */
export interface TxStreamEntry {
    txHash: Hex;
    blockNumber: bigint;
    timestamp: number;
    eventName: keyof typeof ESCROW_EVENT_LABELS | "Other";
    actionLabel: string;
    requestId?: bigint;
    actor?: `0x${string}`;
}
