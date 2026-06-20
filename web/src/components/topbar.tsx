import { TierBadge } from "./tier-badge";
import { getDemoTier, getDemoMode } from "@/config/tiers";

export function Topbar() {
    const tier = getDemoTier();
    const mode = getDemoMode();
    return (
        <header className="h-14 bg-[var(--color-surface)] border-b border-[var(--color-border-subdued)] flex items-center justify-between px-6">
            <div>
                <div className="text-[14px] font-medium">Monsoon Mandi</div>
                <div className="text-[12px] text-[color:var(--color-text-secondary)]">
                    Autonomous agent marketplace · Mumbai monsoon emergency relief
                </div>
            </div>
            <TierBadge tier={tier} mode={mode} />
        </header>
    );
}
