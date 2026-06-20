"use client";
import { Badge } from "@/components/ui/badge";

interface TierBadgeProps {
    tier: "mvp" | "demo-plus";
    mode: "live" | "staged";
}

export function TierBadge({ tier, mode }: TierBadgeProps) {
    return (
        <div className="flex items-center gap-2">
            <Badge variant={tier === "mvp" ? "info" : "success"}>{tier === "mvp" ? "MVP" : "Demo+"}</Badge>
            <Badge variant={mode === "live" ? "success" : "warning"}>{mode === "live" ? "Live" : "Staged"}</Badge>
        </div>
    );
}
