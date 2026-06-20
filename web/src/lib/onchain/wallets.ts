import { privateKeyToAccount, type PrivateKeyAccount } from "viem/accounts";
import { createWalletClient, http, type WalletClient } from "viem";
import { monadTestnet } from "./chain";
import { getServerEnv } from "@/config/env";

export type AgentLabel =
    | "deployer"
    | "resident-relayer"
    | "volunteer-a"
    | "volunteer-b"
    | "supply"
    | "route"
    | "verifier";

const KEY_BY_LABEL: Record<AgentLabel, keyof ReturnType<typeof getServerEnv>> = {
    "deployer": "DEPLOYER_PK",
    "resident-relayer": "RESIDENT_RELAYER_PK",
    "volunteer-a": "VOLUNTEER_A_PK",
    "volunteer-b": "VOLUNTEER_B_PK",
    "supply": "SUPPLY_PK",
    "route": "ROUTE_PK",
    "verifier": "VERIFIER_PK",
};

export const ALL_AGENT_LABELS: AgentLabel[] = [
    "resident-relayer",
    "volunteer-a",
    "volunteer-b",
    "supply",
    "route",
    "verifier",
];

const _accountCache = new Map<AgentLabel, PrivateKeyAccount>();
const _clientCache = new Map<AgentLabel, WalletClient>();

/** Returns the viem account for a given agent. Throws if its key is unset. */
export function accountFor(label: AgentLabel): PrivateKeyAccount {
    const cached = _accountCache.get(label);
    if (cached) return cached;
    const env = getServerEnv();
    const pk = env[KEY_BY_LABEL[label]] as string | undefined;
    if (!pk) throw new Error(`Missing private key for agent '${label}' (${KEY_BY_LABEL[label]})`);
    const account = privateKeyToAccount(pk as `0x${string}`);
    _accountCache.set(label, account);
    return account;
}

/** Returns a viem WalletClient for the given agent label, configured for Monad testnet. */
export function walletFor(label: AgentLabel): WalletClient {
    const cached = _clientCache.get(label);
    if (cached) return cached;
    const account = accountFor(label);
    const client = createWalletClient({
        account,
        chain: monadTestnet(),
        transport: http(),
    });
    _clientCache.set(label, client);
    return client;
}

/** Map of agent label → on-chain address for currently configured agents. */
export function configuredAgents(): Partial<Record<AgentLabel, `0x${string}`>> {
    const out: Partial<Record<AgentLabel, `0x${string}`>> = {};
    for (const label of ALL_AGENT_LABELS) {
        try {
            out[label] = accountFor(label).address;
        } catch {
            // missing key — agent not configured this run
        }
    }
    return out;
}
