import { Card, CardHeader } from "@/components/ui/card";

export default function HistoryPage() {
    return (
        <Card>
            <CardHeader title="Request History" description="Past requests and their final state" />
            <p className="text-[color:var(--color-text-secondary)]">
                Backed by viem getLogs over the escrow contract. Implement during build phase.
            </p>
        </Card>
    );
}
