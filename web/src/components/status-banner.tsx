"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";

interface Props {
    state: "idle" | "open" | "awarded" | "fulfilled" | "disputed" | "failed";
    deadlineMs?: number;
    requestId?: string | number;
}

const STATE_LABEL: Record<Props["state"], string> = {
    idle: "Ready · awaiting request",
    open: "Auction in progress",
    awarded: "Volunteer assigned · awaiting proof",
    fulfilled: "Delivery verified · escrow released",
    disputed: "Proof rejected · stake slashed",
    failed: "No bidders · bounty refunded",
};

const LED_VARIANT: Record<Props["state"], string> = {
    idle: "sk-led sk-led-blue",
    open: "sk-led sk-led-amber sk-led-pulse",
    awarded: "sk-led sk-led-amber",
    fulfilled: "sk-led sk-led-green",
    disputed: "sk-led sk-led-red",
    failed: "sk-led sk-led-red",
};

const BADGE: Record<Props["state"], "info" | "warning" | "success" | "critical" | "brass"> = {
    idle: "info",
    open: "warning",
    awarded: "brass",
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

    const remaining = state === "open" && deadlineMs ? Math.max(0, Math.ceil((deadlineMs - now) / 1000)) : null;

    return (
        <div className="sk-status-panel">
            <div className="flex items-center gap-4">
                <div className={LED_VARIANT[state]} style={{ width: 16, height: 16 }} />
                <div>
                    <div className="sk-status-label">
                        Current Operation {requestId ? `· #${requestId}` : ""}
                    </div>
                    <div className="sk-status-value">{STATE_LABEL[state]}</div>
                </div>
            </div>
            <div className="flex items-center gap-3">
                {remaining !== null && <span className="sk-status-timer">{String(remaining).padStart(2, "0")}s</span>}
                <Badge variant={BADGE[state]}>{state.toUpperCase()}</Badge>
            </div>
        </div>
    );
}
