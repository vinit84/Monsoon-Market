"use client";
import { useState } from "react";
import { Card, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export default function ComposePage() {
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<{ txHash?: string; ipfsUri?: string; error?: string } | null>(null);
    const [form, setForm] = useState({
        category: "medicine",
        description: "Need insulin delivered to Andheri East",
        location: "andheri_e",
        bountyMon: 0.1,
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
                    requesterAddress: "0x000000000000000000000000000000000000DEAD",
                }),
            });
            const json = (await res.json()) as { ok?: boolean; txHash?: string; ipfsUri?: string; error?: unknown };
            if (!res.ok || !json.ok) {
                setResult({ error: typeof json.error === "string" ? json.error : "Request failed" });
            } else {
                setResult({ txHash: json.txHash, ipfsUri: json.ipfsUri });
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
                <CardHeader title="Compose Emergency Request" description="The Resident Agent will pin to IPFS and lock the bounty" />
                <div className="space-y-4">
                    <div>
                        <Label htmlFor="category">Category</Label>
                        <Input
                            id="category"
                            value={form.category}
                            onChange={(e) => setForm({ ...form, category: e.target.value })}
                        />
                    </div>
                    <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                        />
                    </div>
                    <div>
                        <Label htmlFor="location">Destination location ID</Label>
                        <Input
                            id="location"
                            value={form.location}
                            onChange={(e) => setForm({ ...form, location: e.target.value })}
                        />
                        <p className="text-[12px] text-[color:var(--color-text-secondary)] mt-1">
                            Must match a node id in <code>roadGraph.json</code> (e.g., andheri_e, dadar_w, worli)
                        </p>
                    </div>
                    <div>
                        <Label htmlFor="bounty">Bounty (MON)</Label>
                        <Input
                            id="bounty"
                            type="number"
                            step="0.01"
                            value={form.bountyMon}
                            onChange={(e) => setForm({ ...form, bountyMon: Number(e.target.value) })}
                        />
                    </div>
                    <Button onClick={submit} disabled={submitting}>
                        {submitting ? "Posting…" : "Post Request"}
                    </Button>
                </div>
            </Card>
            <Card>
                <CardHeader title="Result" description="Transaction hash and IPFS URI" />
                {result?.error && (
                    <div className="px-3 py-2 rounded bg-[var(--color-critical-bg)] text-[var(--color-critical-fg)]">
                        {result.error}
                    </div>
                )}
                {result?.txHash && (
                    <div className="space-y-2 font-mono text-[13px] break-all">
                        <div>
                            <span className="text-[color:var(--color-text-secondary)]">tx: </span>
                            {result.txHash}
                        </div>
                        <div>
                            <span className="text-[color:var(--color-text-secondary)]">ipfs: </span>
                            {result.ipfsUri}
                        </div>
                    </div>
                )}
                {!result && <p className="text-[color:var(--color-text-secondary)]">Submit the form to see results.</p>}
            </Card>
        </div>
    );
}
