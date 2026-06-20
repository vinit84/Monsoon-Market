"use client";

/**
 * Client-side event bus.
 *
 * Background: on Vercel, server-side module state (the `_requests` and
 * `_events` arrays in `lib/sim/engine.ts`) does not survive across lambda
 * invocations, and a single `/api/stream` SSE consumer can land on any
 * lambda. Two different SSE consumers on the same page can land on two
 * different lambdas, which is why Tx Stream and Live Bids could disagree.
 *
 * This module gives us a single source of truth that lives entirely in the
 * browser tab. The compose page kicks off the simulated agent tail with
 * `kickoffClientFlow(...)`, and any subscriber on any page within the same
 * SPA session gets the events in order.
 */

export interface ClientStreamEvent {
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

type Listener = (e: ClientStreamEvent) => void;

// Module-level state — survives client-side navigation within the SPA.
const _events: ClientStreamEvent[] = [];
const _listeners = new Set<Listener>();

export function getClientEvents(): ClientStreamEvent[] {
    return [..._events];
}

export function emitClient(event: ClientStreamEvent): void {
    _events.push(event);
    _listeners.forEach((l) => {
        try {
            l(event);
        } catch {
            // a misbehaving listener shouldn't kill the bus
        }
    });
}

export function subscribeClient(l: Listener): () => void {
    // Replay buffered events so a late subscriber still sees the full history.
    for (const e of _events) {
        try {
            l(e);
        } catch {
            // ignore
        }
    }
    _listeners.add(l);
    return () => {
        _listeners.delete(l);
    };
}

export function clearClientStream(): void {
    _events.length = 0;
}
