"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useInvalidateUser } from "@/hooks/use-user";

export default function LoginPage() {
    const router = useRouter();
    const invalidateUser = useInvalidateUser();
    const [email, setEmail] = useState("resident@monsoon.local");
    const [password, setPassword] = useState("demo1234");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function submit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ email, password }),
            });
            const json = (await res.json()) as { ok?: boolean; error?: string; user?: { role?: "resident" | "volunteer" } };
            if (!res.ok || !json.ok) {
                setError(json.error ?? "Login failed");
            } else {
                invalidateUser();
                const role = json.user?.role ?? "resident";
                router.push(role === "volunteer" ? "/volunteer/dashboard" : "/");
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : "Login failed");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="max-w-md mx-auto mt-12">
            <Card>
                <CardHeader title="Sign In" description="Welcome back to Monsoon Market" />
                <form onSubmit={submit} className="space-y-4">
                    {error && <div className="sk-result-error text-[12.5px]">{error}</div>}
                    <div>
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                    <div>
                        <Label htmlFor="password">Password</Label>
                        <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                    </div>
                    <Button type="submit" disabled={loading} className="w-full">
                        {loading ? "Signing in…" : "Sign In"}
                    </Button>
                    <div className="sk-result-info text-[11px] space-y-1">
                        <div><strong>Demo Resident:</strong> resident@monsoon.local / demo1234</div>
                        <div><strong>Demo Volunteer:</strong> volunteer@monsoon.local / demo1234</div>
                    </div>
                    <div className="text-center text-[12px] text-[color:var(--color-ink-muted)] pt-2">
                        Don&apos;t have an account?{" "}
                        <Link href="/register" className="text-[color:var(--color-brand-deep)] underline font-medium">
                            Register
                        </Link>
                    </div>
                </form>
            </Card>
        </div>
    );
}
