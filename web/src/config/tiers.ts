import { getServerEnv } from "./env";

export type DemoTier = "mvp" | "demo-plus";
export type DemoMode = "live" | "staged";

export function getDemoTier(): DemoTier {
    return getServerEnv().DEMO_TIER;
}

export function getDemoMode(): DemoMode {
    return getServerEnv().DEMO_MODE;
}

/** True when the system should write to canonical ERC-8004 registries. */
export function isErc8004Enabled(): boolean {
    return getDemoTier() === "demo-plus";
}

/** True when paid endpoints should enforce x402 facilitator settlement. */
export function isX402FacilitatorEnabled(): boolean {
    return getDemoTier() === "demo-plus";
}

/** True when proof submission should fall back to pre-staged demo images. */
export function isStagedMode(): boolean {
    return getDemoMode() === "staged";
}
