"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAccount } from "wagmi";
import { Card, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRoleGuard } from "@/hooks/use-role-guard";
import { kickoffClientFlow } from "@/lib/sim/client-flow";

const CATEGORIES = ["medicine", "food_packet", "water_bottle", "first_aid", "blanket"];
const LOCATIONS = [
    { id: "andheri_e", name: "Andheri East" },
    { id: "andheri_w", name: "Andheri West" },
    { id: "bandra_w", name: "Bandra West" },
    { id: "kurla_w", name: "Kurla West" },
    { id: "sion", name: "Sion" },
    { id: "dadar_tt", name: "Dadar TT" },
    { id: "dadar_w", name: "Dadar West" },
    { id: "worli", name: "Worli" },
];

export default function ComposePage() {
    const guard = useRoleGuard("resident");
    const router = useRouter();
    const { address, isConnected } = useAccount();
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<{ txHash?: string; ipfsUri?: string; requestId?: number; error?: string } | null>(null);
    const [form, setForm] = useState({
        category: "medicine",
        description: "Need insulin delivered to Andheri East urgently",
        location: "andheri_e",
        bountyMon: 0.02,
    });

    async function submit() {
        setSubmitting(true);
        setResult(null);
        try {
            const res = await fetch("/api/request", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                    ...form,
                    requesterAddress: address ?? "0x0000000000000000000000000000000000000000",
                }),
            });
            const json = (await res.json()) as {
                ok?: boolean;
                txHash?: string;
                ipfsUri?: string;
                requestId?: number;
                explorerUrl?: string;
                deadline?: number;
                bountyMon?: number;
                category?: string;
                location?: string;
                description?: string;
                requesterAddress?: string;
                source?: "onchain" | "hybrid" | "simulation";
                error?: unknown;
            };
            if (!res.ok || !json.ok) {
                setResult({ error: typeof json.error === "string" ? json.error : JSON.stringify(json.error) });
            } else {
                // Seed the in-tab event bus so the dashboard's Tx Stream and
                // Live Bids panels animate as Anil and Bina bid against each
                // other. The first event carries the real Monadscan link.
                if (
                    typeof json.txHash === "string" &&
                    typeof json.requestId === "number" &&
                    typeof json.bountyMon === "number" &&
                    typeof json.deadline === "number"
                ) {
                    kickoffClientFlow({
                        txHash: json.txHash,
                        explorerUrl: json.explorerUrl ?? "#",
                        requestId: json.requestId,
                        ipfsUri: json.ipfsUri ?? "",
                        deadlineMs: json.deadline,
                        bountyMon: json.bountyMon,
                        category: json.category ?? form.category,
                        location: json.location ?? form.location,
                        description: json.description ?? form.description,
                        requesterAddress:
                            json.requesterAddress ?? address ?? "0x0000000000000000000000000000000000000000",
                        source: json.source ?? "simulation",
                    });
                    // Client-side navigate to the live dashboard so the
                    // in-tab event bus and the running setTimeout chain
                    // survive (a full <a href> reload would wipe both).
                    router.push("/");
                }
                setResult({ txHash: json.txHash, ipfsUri: json.ipfsUri, requestId: json.requestId });
            }
        } catch (e) {
            setResult({ error: e instanceof Error ? e.message : String(e) });
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
                <CardHeader title="Emergency Request" description="Describe what you need · agents compete to deliver" />
                {guard.loading && (
                    <div className="sk-result-info mb-4 text-[12px]">
                        Checking access…
                    </div>
                )}
                {!isConnected && (
                    <div className="sk-result-info mb-4 text-[12px]">
                        ⓘ Connect your MetaMask wallet from the top bar to sign requests on-chain.
                    </div>
                )}
                <div className="space-y-4">
                    <div>
                        <Label htmlFor="category">Category</Label>
                        <select
                            id="category"
                            className="sk-input"
                            value={form.category}
                            onChange={(e) => setForm({ ...form, category: e.target.value })}
                        >
                            {CATEGORIES.map((c) => (
                                <option key={c} value={c}>{c.replace("_", " ")}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <Label htmlFor="description">What do you need?</Label>
                        <Textarea
                            id="description"
                            placeholder="Describe the emergency..."
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                        />
                    </div>
                    <div>
                        <Label htmlFor="location">Delivery location</Label>
                        <select
                            id="location"
                            className="sk-input"
                            value={form.location}
                            onChange={(e) => setForm({ ...form, location: e.target.value })}
                        >
                            {LOCATIONS.map((l) => (
                                <option key={l.id} value={l.id}>{l.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <Label htmlFor="bounty">Bounty (MON)</Label>
                        <Input
                            id="bounty"
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={form.bountyMon}
                            onChange={(e) => setForm({ ...form, bountyMon: Number(e.target.value) })}
                        />
                        <p className="text-[11px] text-[color:var(--color-ink-muted)] mt-1.5">
                            Minimum 0.01 · higher bounty attracts more bids
                        </p>
                    </div>
                    <div className="pt-2">
                        <Button onClick={submit} disabled={submitting} className="w-full">
                            {submitting ? "Posting request…" : "🚨 Post Emergency Request"}
                        </Button>
                    </div>
                </div>
            </Card>

            <div className="space-y-6">
                <Card>
                    <CardHeader title="Result" />
                    {result?.error && (
                        <div className="sk-result-error text-[12.5px]">
                            <strong>Error:</strong> {result.error}
                        </div>
                    )}
                    {result?.txHash && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <Badge variant="success">REQUEST POSTED</Badge>
                                {result.requestId && <Badge variant="brass">#{result.requestId}</Badge>}
                            </div>
                            <div className="sk-receipt">
                                <div><strong>tx:</strong> {result.txHash}</div>
                                <div className="mt-1"><strong>ipfs:</strong> {result.ipfsUri}</div>
                            </div>
                            <p className="text-[12px] text-[color:var(--color-ink-muted)]">
                                ✓ Auction is open for 10 seconds. Watch the live dashboard →
                            </p>
                            <Link className="sk-btn sk-btn-secondary" href="/">View Live Dashboard</Link>
                        </div>
                    )}
                    {!result && (
                        <p className="text-[color:var(--color-ink-muted)] text-[13px] italic">
                            Submit the form to post an emergency request. Bounty is escrowed; agents respond within seconds.
                        </p>
                    )}
                </Card>

                <Card>
                    <CardHeader title="How it works" />
                    <ol className="ml-5 list-decimal space-y-2.5 text-[13px] text-[color:var(--color-ink)] leading-relaxed">
                        <li>You post a request with a bounty → escrowed on-chain</li>
                        <li>Volunteer agents bid (price + ETA) within 10s auction window</li>
                        <li>Lowest reputation-weighted bid wins</li>
                        <li>Winner delivers and submits photo proof</li>
                        <li>Verifier Agent checks proof with AI vision → on-chain attestation</li>
                        <li>Bounty released to winner; surplus refunded to you</li>
                    </ol>
                </Card>
            </div>
        </div>
    );
}
