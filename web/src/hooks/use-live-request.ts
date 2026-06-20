"use client";

import { useEffect, useState } from "react";
import { subscribeClient, type ClientStreamEvent } from "@/lib/sim/client-stream";

/**
 * Live request hook.
 *
 * Subscribes to the in-tab client event bus and reduces events into the
 * latest request's state. The compose page seeds the bus with the real
 * on-chain RequestPosted event and the simulated agent tail; every UI
 * panel that uses this hook stays in sync without touching the server.
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

export function useLiveRequest(): LiveRequest | null {
    const [request, setRequest] = useState<LiveRequest | null>(null);

    useEffect(() => {
        const unsub = subscribeClient((e) => {
            setRequest((prev) => reduce(prev, e));
        });
        return unsub;
    }, []);

    return request;
}

function reduce(prev: LiveRequest | null, e: ClientStreamEvent): LiveRequest | null {
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
            if (!prev || prev.id !== reqId) return prev;
            const p = e.payload ?? {};
            if (typeof p.priceMon !== "number") return prev;
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
