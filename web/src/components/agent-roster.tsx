"use client";

import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { shortAddr } from "@/lib/utils";
import { useSimState } from "@/hooks/use-sim-state";

const AGENTS: { label: string; address: string; role: string }[] = [
    { label: "Resident Relayer", address: "0xD761096e542a344429CeB1a68C52bDAB1dB9C78D", role: "Posts requests on behalf of residents" },
    { label: "Volunteer Anil",  address: "0xA111111111111111111111111111111111111111", role: "Bids · fast scooter" },
    { label: "Volunteer Bina",  address: "0xB222222222222222222222222222222222222222", role: "Bids · cheap on foot" },
    { label: "Supply Agent",    address: "0xC333333333333333333333333333333333333333", role: "Sells inventory quotes" },
    { label: "Route Agent",     address: "0xD444444444444444444444444444444444444444", role: "Sells x402 routing data" },
    { label: "Verifier Agent",  address: "0xE555555555555555555555555555555555555555", role: "Vision LLM attestations" },
];

export function AgentRoster() {
    const { reputation } = useSimState();
    return (
        <Card>
            <CardHeader title="Agent Roster" description="Six autonomous agents · server-held wallets" />
            <div className="overflow-x-auto">
                <table className="sk-table">
                    <thead>
                        <tr>
                            <th>Agent</th>
                            <th>Role</th>
                            <th>Address</th>
                            <th>Reputation</th>
                        </tr>
                    </thead>
                    <tbody>
                        {AGENTS.map((a) => (
                            <tr key={a.address}>
                                <td>
                                    <div className="flex items-center gap-2">
                                        <span className="sk-led sk-led-green" style={{ width: 8, height: 8 }} />
                                        <span className="font-semibold">{a.label}</span>
                                    </div>
                                </td>
                                <td className="text-[color:var(--color-ink-muted)] text-[12px]">{a.role}</td>
                                <td>
                                    <span className="font-mono text-[11px]">{shortAddr(a.address)}</span>
                                </td>
                                <td>
                                    <Badge variant="brass">{reputation[a.address] ?? 0} tasks</Badge>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
}
