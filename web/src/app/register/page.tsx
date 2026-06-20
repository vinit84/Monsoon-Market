"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Card, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useInvalidateUser } from "@/hooks/use-user";

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

type Role = "resident" | "volunteer";

export default function RegisterPage() {
    const router = useRouter();
    const invalidateUser = useInvalidateUser();
    const { address, isConnected } = useAccount();
    const [role, setRole] = useState<Role>("resident");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [phone, setPhone] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [serviceAreas, setServiceAreas] = useState<string[]>(["andheri_e", "marol"]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    function toggleArea(id: string) {
        setServiceAreas((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
    }

    async function submit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const body =
                role === "volunteer"
                    ? {
                          role,
                          email,
                          password,
                          name,
                          walletAddress: address,
                          displayName: displayName || name,
                          phone,
                          serviceAreas,
                      }
                    : { role, email, password, name };

            if (role === "volunteer" && !isConnected) {
                setError("Connect your MetaMask wallet to register as a volunteer");
                setLoading(false);
                return;
            }

            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify(body),
            });
            const json = (await res.json()) as { ok?: boolean; error?: string };
            if (!res.ok || !json.ok) {
                setError(json.error ?? "Registration failed");
            } else {
                invalidateUser();
                router.push(role === "volunteer" ? "/volunteer/dashboard" : "/");
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : "Registration failed");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="max-w-2xl mx-auto">
            <Card>
                <CardHeader title="Create Account" description="Join the Monsoon Market marketplace" />

                {/* Role tabs */}
                <div className="grid grid-cols-2 gap-2 mb-6 p-1 bg-[var(--color-paper-dark)] rounded-md">
                    <button
                        type="button"
                        onClick={() => setRole("resident")}
                        className={cn(
                            "px-4 py-3 rounded font-semibold text-[13px] uppercase tracking-wider transition-all",
                            role === "resident"
                                ? "bg-white text-[var(--color-brand-deep)] shadow-md border border-[var(--color-paper-shadow)]"
                                : "text-[color:var(--color-ink-muted)] hover:text-[color:var(--color-ink)]",
                        )}
                    >
                        🏠 Resident
                    </button>
                    <button
                        type="button"
                        onClick={() => setRole("volunteer")}
                        className={cn(
                            "px-4 py-3 rounded font-semibold text-[13px] uppercase tracking-wider transition-all",
                            role === "volunteer"
                                ? "bg-white text-[var(--color-brand-deep)] shadow-md border border-[var(--color-paper-shadow)]"
                                : "text-[color:var(--color-ink-muted)] hover:text-[color:var(--color-ink)]",
                        )}
                    >
                        🤝 Volunteer
                    </button>
                </div>

                <p className="text-[12px] text-[color:var(--color-ink-muted)] mb-5 italic">
                    {role === "resident"
                        ? "Residents post emergency requests and pay bounties to volunteers who deliver."
                        : "Volunteers bid on emergency requests in real-time and earn MON for every successful delivery."}
                </p>

                <form onSubmit={submit} className="space-y-4">
                    {error && <div className="sk-result-error text-[12.5px]">{error}</div>}

                    <div>
                        <Label htmlFor="name">Full name</Label>
                        <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Priya Sharma" />
                    </div>

                    <div>
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
                    </div>

                    <div>
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            required
                            minLength={6}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="At least 6 characters"
                        />
                    </div>

                    {role === "volunteer" && (
                        <>
                            <div className="pt-3 border-t border-dashed border-[color:var(--color-paper-shadow)]">
                                <h3 className="text-[11px] font-bold uppercase tracking-wider text-[color:var(--color-ink-muted)] mb-3">
                                    Volunteer details
                                </h3>
                            </div>

                            <div>
                                <Label>Wallet (where bounties land)</Label>
                                {isConnected ? (
                                    <div className="flex items-center gap-2">
                                        <Badge variant="success">CONNECTED</Badge>
                                        <span className="font-mono text-[12px] break-all">{address}</span>
                                    </div>
                                ) : (
                                    <ConnectButton />
                                )}
                            </div>

                            <div>
                                <Label htmlFor="displayName">Public display name</Label>
                                <Input
                                    id="displayName"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    placeholder={name || "Shown to residents on bids"}
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
                                                className={cn(
                                                    "px-3 py-2 rounded text-[12px] font-medium border transition-all",
                                                    active
                                                        ? "bg-[color:var(--color-brand)] text-white border-[color:var(--color-brand-deep)] shadow-inner"
                                                        : "bg-[color:var(--color-surface)] text-[color:var(--color-ink)] border-[color:var(--color-border)] hover:border-[color:var(--color-brand)]",
                                                )}
                                            >
                                                {loc.name}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </>
                    )}

                    <Button type="submit" disabled={loading || (role === "volunteer" && !isConnected)} className="w-full">
                        {loading
                            ? "Creating account…"
                            : role === "volunteer"
                                ? "🤝 Register as Volunteer"
                                : "🏠 Register as Resident"}
                    </Button>

                    <div className="text-center text-[12px] text-[color:var(--color-ink-muted)] pt-2">
                        Already registered?{" "}
                        <Link href="/login" className="text-[color:var(--color-brand-deep)] underline font-medium">
                            Sign in
                        </Link>
                    </div>
                </form>
            </Card>
        </div>
    );
}
