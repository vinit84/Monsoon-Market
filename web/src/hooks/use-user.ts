"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";

export type UserRole = "resident" | "volunteer";

export interface User {
    email: string;
    name: string;
    role: UserRole;
    walletAddress?: string;
}

const USER_QUERY_KEY = ["user"] as const;

async function fetchUser(): Promise<User | null> {
    const res = await fetch("/api/auth/me", { cache: "no-store" });
    if (!res.ok) return null;
    const data = (await res.json()) as { user: User | null };
    return data.user;
}

export function useUser() {
    const { data: user, isLoading } = useQuery({
        queryKey: USER_QUERY_KEY,
        queryFn: fetchUser,
        staleTime: 5_000,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        refetchOnMount: true,
    });
    return { user: user ?? null, loading: isLoading };
}

/**
 * Returns a function that invalidates the user query so all `useUser` consumers
 * refetch immediately. Call this after login, register, or logout.
 */
export function useInvalidateUser() {
    const qc = useQueryClient();
    return () => {
        qc.invalidateQueries({ queryKey: USER_QUERY_KEY });
    };
}
