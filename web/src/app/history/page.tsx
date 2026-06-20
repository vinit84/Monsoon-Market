"use client";

import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSimState } from "@/hooks/use-sim-state";

const STATE_VARIANT: Record<string, "info" | "warning" | "success" | "critical" | "brass"> = {
    open: "warning",
    awarded: "brass",
    fulfilled: "success",
    disputed: "critical",
    failed: "critical",
};

function formatTime(ts: number): string {
    return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export default function HistoryPage() {
    const { requests } = useSimState();
    const sorted = [...requests].sort((a, b) => b.createdAt - a.createdAt);

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader
                    title="Request History"
                    description="All requests posted to the marketplace"
                    action={<Badge variant="brass">{sorted.length} TOTAL</Badge>}
                />
                {sorted.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-[40px] mb-3 opacity-30">📋</div>
                        <p className="text-[13px] text-[color:var(--color-ink-muted)] italic">
                            No requests yet. Post one from the New Request page.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="sk-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Time</th>
                                    <th>Category</th>
                                    <th>Description</th>
                                    <th>Location</th>
                                    <th>Bounty</th>
                                    <th>Bids</th>
                                    <th>Winner</th>
                                    <th>State</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sorted.map((r) => (
                                    <tr key={r.id}>
                                        <td className="font-mono">#{r.id}</td>
                                        <td className="font-mono text-[11px] text-[color:var(--color-ink-muted)]">
                                            {formatTime(r.createdAt)}
                                        </td>
                                        <td>{r.category}</td>
                                        <td className="max-w-[260px] truncate" title={r.description}>{r.description}</td>
                                        <td className="text-[12px]">{r.location}</td>
                                        <td className="font-mono">{r.bountyMon.toFixed(3)} MON</td>
                                        <td>{r.bids.length}</td>
                                        <td className="text-[12px]">
                                            {r.winner ? r.winner.agentLabel : <span className="text-[color:var(--color-ink-faded)]">—</span>}
                                        </td>
                                        <td>
                                            <Badge variant={STATE_VARIANT[r.state] ?? "info"}>{r.state.toUpperCase()}</Badge>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>
        </div>
    );
}
