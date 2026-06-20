"use client";

import { useEffect, useState } from "react";

export interface User {
    email: string;
    name: string;
    walletAddress?: string;
}

export function useUser() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const res = await fetch("/api/auth/me", { cache: "no-store" });
                if (res.ok) {
                    const data = (await res.json()) as { user: User | null };
                    setUser(data.user);
                }
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    return { user, loading, refresh: () => setUser(null) };
}
