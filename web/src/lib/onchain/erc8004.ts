import { getServerEnv } from "@/config/env";
import { isErc8004Enabled } from "@/config/tiers";
import { type WalletClient } from "viem";

/**
 * ERC-8004 Adapter — Demo-Plus tier only.
 * Wraps the canonical Identity and Reputation registries deployed at the same
 * addresses on Monad mainnet and testnet:
 *   Identity:   0x8004A169FB4a3325136EB29fA0ceB6D2e539a432
 *   Reputation: 0x8004BAa17C55a88189AE136b182e5fdA19dE9b63
 *
 * Implementations call the canonical registry contracts via viem. ABIs are
 * intentionally narrow — only the functions we need.
 *
 * If Demo-Plus is disabled (DEMO_TIER=mvp), every function in this module
 * resolves to a no-op so callers can invoke them unconditionally.
 */

export interface AgentCard {
    name: string;
    description: string;
    endpoint?: string;
    walletAddress: `0x${string}`;
}

export interface RegistrationResult {
    agent: `0x${string}`;
    tokenId: bigint | null;
    txHash: `0x${string}` | null;
    skipped: boolean;
    error?: string;
}

/** Register an agent with the Identity Registry. Returns the minted token ID. */
export async function registerAgent(
    _wallet: WalletClient,
    _card: AgentCard,
): Promise<RegistrationResult> {
    if (!isErc8004Enabled()) {
        return {
            agent: _card.walletAddress,
            tokenId: null,
            txHash: null,
            skipped: true,
        };
    }
    // TODO(monsoon-mandi): call IdentityRegistry.register with the ABI documented at
    //   https://docs.monad.xyz/guides/erc-8004
    // For the hackathon we'll discover the function selector at build time.
    throw new Error("registerAgent: not implemented yet — Demo-Plus tier task");
}

/** Read the local Identity NFT token ID owned by an agent (or null if none). */
export async function readAgentTokenId(_agent: `0x${string}`): Promise<bigint | null> {
    if (!isErc8004Enabled()) return null;
    throw new Error("readAgentTokenId: not implemented yet — Demo-Plus tier task");
}

/** Append a positive feedback entry to the Reputation Registry. */
export async function writePositiveFeedback(
    _wallet: WalletClient,
    _agent: `0x${string}`,
    _requestId: bigint,
): Promise<`0x${string}` | null> {
    if (!isErc8004Enabled()) return null;
    throw new Error("writePositiveFeedback: not implemented yet — Demo-Plus tier task");
}

/** Append a negative feedback entry to the Reputation Registry. */
export async function writeNegativeFeedback(
    _wallet: WalletClient,
    _agent: `0x${string}`,
    _requestId: bigint,
): Promise<`0x${string}` | null> {
    if (!isErc8004Enabled()) return null;
    throw new Error("writeNegativeFeedback: not implemented yet — Demo-Plus tier task");
}

export function explorerProfileUrl(agent: `0x${string}`): string {
    return `https://8004scan.io/agent/${agent}`;
}

export function registryAddresses(): { identity: `0x${string}`; reputation: `0x${string}` } {
    const env = getServerEnv();
    return {
        identity: env.IDENTITY_REGISTRY as `0x${string}`,
        reputation: env.REPUTATION_REGISTRY as `0x${string}`,
    };
}
