import { defineChain, type Chain, http, createPublicClient, type PublicClient } from "viem";
import { getServerEnv } from "@/config/env";

/**
 * Monad testnet chain definition.
 * Wagmi/viem ships `monadTestnet` in `wagmi/chains` as of recent releases, but
 * we keep our own copy here so the project compiles even if upstream renames it.
 */
export function monadTestnet(): Chain {
    const env = getServerEnv();
    return defineChain({
        id: env.MONAD_TESTNET_CHAIN_ID,
        name: "Monad Testnet",
        nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
        rpcUrls: {
            default: { http: [env.MONAD_TESTNET_RPC_URL] },
        },
        blockExplorers: {
            default: { name: "Monadscan", url: env.MONAD_TESTNET_EXPLORER },
        },
        testnet: true,
    });
}

let _publicClient: PublicClient | null = null;

export function getPublicClient(): PublicClient {
    if (_publicClient) return _publicClient;
    const chain = monadTestnet();
    _publicClient = createPublicClient({
        chain,
        transport: http(),
    });
    return _publicClient;
}

/** Returns the canonical MonadVision-style explorer URL for a tx hash. */
export function explorerTxUrl(hash: `0x${string}`): string {
    return `${getServerEnv().MONAD_TESTNET_EXPLORER}/tx/${hash}`;
}

/** Returns the canonical block explorer URL for an address. */
export function explorerAddressUrl(address: `0x${string}`): string {
    return `${getServerEnv().MONAD_TESTNET_EXPLORER}/address/${address}`;
}
