"use client";

import Link from "next/link";
import { TxStream } from "@/components/tx-stream";
import { StatusBanner } from "@/components/status-banner";
import { BidList } from "@/components/bid-list";
import { MumbaiMap } from "@/components/mumbai-map";
import { Card, CardHeader } from "@/components/ui/card";
import { useSimState, latestRequest } from "@/hooks/use-sim-state";
import { Badge } from "@/components/ui/badge";

export default function Home() {
    const sim = useSimState();
    const latest = latestRequest(sim);

    const status = latest?.state ?? "idle";
    const requestId = latest?.id;
    const deadlineMs = latest?.deadline;
    const bids = latest?.bids ?? [];
    const winnerAddress = latest?.winner?.agentAddress ?? null;
    const auctionDecided = status === "awarded" || status === "fulfilled" || status === "disputed";

    return (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            <section className="xl:col-span-8 flex flex-col gap-6">
                <StatusBanner state={status} deadlineMs={deadlineMs} requestId={requestId} />
                <BidList bids={bids} winnerAddress={winnerAddress} auctionDecided={auctionDecided} />
                <MumbaiMap />
                {!latest && (
                    <Card>
                        <CardHeader
                            title="Get Started"
                            description="Post your first emergency request to kick off the agent economy"
                            action={
                                <Link className="sk-btn sk-btn-primary" href="/compose">
                                    + New Request
                                </Link>
                            }
                        />
                        <ol className="ml-5 list-decimal space-y-2 text-[13px] text-[color:var(--color-ink)]">
                            <li>Connect MetaMask wallet (top right)</li>
                            <li>Click <strong>New Request</strong> and describe your emergency</li>
                            <li>Watch agents bid in the Tx Stream →</li>
                            <li>Auction closes → Winner delivers → Verifier attests → Bounty paid</li>
                        </ol>
                    </Card>
                )}
                {latest && (
                    <Card>
                        <CardHeader
                            title={`Request #${latest.id}`}
                            description="Active request details"
                            action={<Badge variant="brass">{latest.bountyMon.toFixed(3)} MON BOUNTY</Badge>}
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[13px]">
                            <div>
                                <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-1">Category</div>
                                <div>{latest.category}</div>
                            </div>
                            <div>
                                <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-1">Location</div>
                                <div>{latest.location}</div>
                            </div>
                            <div className="md:col-span-2">
                                <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-1">Description</div>
                                <div>{latest.description}</div>
                            </div>
                            {latest.winner && (
                                <div className="md:col-span-2">
                                    <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-1">Winning Bid</div>
                                    <div>
                                        <strong>{latest.winner.agentLabel}</strong> · {latest.winner.priceMon.toFixed(4)} MON · ETA {latest.winner.etaSeconds}s
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>
                )}
            </section>
            <aside className="xl:col-span-4 flex flex-col gap-6">
                <TxStream />
            </aside>
        </div>
    );
}
