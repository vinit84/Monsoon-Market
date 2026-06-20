import { AgentRoster } from "@/components/agent-roster";
import { Card, CardHeader } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default function AgentsPage() {
    return (
        <div className="space-y-6">
            <AgentRoster />
            <Card>
                <CardHeader title="Architecture Notes" description="How agents coordinate" />
                <div className="space-y-3 text-[13px] text-[color:var(--color-ink)] leading-relaxed">
                    <p>
                        <strong>Resident Relayer</strong> takes user input from the form, pins the payload to IPFS,
                        and submits the on-chain <code>postRequest</code> on behalf of the user.
                    </p>
                    <p>
                        <strong>Supply Agent</strong> exposes an HTTP endpoint that returns inventory quotes
                        from the mocked donor inventory. Volunteers query it before bidding.
                    </p>
                    <p>
                        <strong>Route Agent</strong> exposes an x402-paid endpoint returning flood-aware route
                        data over the mocked Mumbai road graph.
                    </p>
                    <p>
                        <strong>Volunteers (Anil & Bina)</strong> watch RequestPosted events, fetch quotes from
                        Supply + Route, compute their persona-specific bid, and submit it on-chain within the
                        10-second auction window.
                    </p>
                    <p>
                        <strong>Verifier Agent</strong> watches ProofSubmitted events, runs a vision LLM check
                        on the proof image, and signs an on-chain attestation that releases or slashes escrow.
                    </p>
                </div>
            </Card>
        </div>
    );
}
