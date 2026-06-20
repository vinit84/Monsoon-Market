"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function RegisterPage() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function submit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ email, password, name }),
            });
            const json = (await res.json()) as { ok?: boolean; error?: string };
            if (!res.ok || !json.ok) {
                setError(json.error ?? "Registration failed");
            } else {
                router.push("/");
                router.refresh();
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : "Registration failed");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="max-w-md mx-auto mt-12">
            <Card>
                <CardHeader title="Create Account" description="Join the Monsoon Mandi marketplace" />
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
                        <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" />
                    </div>
                    <Button type="submit" disabled={loading} className="w-full">
                        {loading ? "Creating account…" : "Create Account"}
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
