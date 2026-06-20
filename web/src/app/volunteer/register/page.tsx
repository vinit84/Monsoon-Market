"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAccount } from "wagmi";
import { Card, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUser } from "@/hooks/use-user";
import { ConnectButton } from "@rainbow-me/rainbowkit";

const LOCATIONS = [
    { id: "andheri_e", name: "Andheri East" },
    { id: "andheri_w", name: "Andheri West" },
    { id: "bandra_w", name: "Bandra West" },
    { id: "kurla_w", name: "Kurla West" },
    { id: "sion", name: "Sion" },
    { id: "dadar_tt", name: "Dadar TT" },
    { id: "dadar_w", name: "Dadar West" },
    { id: "worli", name: "Worli" },
    { id: "marol", name: "Marol" },
    { id: "chembur", name: "Chembur" },
];

export default function VolunteerRegisterPage() {
    const router = useRouter();
    const { user, loading: userLoading } = useUser();
    const { address, isConnected } = useAccount();
    const [displayName, setDisplayName] = useState("");
    const [phone, setPhone] = useState("");
    const [serviceAreas, setServiceAreas] = useState<string[]>(["andheri_e", "marol"]);
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [alreadyRegistered, setAlreadyRegistered] = useState(false);

    useEffect(() => {
        // Pre-fill name from logged-in user
        if (user?.name) setDisplayName(user.name);
    }, [user]);

    useEffect(() => {
        // Check if user is already a volunteer
        async function check() {
            const res = await fetch("/api/volunteer/register");
            if (res.ok) {
                const data = (await res.json()) as { volunteer?: unknown };
                if (data.volunteer) setAlreadyRegistered(true);
            }
        }
        if (user) check();
    }, [user]);

    function toggleArea(id: string) {
        setServiceAreas((prev) =>
            prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
        );
    }

    async function submit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        if (!isConnected || !address) {
            setError("Please connect your MetaMask wallet first");
            return;
        }
        setSubmitting(true);
        try {
            const res = await fetch("/api/volunteer/register", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                    walletAddress: address,
                    displayName,
                    phone,
                    serviceAreas,
                }),
            });
            const json = (await res.json()) as { ok?: boolean; error?: string };
            if (!res.ok || !json.ok) {
                setError(json.error ?? "Registration failed");
            } else {
                router.push("/volunteer/dashboard");
                router.refresh();
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : "Registration failed");
        } finally {
            setSubmitting(false);
        }
    }

    if (userLoading) {
        return <div className="text-center py-12 text-[color:var(--color-ink-muted)]">Loading…</div>;
    }

    if (!user) {
        return (
            <div className="max-w-md mx-auto mt-12">
                <Card>
                    <CardHeader title="Sign in required" description="Volunteers must have an account" />
                    <p className="text-[13px] mb-4 text-[color:var(--color-ink-muted)]">
                        You need to sign in or register first to become a volunteer.
                    </p>
                    <div className="flex gap-3">
                        <Link href="/login" className="sk-btn sk-btn-primary">Sign in</Link>
                        <Link href="/register" className="sk-btn sk-btn-secondary">Create account</Link>
                    </div>
                </Card>
            </div>
        );
    }

    if (alreadyRegistered) {
        return (
            <div className="max-w-md mx-auto mt-12">
                <Card>
                    <CardHeader title="You're already a volunteer" description="Head to your dashboard to start bidding" />
                    <Link href="/volunteer/dashboard" className="sk-btn sk-btn-primary">Volunteer Dashboard</Link>
                </Card>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto">
            <Card>
                <CardHeader
                    title="Become a Volunteer"
                    description="Bid on emergency requests in real-time and earn MON for every successful delivery"
                />
                <form onSubmit={submit} className="space-y-5">
                    {error && <div className="sk-result-error text-[12.5px]">{error}</div>}

                    <div>
                        <Label>Connected Wallet</Label>
                        {isConnected ? (
                            <div className="flex items-center gap-2 mb-2">
                                <Badge variant="success">CONNECTED</Badge>
                                <span className="font-mono text-[12px]">{address}</span>
                            </div>
                        ) : (
                            <div className="mb-2">
                                <ConnectButton showBalance={true} />
                                <p className="text-[11px] text-[color:var(--color-ink-muted)] mt-2">
                                    Bounties will be paid to this wallet
                                </p>
                            </div>
                        )}
                    </div>

                    <div>
                        <Label htmlFor="displayName">Display name</Label>
                        <Input
                            id="displayName"
                            required
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="Priya Sharma"
                        />
                    </div>

                    <div>
                        <Label htmlFor="phone">Phone (optional)</Label>
                        <Input
                            id="phone"
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="+91 9000 000 000"
                        />
                    </div>

                    <div>
                        <Label>Service areas (where can you deliver?)</Label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                            {LOCATIONS.map((loc) => {
                                const active = serviceAreas.includes(loc.id);
                                return (
                                    <button
                                        key={loc.id}
                                        type="button"
                                        onClick={() => toggleArea(loc.id)}
                                        className={`px-3 py-2 rounded text-[12px] font-medium border transition-all ${
                                            active
                                                ? "bg-[color:var(--color-brand)] text-white border-[color:var(--color-brand-deep)] shadow-inner"
                                                : "bg-[color:var(--color-surface)] text-[color:var(--color-ink)] border-[color:var(--color-border)] hover:border-[color:var(--color-brand)]"
                                        }`}
                                    >
                                        {loc.name}
                                    </button>
                                );
                            })}
                        </div>
                        <p className="text-[11px] text-[color:var(--color-ink-muted)] mt-2">
                            You'll only see requests from your service areas in your dashboard
                        </p>
                    </div>

                    <Button
                        type="submit"
                        disabled={submitting || !isConnected || serviceAreas.length === 0}
                        className="w-full"
                    >
                        {submitting ? "Registering…" : "🤝 Register as Volunteer"}
                    </Button>
                </form>
            </Card>
        </div>
    );
}
