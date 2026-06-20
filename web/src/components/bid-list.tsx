"use client";

import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { shortAddr } from "@/lib/utils";
import type { SimBid } from "@/hooks/use-sim-state";

interface Props {
    bids: SimBid[];
    winnerAddress?: string | null;
    /** Auction is decided once state has progressed past 'open'. */
    auctionDecided?: boolean;
}

export function BidList({ bids, winnerAddress, auctionDecided = false }: Props) {
    return (
        <Card>
            <CardHeader title="Live Bids" description="Lower reputation-weighted score wins" />
            <div className="overflow-x-auto">
                <table className="sk-table">
                    <thead>
                        <tr>
                            <th>Volunteer</th>
                            <th>Price (MON)</th>
                            <th>ETA</th>
                            <th>Reputation</th>
                            <th>Score</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {bids.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="text-center text-[color:var(--color-ink-muted)] italic py-8">
                                    No bids yet — agents respond within 5 seconds of a request being posted.
                                </td>
                            </tr>
                        ) : (
                            bids.map((b) => {
                                const winning = winnerAddress?.toLowerCase() === b.agentAddress.toLowerCase();
                                return (
                                    <tr key={b.txHash}>
                                        <td>
                                            <div className="font-semibold">{b.agentLabel}</div>
                                            <div className="font-mono text-[11px] text-[color:var(--color-ink-muted)]">
                                                {shortAddr(b.agentAddress)}
                                            </div>
                                        </td>
                                        <td className="font-mono">{b.priceMon.toFixed(4)}</td>
                                        <td>{b.etaSeconds}s</td>
                                        <td>
                                            <span className="inline-flex items-center gap-1.5">
                                                <span className="sk-led sk-led-green" style={{ width: 6, height: 6 }} />
                                                {b.completedTasks}
                                            </span>
                                        </td>
                                        <td className="font-mono text-[11px] text-[color:var(--color-ink-muted)]">
                                            {b.score.toFixed(6)}
                                        </td>
                                        <td>
                                            {auctionDecided ? (
                                                winning ? (
                                                    <Badge variant="success">★ WINNER</Badge>
                                                ) : (
                                                    <Badge variant="critical">LOST · STAKE REFUNDED</Badge>
                                                )
                                            ) : (
                                                <Badge variant="info">bidding</Badge>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </Card>
    );
}
