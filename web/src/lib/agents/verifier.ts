import { walletFor, accountFor } from "@/lib/onchain/wallets";
import { writeEscrow } from "@/lib/onchain/escrow-client";
import { getPublicClient } from "@/lib/onchain/chain";
import { monsoonMandiEscrowAbi } from "@/lib/onchain/escrow-abi";
import { verifyProof } from "@/lib/llm/vision-verifier";
import { ipfsToHttps } from "@/lib/ipfs/pin";
import type { AgentRunHandle } from "./types";
import { getServerEnv } from "@/config/env";

export function startVerifierLoop(): AgentRunHandle {
    const account = accountFor("verifier");
    const env = getServerEnv();
    if (!env.ESCROW_ADDRESS) {
        console.warn("[verifier] ESCROW_ADDRESS unset; loop dormant");
        return { label: "verifier", address: account.address, stop: () => {} };
    }

    const unwatch = getPublicClient().watchContractEvent({
        address: env.ESCROW_ADDRESS as `0x${string}`,
        abi: monsoonMandiEscrowAbi,
        eventName: "ProofSubmitted",
        onLogs: async (logs) => {
            for (const log of logs) {
                try {
                    await onProofSubmitted(log as unknown as { args?: Record<string, unknown> });
                } catch (e) {
                    console.warn("[verifier] attestation failed:", e);
                }
            }
        },
    });

    return { label: "verifier", address: account.address, stop: () => unwatch() };
}

async function onProofSubmitted(log: { args?: Record<string, unknown> }): Promise<void> {
    const args = log.args ?? {};
    const requestId = args.requestId as bigint;
    const proofIpfsUri = args.proofIpfsUri as string;
    const proofUrl = ipfsToHttps(proofIpfsUri);

    const result = await verifyProof({
        proofImageUrl: proofUrl,
        requestSummary: `Monsoon Mandi delivery proof for request #${requestId}`,
    });
    console.log(`[verifier] verdict ${result.verdict} (source=${result.source})`);

    const wallet = walletFor("verifier");
    const escrow = writeEscrow(wallet);
    await escrow.write.submitAttestation([requestId, result.verdict === "accepted"], {
        chain: wallet.chain,
        account: wallet.account!,
    });
}
