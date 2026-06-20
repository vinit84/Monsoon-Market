"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useUser, type UserRole } from "./use-user";

/**
 * Role-based route guard.
 * - If not signed in → redirect to /login
 * - If signed in with wrong role → redirect to their home
 *
 * Returns the user once allowed; null while loading or redirecting.
 */
export function useRoleGuard(requiredRole: UserRole) {
    const { user, loading } = useUser();
    const router = useRouter();

    useEffect(() => {
        if (loading) return;
        if (!user) {
            router.replace(`/login?next=${encodeURIComponent(window.location.pathname)}`);
            return;
        }
        if (user.role !== requiredRole) {
            router.replace(user.role === "volunteer" ? "/volunteer/dashboard" : "/");
        }
    }, [user, loading, requiredRole, router]);

    if (loading || !user || user.role !== requiredRole) return { user: null, loading: true };
    return { user, loading: false };
}
