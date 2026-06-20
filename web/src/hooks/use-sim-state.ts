"use client";

import { useEffect, useState } from "react";

export interface SimBid {
    agentLabel: string;
    agentAddress: string;
    priceMon: number;
    etaSeconds: number;
    completedTasks: number;
    score: number;
    txHash: string;
}

export interface SimRequest {
    id: number;
    category: string;
    description: string;
    location: string;
    bountyMon: number;
    requesterAddress: string;
    ipfsUri: string;
    state: "idle" | "open" | "awarded" | "fulfilled" | "disputed" | "failed";
    deadline: number;
    bids: SimBid[];
    winner?: SimBid;
    proofUri?: string;
    verdict?: "accepted" | "rejected";
    createdAt: number;
}

export interface SimState {
    requests: SimRequest[];
    reputation: Record<string, number>;
    earnings: Record<string, number>;
}

/** Polls /api/sim/state every 1s for live UI updates. */
export function useSimState(): SimState {
    const [state, setState] = useState<SimState>({ requests: [], reputation: {}, earnings: {} });

    useEffect(() => {
        let cancelled = false;
        async function tick() {
            try {
                const res = await fetch("/api/sim/state", { cache: "no-store" });
                if (!res.ok) return;
                const data = (await res.json()) as SimState;
                if (!cancelled) setState(data);
            } catch {
                /* ignore transient errors */
            }
        }
        tick();
        const interval = setInterval(tick, 1000);
        return () => {
            cancelled = true;
            clearInterval(interval);
        };
    }, []);

    return state;
}

/** Returns the most recent request, or null if none exists. */
export function latestRequest(state: SimState): SimRequest | null {
    if (state.requests.length === 0) return null;
    return [...state.requests].sort((a, b) => b.createdAt - a.createdAt)[0];
}
