"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { shortAddr } from "@/lib/utils";
import { subscribeClient, type ClientStreamEvent } from "@/lib/sim/client-stream";

export function TxStream() {
    const [events, setEvents] = useState<ClientStreamEvent[]>([]);
    const [count, setCount] = useState(0);
    const seen = useRef(new Set<string>());

    useEffect(() => {
        // Source of truth is the in-tab client event bus. The compose page
        // pushes both the real on-chain RequestPosted (with its real tx hash
        // + Monadscan url) and the simulated agent tail into this same bus.
        const unsub = subscribeClient((e) => {
            if (!seen.current.has(e.txHash)) {
                seen.current.add(e.txHash);
                setCount((c) => c + 1);
            }
            setEvents((prev) => [e, ...prev].slice(0, 80));
        });
        return unsub;
    }, []);

    return (
        <Card>
            <CardHeader
                title="Transaction Stream"
                description="Live agent actions · receipt feed"
                action={<Badge variant="brass">{count} TX</Badge>}
            />
            <div className="max-h-[600px] overflow-auto space-y-2 pr-1">
                {events.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-[40px] mb-3 opacity-30">📜</div>
                        <p className="text-[13px] text-[color:var(--color-ink-muted)] italic">
                            Awaiting first event… post a request to start.
                        </p>
                    </div>
                ) : (
                    events.map((e, i) => {
                        const hasExplorer = e.explorerUrl && e.explorerUrl !== "#";
                        return (
                            <div key={`${e.txHash}-${i}`} className="sk-tx-row">
                                <div className="flex items-center gap-2 mb-1.5">
                                    <Badge variant={badgeForEvent(e.eventName)}>{e.actionLabel}</Badge>
                                    <span className="text-[10px] text-[color:var(--color-ink-faded)] font-mono uppercase tracking-wider">
                                        #{e.requestId} · blk {e.blockNumber}
                                    </span>
                                </div>
                                {e.details && (
                                    <p className="text-[12px] text-[color:var(--color-ink-muted)] mb-1.5 leading-snug">
                                        {e.details}
                                    </p>
                                )}
                                <div className="flex items-center gap-3 text-[11px]">
                                    <span className="text-[color:var(--color-ink-faded)] font-mono">
                                        {e.actor ? shortAddr(e.actor) : "—"}
                                    </span>
                                    {hasExplorer ? (
                                        <a
                                            href={e.explorerUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="font-mono text-[color:var(--color-brand-deep)] underline"
                                        >
                                            {shortAddr(e.txHash, 10, 6)}
                                        </a>
                                    ) : (
                                        <span className="font-mono text-[color:var(--color-brand-deep)]">
                                            {shortAddr(e.txHash, 10, 6)}
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </Card>
    );
}

function badgeForEvent(name: string): "success" | "warning" | "critical" | "info" | "brass" {
    switch (name) {
        case "AttestationAccepted":
        case "ReputationUpdated":
        case "AuctionClosed":
        case "ProofSubmitted":
            return "success";
        case "AuctionFailed":
        case "AttestationRejected":
            return "critical";
        case "BidSubmitted":
            return "warning";
        case "SupplyQuote":
        case "RouteQuote":
            return "brass";
        case "RequestPosted":
        default:
            return "info";
    }
}
