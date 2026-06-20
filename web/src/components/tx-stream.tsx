"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { shortAddr } from "@/lib/utils";

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
}

export function TxStream() {
    const [events, setEvents] = useState<StreamEvent[]>([]);
    const [degraded, setDegraded] = useState(false);
    const [count, setCount] = useState(0);
    const seen = useRef(new Set<string>());

    useEffect(() => {
        const es = new EventSource("/api/stream");
        es.onmessage = (msg) => {
            try {
                const e = JSON.parse(msg.data) as StreamEvent;
                if (!seen.current.has(e.txHash)) {
                    seen.current.add(e.txHash);
                    setCount((c) => c + 1);
                }
                setEvents((prev) => [e, ...prev].slice(0, 80));
            } catch { /* ignore */ }
        };
        es.onerror = () => setDegraded(true);
        return () => es.close();
    }, []);

    return (
        <Card>
            <CardHeader
                title="Transaction Stream"
                description="Live agent actions · receipt feed"
                action={<Badge variant="brass">{count} TX</Badge>}
            />
            {degraded && (
                <div className="mb-3 px-3 py-2 rounded text-[12px] bg-[var(--color-warning-bg)] text-[var(--color-warning)] border border-[#d4a83f]">
                    ⚠ Stream connection lost — retrying
                </div>
            )}
            <div className="max-h-[600px] overflow-auto space-y-2 pr-1">
                {events.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-[40px] mb-3 opacity-30">📜</div>
                        <p className="text-[13px] text-[color:var(--color-ink-muted)] italic">
                            Awaiting first event… post a request to start.
                        </p>
                    </div>
                ) : (
                    events.map((e, i) => (
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
                                <span className="font-mono text-[color:var(--color-brand-deep)]">
                                    {shortAddr(e.txHash, 10, 6)}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </Card>
    );
}

function badgeForEvent(name: string): "success" | "warning" | "critical" | "info" | "brass" {
    switch (name) {
        case "AttestationAccepted": case "ReputationUpdated":
        case "AuctionClosed": case "ProofSubmitted": return "success";
        case "AuctionFailed": case "AttestationRejected": return "critical";
        case "BidSubmitted": return "warning";
        case "SupplyQuote": case "RouteQuote": return "brass";
        case "RequestPosted": default: return "info";
    }
}
