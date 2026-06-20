import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { configuredAgents, type AgentLabel } from "@/lib/onchain/wallets";
import { explorerAddressUrl } from "@/lib/onchain/chain";
import { shortAddr } from "@/lib/utils";
import { getDemoTier } from "@/config/tiers";

const LABEL_DISPLAY: Record<AgentLabel, string> = {
    "deployer": "Deployer",
    "resident-relayer": "Resident Relayer",
    "volunteer-a": "Volunteer Anil",
    "volunteer-b": "Volunteer Bina",
    "supply": "Supply Agent",
    "route": "Route Agent",
    "verifier": "Verifier Agent",
};

export function AgentRoster() {
    const agents = configuredAgents();
    const tier = getDemoTier();
    const entries: { label: AgentLabel; address: `0x${string}` }[] = (Object.entries(agents) as [
        AgentLabel,
        `0x${string}`,
    ][]).map(([label, address]) => ({ label, address }));

    return (
        <Card>
            <CardHeader title="Agent Roster" description={`Server-held EOAs configured for the ${tier} tier`} />
            <table className="mm-table">
                <thead>
                    <tr>
                        <th>Agent</th>
                        <th>Address</th>
                        <th>ERC-8004</th>
                    </tr>
                </thead>
                <tbody>
                    {entries.length === 0 ? (
                        <tr>
                            <td colSpan={3} className="text-[color:var(--color-text-secondary)]">
                                No agent keys configured. Set them in <code>.env.local</code>.
                            </td>
                        </tr>
                    ) : (
                        entries.map(({ label, address }) => (
                            <tr key={label}>
                                <td>{LABEL_DISPLAY[label]}</td>
                                <td>
                                    <a className="font-mono" href={explorerAddressUrl(address)} target="_blank" rel="noopener">
                                        {shortAddr(address)}
                                    </a>
                                </td>
                                <td>
                                    {tier === "demo-plus" ? (
                                        <a className="text-[var(--color-link)]" href={`https://8004scan.io/agent/${address}`} target="_blank" rel="noopener">
                                            View on 8004scan.io
                                        </a>
                                    ) : (
                                        <Badge variant="info">MVP</Badge>
                                    )}
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </Card>
    );
}
