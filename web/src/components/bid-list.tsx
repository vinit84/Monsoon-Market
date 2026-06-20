"use client";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { shortAddr, formatMon } from "@/lib/utils";

interface BidRow {
    bidder: `0x${string}`;
    bidderLabel?: string;
    priceMonWei: bigint;
    etaSeconds: number;
    completedTasks: number;
}

export function BidList({ bids, winnerAddress }: { bids: BidRow[]; winnerAddress?: `0x${string}` | null }) {
    return (
        <Card>
            <CardHeader title="Live Bids" description="Lower reputation-weighted score wins" />
            <table className="mm-table">
                <thead>
                    <tr>
                        <th>Volunteer</th>
                        <th>Price</th>
                        <th>ETA</th>
                        <th>Reputation</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {bids.length === 0 ? (
                        <tr>
                            <td colSpan={5} className="text-[color:var(--color-text-secondary)]">
                                No bids yet. Volunteers respond in &lt; 5 s.
                            </td>
                        </tr>
                    ) : (
                        bids.map((b) => {
                            const winning = winnerAddress?.toLowerCase() === b.bidder.toLowerCase();
                            return (
                                <tr key={b.bidder}>
                                    <td>
                                        <div>{b.bidderLabel ?? shortAddr(b.bidder)}</div>
                                        <div className="text-[12px] font-mono text-[color:var(--color-text-secondary)]">
                                            {shortAddr(b.bidder)}
                                        </div>
                                    </td>
                                    <td className="font-mono">{formatMon(b.priceMonWei)} MON</td>
                                    <td>{b.etaSeconds}s</td>
                                    <td>{b.completedTasks}</td>
                                    <td>{winning ? <Badge variant="success">WINNER</Badge> : <Badge variant="info">bidding</Badge>}</td>
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>
        </Card>
    );
}
