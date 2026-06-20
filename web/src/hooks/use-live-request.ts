"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Live request hook. Subscribes to the same `/api/stream` SSE endpoint the
 * Tx Stream uses, and reconstructs the latest request's state purely from
 * the events. This sidesteps the Vercel serverless gotcha where the in-
 * memory `_requests` array on `lib/sim/engine.ts` doesn't survive across
 * lambda invocations — every UI panel can now derive its state from the
 * one source that does work (the long-lived SSE connection).
 */

export type LiveState = "idle" | "open" | "awarded" | "fulfilled" | "disputed" | "failed";

export interface LiveBid {
    txHash: string;
    agentLabel: string;
    agentAddress: string;
    priceMon: number;
    etaSeconds: number;
    completedTasks: number;
    score: number;
}

export interface LiveRequest {
    id: number;
    category?: string;
    description?: string;
    location?: string;
    bountyMon: number;
    requesterAddress?: string;
    ipfsUri?: string;
    state: LiveState;
    deadline: number;
    bids: LiveBid[];
    winner?: LiveBid | null;
    verdict?: "accepted" | "rejected";
    createdAt: number;
}

interface StreamEvent {
    txHash: string;
    blockNumber: number;
    eventName: string;
    actionLabel: string;
    actor?: string;
    requestId?: string;
    explorerUrl: string;
    observedAt: number;
    details?: string;
    payload?: {
        bountyMon?: number;
        category?: string;
        location?: string;
        description?: string;
        deadline?: number;
        ipfsUri?: string;
        requesterAddress?: string;
        agentLabel?: string;
        agentAddress?: string;
        priceMon?: number;
        etaSeconds?: number;
        completedTasks?: number;
        score?: number;
        winnerAddress?: string;
        winnerLabel?: string;
        winningPriceMon?: number;
        verdict?: "accepted" | "rejected";
    };
}

export function useLiveRequest(): LiveRequest | null {
    const [request, setRequest] = useState<LiveRequest | null>(null);
    const seenTxs = useRef(new Set<string>());

    useEffect(() => {
        const es = new EventSource("/api/stream");

        es.onmessage = (msg) => {
            try {
                const e = JSON.parse(msg.data) as StreamEvent;
                if (seenTxs.current.has(e.txHash)) return;
                seenTxs.current.add(e.txHash);
                setRequest((prev) => reduce(prev, e));
            } catch {
                /* ignore malformed messages */
            }
        };

        return () => es.close();
    }, []);

    return request;
}

function reduce(prev: LiveRequest | null, e: StreamEvent): LiveRequest | null {
    const reqId = Number(e.requestId);
    if (!Number.isFinite(reqId)) return prev;

    switch (e.eventName) {
        case "RequestPosted": {
            const p = e.payload ?? {};
            return {
                id: reqId,
                category: p.category,
                description: p.description,
                location: p.location,
                bountyMon: p.bountyMon ?? 0,
                requesterAddress: p.requesterAddress,
                ipfsUri: p.ipfsUri,
                state: "open",
                deadline: p.deadline ?? 0,
                bids: [],
                createdAt: e.observedAt,
            };
        }
        case "BidSubmitted": {
            // Only attach bids to the most recent request we've seen.
            if (!prev || prev.id !== reqId) return prev;
            const p = e.payload ?? {};
            // Skip if no structured payload (older event format).
            if (typeof p.priceMon !== "number") return prev;
            // De-dupe by txHash defensively (the seenTxs ref handles most cases).
            if (prev.bids.some((b) => b.txHash === e.txHash)) return prev;
            const bid: LiveBid = {
                txHash: e.txHash,
                agentLabel: p.agentLabel ?? e.actor ?? "Volunteer",
                agentAddress: p.agentAddress ?? e.actor ?? "0x",
                priceMon: p.priceMon,
                etaSeconds: p.etaSeconds ?? 0,
                completedTasks: p.completedTasks ?? 0,
                score: p.score ?? p.priceMon,
            };
            return { ...prev, bids: [...prev.bids, bid] };
        }
        case "AuctionClosed": {
            if (!prev || prev.id !== reqId) return prev;
            const p = e.payload ?? {};
            const winnerAddress = p.winnerAddress?.toLowerCase();
            const winner =
                prev.bids.find((b) => b.agentAddress.toLowerCase() === winnerAddress) ?? null;
            return {
                ...prev,
                state: "awarded",
                winner: winner ?? prev.bids[0] ?? null,
            };
        }
        case "AuctionFailed": {
            if (!prev || prev.id !== reqId) return prev;
            return { ...prev, state: "failed" };
        }
        case "AttestationAccepted": {
            if (!prev || prev.id !== reqId) return prev;
            return { ...prev, state: "fulfilled", verdict: "accepted" };
        }
        case "AttestationRejected": {
            if (!prev || prev.id !== reqId) return prev;
            return { ...prev, state: "disputed", verdict: "rejected" };
        }
        default:
            return prev;
    }
}
