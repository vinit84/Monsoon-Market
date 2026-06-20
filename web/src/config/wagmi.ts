"use client";

import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { defineChain } from "viem";

// Local Anvil chain for mock testing
const anvil = defineChain({
    id: 31337,
    name: "Anvil Local",
    nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
    rpcUrls: { default: { http: ["http://127.0.0.1:8545"] } },
    testnet: true,
});

// Monad Testnet
const monadTestnet = defineChain({
    id: 10143,
    name: "Monad Testnet",
    nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
    rpcUrls: { default: { http: ["https://testnet-rpc.monad.xyz"] } },
    blockExplorers: { default: { name: "Monadscan", url: "https://testnet.monadscan.com" } },
    testnet: true,
});

export const config = getDefaultConfig({
    appName: "Monsoon Market",
    projectId: "3a8170812b534d0ff9d794f19a901d64", // Free WalletConnect Cloud project
    chains: [anvil, monadTestnet],
    ssr: true,
});

export { anvil, monadTestnet };
