import { startVolunteerLoop } from "./volunteer";
import { startVerifierLoop } from "./verifier";
import { VOLUNTEER_PERSONAS } from "./personas";
import type { AgentRunHandle } from "./types";
import { configuredAgents } from "@/lib/onchain/wallets";

let _handles: AgentRunHandle[] | null = null;

/** Start every agent loop that has a configured key. Idempotent. */
export function bootstrapAgents(baseUrl: string): AgentRunHandle[] {
    if (_handles) return _handles;
    const handles: AgentRunHandle[] = [];
    const configured = configuredAgents();

    for (const persona of VOLUNTEER_PERSONAS) {
        if (!configured[persona.label]) continue;
        handles.push(startVolunteerLoop(persona, baseUrl));
    }
    if (configured["verifier"]) handles.push(startVerifierLoop());

    _handles = handles;
    console.log(`[bootstrap] started ${handles.length} agent loops`);
    return handles;
}

export function activeAgents(): AgentRunHandle[] {
    return _handles ?? [];
}
