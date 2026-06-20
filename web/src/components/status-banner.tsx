"use client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";

interface Props {
    state: "idle" | "open" | "awarded" | "fulfilled" | "disputed" | "failed";
    deadlineMs?: number;
    requestId?: string;
}

const VARIANT: Record<Props["state"], "info" | "warning" | "success" | "critical"> = {
    idle: "info",
    open: "warning",
    awarded: "info",
    fulfilled: "success",
    disputed: "critical",
    failed: "critical",
};

export function StatusBanner({ state, deadlineMs, requestId }: Props) {
    const [now, setNow] = useState<number>(() => Date.now());
    useEffect(() => {
        if (state !== "open") return;
        const t = setInterval(() => setNow(Date.now()), 200);
        return () => clearInterval(t);
    }, [state]);

    const label = STATE_LABEL[state];
    const remaining = state === "open" && deadlineMs ? Math.max(0, Math.ceil((deadlineMs - now) / 1000)) : null;

    return (
        <Card className="flex items-center justify-between">
            <div>
                <div className="text-[12px] uppercase tracking-wide text-[color:var(--color-text-secondary)]">
                    Current Request {requestId ? `#${requestId}` : ""}
                </div>
                <div className="text-[20px] font-semibold mt-1">{label}</div>
            </div>
            <div className="flex items-center gap-3">
                {remaining !== null && (
                    <span className="font-mono text-[16px]">{remaining}s</span>
                )}
                <Badge variant={VARIANT[state]}>{state.toUpperCase()}</Badge>
            </div>
        </Card>
    );
}

const STATE_LABEL: Record<Props["state"], string> = {
    idle: "Waiting for a request",
    open: "Auction in progress",
    awarded: "Volunteer assigned",
    fulfilled: "Delivery verified",
    disputed: "Proof rejected",
    failed: "No bidders by deadline",
};
