"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser, useInvalidateUser } from "@/hooks/use-user";

export function UserMenu() {
    const { user, loading } = useUser();
    const invalidateUser = useInvalidateUser();
    const router = useRouter();

    if (loading) return null;

    if (!user) {
        return (
            <div className="flex items-center gap-2">
                <Link
                    href="/login"
                    className="text-[12px] font-medium text-[color:var(--color-ink)] hover:text-[color:var(--color-brand-deep)] px-3 py-1.5"
                >
                    Sign in
                </Link>
                <Link
                    href="/register"
                    className="sk-btn sk-btn-primary text-[12px]"
                    style={{ minHeight: 32, padding: "6px 14px" }}
                >
                    Register
                </Link>
            </div>
        );
    }

    async function logout() {
        await fetch("/api/auth/logout", { method: "POST" });
        invalidateUser();
        router.push("/login");
    }

    const roleLabel = user.role === "volunteer" ? "Volunteer" : "Resident";
    const roleColor =
        user.role === "volunteer"
            ? "var(--color-brand)"
            : "var(--color-brass)";

    return (
        <div className="flex items-center gap-2 pl-3 border-l border-[color:var(--color-paper-shadow)]">
            <span
                className="inline-block w-1.5 h-1.5 rounded-full"
                style={{ background: roleColor }}
                aria-hidden
            />
            <span className="text-[13px] font-medium text-[color:var(--color-ink)]">
                {user.name}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-[color:var(--color-ink-muted)]">
                · {roleLabel}
            </span>
            <button
                onClick={logout}
                className="ml-2 text-[11px] text-[color:var(--color-ink-muted)] hover:text-[color:var(--color-ink)] underline-offset-2 hover:underline"
            >
                Sign out
            </button>
        </div>
    );
}
