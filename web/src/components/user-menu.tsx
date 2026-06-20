"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/use-user";

export function UserMenu() {
    const { user, loading } = useUser();
    const router = useRouter();

    if (loading) {
        return <div className="text-[11px] text-[color:var(--color-ink-muted)]">Loading…</div>;
    }

    if (!user) {
        return (
            <div className="flex items-center gap-2">
                <Link href="/login" className="sk-btn sk-btn-secondary text-[11px]" style={{ minHeight: 34, padding: "6px 14px" }}>
                    Sign in
                </Link>
                <Link href="/register" className="sk-btn sk-btn-primary text-[11px]" style={{ minHeight: 34, padding: "6px 14px" }}>
                    Register
                </Link>
            </div>
        );
    }

    async function logout() {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/login");
        router.refresh();
    }

    return (
        <div className="flex items-center gap-3">
            <div className="text-right">
                <div className="text-[12px] font-semibold text-[color:var(--color-ink)]">{user.name}</div>
                <div className="text-[10px] text-[color:var(--color-ink-muted)]">{user.email}</div>
            </div>
            <button onClick={logout} className="sk-btn sk-btn-secondary" style={{ minHeight: 34, padding: "6px 12px" }}>
                Sign out
            </button>
        </div>
    );
}
