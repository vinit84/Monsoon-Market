"use client";

import dynamic from "next/dynamic";
import { Card, CardHeader } from "@/components/ui/card";

const MapInner = dynamic(() => import("./mumbai-map-inner").then((m) => m.MumbaiMapInner), {
    ssr: false,
    loading: () => (
        <div className="sk-map h-[420px] flex items-center justify-center text-white/60 text-[13px]">
            Loading map…
        </div>
    ),
});

export function MumbaiMap() {
    return (
        <Card>
            <CardHeader
                title="Mumbai Flood Map"
                description="Live conditions · documented 2024–2025 monsoon hotspots"
                action={<span className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-faded)] font-mono">MAP-01 · OSM</span>}
            />
            <div className="sk-map h-[420px] relative">
                <MapInner />
            </div>
        </Card>
    );
}
