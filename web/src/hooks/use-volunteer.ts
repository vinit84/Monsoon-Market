"use client";

import { useQuery } from "@tanstack/react-query";

export interface VolunteerProfile {
    walletAddress: string;
    userEmail: string;
    displayName: string;
    phone?: string;
    serviceAreas: string[];
    completedTasks: number;
    createdAt: number;
}

export function useVolunteer() {
    const { data, isLoading } = useQuery({
        queryKey: ["volunteer"],
        queryFn: async () => {
            const res = await fetch("/api/volunteer/register", { cache: "no-store" });
            if (!res.ok) return null;
            const json = (await res.json()) as { volunteer: VolunteerProfile | null };
            return json.volunteer;
        },
        staleTime: 5_000,
        refetchOnWindowFocus: true,
    });
    return { volunteer: data ?? null, loading: isLoading };
}
