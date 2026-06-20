import { AgentRoster } from "@/components/agent-roster";
import { Card, CardHeader } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default function AgentsPage() {
    return (
        <div className="space-y-6">
            <AgentRoster />
            <Card>
                <CardHeader
                    title="Boot Agent Loops"
                    description="POST /api/agents/start to begin watching for RequestPosted events"
                />
                <pre className="font-mono text-[13px] bg-[var(--color-background)] border border-[var(--color-border-subdued)] p-3 rounded">
                    {`curl -X POST http://localhost:3000/api/agents/start`}
                </pre>
            </Card>
        </div>
    );
}
