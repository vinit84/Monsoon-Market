"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAccount, useWriteContract, useChainId, useSwitchChain, useWaitForTransactionReceipt } from "wagmi";
import { parseEther } from "viem";
import { Card, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useVolunteer } from "@/hooks/use-volunteer";
import { useSimState, type SimRequest } from "@/hooks/use-sim-state";
import { useRoleGuard } from "@/hooks/use-role-guard";
import { escrowClientAbi, ESCROW_ADDRESS_PUBLIC } from "@/lib/onchain/escrow-abi-tuple";
import { shortAddr } from "@/lib/utils";

const MONAD_TESTNET_CHAIN_ID = 10143;

export default function VolunteerDashboard() {
    const guard = useRoleGuard("volunteer");
    const { volunteer, loading } = useVolunteer();
    const { address, isConnected } = useAccount();
    const sim = useSimState();
    const chainId = useChainId();
    const { switchChain } = useSwitchChain();

    const [bidModal, setBidModal] = useState<{ requestId: number | string; bountyMon: number; mode: "sim" | "live" } | null>(null);
    const [bidPrice, setBidPrice] = useState("0.015");
    const [bidEta, setBidEta] = useState("300");
    const [submittedTxHash, setSubmittedTxHash] = useState<`0x${string}` | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const { writeContractAsync, isPending: writing } = useWriteContract();
    const { isLoading: confirming, isSuccess: confirmed } = useWaitForTransactionReceipt({
        hash: submittedTxHash ?? undefined,
    });

    const onWrongChain = isConnected && chainId !== MONAD_TESTNET_CHAIN_ID;

    if (loading || guard.loading) {
        return <div className="text-center py-12 text-[color:var(--color-ink-muted)]">Loading…</div>;
    }

    if (!volunteer) {
        return (
            <div className="max-w-md mx-auto mt-12">
                <Card>
                    <CardHeader title="Not registered" description="You need to register as a volunteer first" />
                    <Link href="/volunteer/register" className="sk-btn sk-btn-primary">Register as Volunteer</Link>
                </Card>
            </div>
        );
    }

    const openRequests = sim.requests.filter((r) => r.state === "open");
    const myWonRequests = sim.requests.filter(
        (r) => r.winner?.agentAddress.toLowerCase() === volunteer.walletAddress.toLowerCase(),
    );

    const matchesArea = (r: SimRequest) =>
        volunteer.serviceAreas.length === 0 || volunteer.serviceAreas.includes(r.location);

    function openSimBid(r: SimRequest) {
        setBidPrice((r.bountyMon * 0.7).toFixed(4));
        setBidEta("300");
        setBidModal({ requestId: r.id, bountyMon: r.bountyMon, mode: "sim" });
        setSubmittedTxHash(null);
        setErrorMsg(null);
    }

    function openLiveBid(requestId: string, bountyMon: number) {
        setBidPrice((bountyMon * 0.7).toFixed(4));
        setBidEta("300");
        setBidModal({ requestId, bountyMon, mode: "live" });
        setSubmittedTxHash(null);
        setErrorMsg(null);
    }

    async function submitBid() {
        if (!bidModal) return;
        setErrorMsg(null);

        if (bidModal.mode === "sim") {
            // Sim path — POST to API to inject the bid into simulation state
            try {
                const res = await fetch("/api/volunteer/bid-sim", {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({
                        requestId: bidModal.requestId,
                        priceMon: Number(bidPrice),
                        etaSeconds: Number(bidEta),
                        walletAddress: address ?? volunteer?.walletAddress,
                        displayName: volunteer?.displayName ?? "You",
                    }),
                });
                const j = (await res.json()) as { ok?: boolean; error?: string };
                if (!res.ok || !j.ok) {
                    setErrorMsg(j.error ?? "Bid failed");
                } else {
                    setBidModal(null);
                }
            } catch (e) {
                setErrorMsg(e instanceof Error ? e.message : String(e));
            }
            return;
        }

        // Live path — sign on Monad testnet
        if (!isConnected) {
            setErrorMsg("Connect your MetaMask wallet first");
            return;
        }
        if (onWrongChain) {
            setErrorMsg("Switch to Monad Testnet first");
            return;
        }
        try {
            const priceWei = parseEther(bidPrice);
            const stakeWei = parseEther("0.01"); // STAKE_AMOUNT constant
            const hash = await writeContractAsync({
                address: ESCROW_ADDRESS_PUBLIC,
                abi: escrowClientAbi,
                functionName: "submitBid",
                args: [BigInt(bidModal.requestId), priceWei, BigInt(bidEta)],
                value: stakeWei,
            });
            setSubmittedTxHash(hash);
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            setErrorMsg(msg.includes("User rejected") ? "Transaction rejected" : msg);
        }
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader
                    title={`Welcome, ${volunteer.displayName}`}
                    description={`Bidding from ${shortAddr(volunteer.walletAddress)} · ${volunteer.completedTasks} completed deliveries`}
                    action={<Badge variant="brass">VOLUNTEER · ACTIVE</Badge>}
                />
                <div className="flex flex-wrap gap-2 text-[12px] mb-2">
                    <span className="text-[color:var(--color-ink-muted)]">Service areas:</span>
                    {volunteer.serviceAreas.map((a) => (
                        <Badge key={a} variant="info">{a}</Badge>
                    ))}
                </div>
                {onWrongChain && (
                    <div className="sk-result-error text-[12px] mt-3 flex items-center justify-between gap-3">
                        <span>You're on the wrong network. Switch to Monad Testnet to place real bids.</span>
                        <Button variant="secondary" onClick={() => switchChain({ chainId: MONAD_TESTNET_CHAIN_ID })}>
                            Switch to Monad
                        </Button>
                    </div>
                )}
            </Card>

            <Card>
                <CardHeader
                    title="Open Auctions"
                    description="Place a bid to win the bounty · MetaMask signs the transaction"
                />
                {openRequests.length === 0 ? (
                    <p className="text-center py-8 text-[13px] text-[color:var(--color-ink-muted)] italic">
                        No open requests right now. Check back in a moment.
                    </p>
                ) : (
                    <div className="space-y-3">
                        {openRequests.map((r) => {
                            const inArea = matchesArea(r);
                            return (
                                <div key={r.id} className="sk-tx-row">
                                    <div className="flex items-center justify-between flex-wrap gap-3">
                                        <div className="flex-1 min-w-[260px]">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Badge variant="warning">#{r.id} · OPEN</Badge>
                                                <Badge variant={inArea ? "success" : "info"}>
                                                    {inArea ? "✓ in your area" : "outside your area"}
                                                </Badge>
                                                <span className="text-[11px] text-[color:var(--color-ink-muted)] font-mono">
                                                    {Math.max(0, Math.ceil((r.deadline - Date.now()) / 1000))}s left
                                                </span>
                                            </div>
                                            <div className="font-semibold text-[14px]">{r.description}</div>
                                            <div className="text-[12px] text-[color:var(--color-ink-muted)]">
                                                {r.category} · {r.location} · current bids: {r.bids.length}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="text-right">
                                                <div className="text-[10px] uppercase text-[color:var(--color-ink-muted)]">Bounty</div>
                                                <div className="font-mono font-bold">{r.bountyMon.toFixed(3)} MON</div>
                                            </div>
                                            <Button onClick={() => openSimBid(r)}>Place Bid</Button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </Card>

            <Card>
                <CardHeader
                    title="Your Won Deliveries"
                    description="Submit photo proof to release the bounty"
                />
                {myWonRequests.length === 0 ? (
                    <p className="text-center py-6 text-[13px] text-[color:var(--color-ink-muted)] italic">
                        Win an auction and your delivery shows up here.
                    </p>
                ) : (
                    <div className="space-y-3">
                        {myWonRequests.map((r) => (
                            <div key={r.id} className="sk-tx-row">
                                <div className="flex items-center justify-between flex-wrap gap-3">
                                    <div>
                                        <Badge variant="success">★ WON · #{r.id}</Badge>
                                        <div className="font-semibold mt-1">{r.description}</div>
                                        <div className="text-[12px] text-[color:var(--color-ink-muted)]">
                                            Earning: {r.winner?.priceMon.toFixed(4)} MON · State: {r.state}
                                        </div>
                                    </div>
                                    {r.state === "awarded" && <Badge variant="warning">Submit proof</Badge>}
                                    {r.state === "fulfilled" && <Badge variant="success">PAID OUT</Badge>}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            {/* Bid Modal */}
            {bidModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => !writing && setBidModal(null)}>
                    <div onClick={(e) => e.stopPropagation()} className="max-w-md w-full">
                        <Card>
                            <CardHeader
                                title={`Bid on Request #${bidModal.requestId}`}
                                description={bidModal.mode === "live" ? "Real on-chain bid · MetaMask signs" : "Bid against AI agents in the simulation"}
                            />
                            <div className="space-y-4">
                                {errorMsg && <div className="sk-result-error text-[12px]">{errorMsg}</div>}
                                {confirmed && submittedTxHash && (
                                    <div className="sk-result-success text-[12px]">
                                        ✓ Bid confirmed on-chain!{" "}
                                        <a
                                            className="underline"
                                            href={`https://testnet.monadscan.com/tx/${submittedTxHash}`}
                                            target="_blank"
                                            rel="noopener"
                                        >
                                            View tx
                                        </a>
                                    </div>
                                )}

                                <div>
                                    <Label htmlFor="bidPrice">Your price (MON) · max {bidModal.bountyMon.toFixed(3)}</Label>
                                    <Input
                                        id="bidPrice"
                                        type="number"
                                        step="0.001"
                                        min="0.001"
                                        max={bidModal.bountyMon}
                                        value={bidPrice}
                                        onChange={(e) => setBidPrice(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="bidEta">Your ETA (seconds)</Label>
                                    <Input
                                        id="bidEta"
                                        type="number"
                                        min="60"
                                        value={bidEta}
                                        onChange={(e) => setBidEta(e.target.value)}
                                    />
                                </div>
                                <div className="text-[11px] text-[color:var(--color-ink-muted)] bg-[color:var(--color-paper-dark)] rounded p-2">
                                    💡 Required stake: <strong>0.01 MON</strong> (refunded if you lose, slashed if you fail to deliver)
                                </div>

                                <div className="flex gap-2">
                                    <Button
                                        variant="secondary"
                                        onClick={() => setBidModal(null)}
                                        disabled={writing || confirming}
                                        className="flex-1"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={submitBid}
                                        disabled={writing || confirming}
                                        className="flex-1"
                                    >
                                        {writing
                                            ? "Signing in MetaMask…"
                                            : confirming
                                                ? "Confirming…"
                                                : "Submit Bid"}
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
}
