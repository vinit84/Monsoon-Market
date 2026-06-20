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
}

export function TxStream({ explorerBase = "" }: { explorerBase?: string }) {
    const [events, setEvents] = useState<StreamEvent[]>([]);
    const [degraded, setDegraded] = useState(false);
    const [distinctCount, setDistinctCount] = useState(0);
    const seenTxs = useRef(new Set<string>());

    useEffect(() => {
        const es = new EventSource("/api/stream");
        es.onmessage = (msg) => {
            try {
                const e = JSON.parse(msg.data) as StreamEvent;
                if (!seenTxs.current.has(e.txHash)) {
                    seenTxs.current.add(e.txHash);
                    setDistinctCount(seenTxs.current.size);
                }
                setEvents((prev) => [e, ...prev].slice(0, 50));
            } catch {
                /* ignore */
            }
        };
        es.onerror = () => setDegraded(true);
        return () => es.close();
    }, []);

    void explorerBase;

    return (
        <Card>
            <CardHeader
                title="Transaction Stream"
                description="Live escrow events on Monad testnet"
                action={
                    <Badge variant="info">
                        {distinctCount} tx
                    </Badge>
                }
            />
            {degraded && (
                <div className="mb-3 px-3 py-2 rounded bg-[var(--color-warning-bg)] text-[var(--color-warning-fg)] text-[12px]">
                    Indexer degraded — retrying
                </div>
            )}
            <div className="max-h-[420px] overflow-auto">
                <table className="mm-table">
                    <thead>
                        <tr>
                            <th>Action</th>
                            <th>Actor</th>
                            <th>Hash</th>
                        </tr>
                    </thead>
                    <tbody>
                        {events.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="text-[color:var(--color-text-secondary)]">
                                    Waiting for the first event…
                                </td>
                            </tr>
                        ) : (
                            events.map((e) => (
                                <tr key={e.txHash + e.eventName + e.observedAt}>
                                    <td>
                                        <Badge variant={badgeForEvent(e.eventName)}>{e.actionLabel}</Badge>
                                    </td>
                                    <td className="text-[color:var(--color-text-secondary)]">
                                        {e.actor ? shortAddr(e.actor) : "—"}
                                    </td>
                                    <td>
                                        <a className="font-mono text-[13px]" href={e.explorerUrl} target="_blank" rel="noopener">
                                            {shortAddr(e.txHash, 8, 6)}
                                        </a>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </Card>
    );
}

function badgeForEvent(name: string): "success" | "warning" | "critical" | "info" {
    switch (name) {
        case "AttestationAccepted":
        case "ProofSubmitted":
        case "AuctionClosed":
            return "success";
        case "AuctionFailed":
        case "AttestationRejected":
            return "critical";
        case "BidSubmitted":
            return "warning";
        case "RequestPosted":
        default:
            return "info";
    }
}
