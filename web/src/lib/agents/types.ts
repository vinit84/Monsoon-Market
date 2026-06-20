import type { AgentLabel } from "@/lib/onchain/wallets";

export interface VolunteerPersona {
    label: Extract<AgentLabel, "volunteer-a" | "volunteer-b">;
    displayName: string;
    /** Multiplier applied to the cost of route + supply. > 1 = pricier than baseline. */
    pricingMarkup: number;
    /** Multiplier applied to ETA. < 1 = fast volunteer. */
    etaMultiplier: number;
    /** A short tagline for the agent roster card. */
    tagline: string;
}

export interface AgentRunHandle {
    label: AgentLabel;
    address: `0x${string}`;
    stop: () => void;
}
