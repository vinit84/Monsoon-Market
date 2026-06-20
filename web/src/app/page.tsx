import { TxStream } from "@/components/tx-stream";
import { StatusBanner } from "@/components/status-banner";
import { BidList } from "@/components/bid-list";
import { AgentRoster } from "@/components/agent-roster";
import { Card, CardHeader } from "@/components/ui/card";
import Link from "next/link";

export const dynamic = "force-dynamic";

/**
 * Live Mandi — the demo dashboard. Shows the current request state, the live
 * bid list, and the transaction stream. Real-time data flows in through the
 * Tx Stream SSE feed and live escrow reads.
 */
export default function Home() {
    return (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            <section className="xl:col-span-8 flex flex-col gap-6">
                <StatusBanner state="idle" />
                <BidList bids={[]} winnerAddress={null} />
                <Card>
                    <CardHeader title="Mumbai Flood Map" description="Active flood zones in critical red" />
                    <div className="h-[280px] rounded-md bg-[var(--color-background)] border border-[var(--color-border-subdued)] flex items-center justify-center text-[color:var(--color-text-secondary)] text-[13px]">
                        Map placeholder · render `lib/mock/floodZones.json` over a Mumbai background SVG
                    </div>
                </Card>
                <Card>
                    <CardHeader
                        title="Get Started"
                        description="Post your first emergency request to kick off the agent economy"
                        action={
                            <Link className="mm-button-primary" href="/compose">
                                New Request
                            </Link>
                        }
                    />
                    <ol className="ml-4 list-decimal space-y-1 text-[14px]">
                        <li>
                            Copy <code>web/.env.example</code> to <code>web/.env.local</code> and fill agent keys.
                        </li>
                        <li>
                            Deploy contracts with <code>forge script script/Deploy.s.sol --rpc-url monad_testnet --broadcast</code>.
                        </li>
                        <li>
                            Boot the agent loops by POSTing to <code>/api/agents/start</code>.
                        </li>
                        <li>Submit a request from /compose and watch the auction run live.</li>
                    </ol>
                </Card>
            </section>
            <aside className="xl:col-span-4 flex flex-col gap-6">
                <AgentRoster />
                <TxStream />
            </aside>
        </div>
    );
}
