import { decodeEventLog, parseEther, type Hex } from "viem";
import { walletFor } from "./wallets";
import { writeEscrow } from "./escrow-client";
import { getPublicClient, explorerTxUrl } from "./chain";
import { monsoonMandiEscrowAbi } from "./escrow-abi";
import { getServerEnv } from "@/config/env";
import { pinJson } from "@/lib/ipfs/pin";
import { emitEvent, registerExternalRequest, type SimRequest } from "@/lib/sim/engine";

/**
 * On-chain orchestrator (hybrid mode).
 *
 * Posts a request to the deployed Monsoon Mandi escrow on Monad testnet so
 * the demo proves real on-chain write capability. The downstream agent flow
 * (volunteer bidding, close, proof, attestation) is intentionally left to
 * the in-memory simulator — see `runMockAgentFlowForExistingRequest` in the
 * sim engine — so Anil and Bina visually compete against each other in the
 * UI with persona-flavoured prices, even when all server EOAs share a
 * single private key.
 *
 * Required env vars for this path to fire:
 *   ESCROW_ADDRESS
 *   MONAD_TESTNET_RPC_URL, MONAD_TESTNET_CHAIN_ID
 *   RESIDENT_RELAYER_PK
 */

export interface PostRequestInput {
    category: string;
    description: string;
    location: string;
    bountyMon: number;
    requesterAddress: `0x${string}`;
}

export interface PostRequestResult {
    requestId: number;
    txHash: Hex;
    ipfsUri: string;
    explorerUrl: string;
    deadline: number; // ms timestamp
}

/**
 * Post the request on-chain via the resident-relayer wallet, wait for the
 * receipt, decode the requestId from the RequestPosted event, register the
 * resulting SimRequest in the sim engine, and emit a real RequestPosted
 * event into the shared SSE stream.
 */
export async function postRequestOnChain(input: PostRequestInput): Promise<PostRequestResult> {
    const env = getServerEnv();
    if (!env.ESCROW_ADDRESS) {
        throw new Error("ESCROW_ADDRESS is not set; cannot post on-chain");
    }

    // 1. Pin the request payload to IPFS (or get a deterministic mock URI).
    const ipfsUri = await pinJson(
        {
            category: input.category,
            description: input.description,
            location: input.location,
            bountyMon: input.bountyMon,
            requesterAddress: input.requesterAddress,
            createdAt: Date.now(),
        },
        `monsoon-request-${Date.now()}.json`,
    );

    // 2. Post on-chain via the resident-relayer wallet.
    const wallet = walletFor("resident-relayer");
    const escrow = writeEscrow(wallet);
    const bountyWei = parseEther(input.bountyMon.toString());

    const txHash = await escrow.write.postRequest([ipfsUri], {
        value: bountyWei,
        chain: wallet.chain,
        account: wallet.account!,
    });

    // 3. Wait for the receipt to extract requestId from the RequestPosted event.
    const client = getPublicClient();
    const receipt = await client.waitForTransactionReceipt({ hash: txHash });

    let requestId: bigint | null = null;
    let deadline: bigint = 0n;
    for (const log of receipt.logs) {
        try {
            const decoded = decodeEventLog({
                abi: monsoonMandiEscrowAbi,
                data: log.data,
                topics: log.topics,
            });
            if (decoded.eventName === "RequestPosted") {
                const args = decoded.args as unknown as { requestId: bigint; deadline: bigint };
                requestId = args.requestId;
                deadline = args.deadline;
                break;
            }
        } catch {
            // skip non-matching logs
        }
    }
    if (requestId === null) {
        throw new Error("postRequest tx mined but no RequestPosted log found");
    }

    const explorerUrl = explorerTxUrl(txHash);
    const reqIdNum = Number(requestId);

    // Register the request in the sim store so the UI + simulated tail can find it.
    const simReq: SimRequest = {
        id: reqIdNum,
        category: input.category,
        description: input.description,
        location: input.location,
        bountyMon: input.bountyMon,
        requesterAddress: input.requesterAddress,
        ipfsUri,
        state: "open",
        deadline: Number(deadline) * 1000,
        bids: [],
        createdAt: Date.now(),
    };
    registerExternalRequest(simReq);

    emitEvent({
        txHash,
        blockNumber: Number(receipt.blockNumber),
        eventName: "RequestPosted",
        actionLabel: "postRequest",
        actor: wallet.account!.address,
        requestId: String(reqIdNum),
        explorerUrl,
        details: `Bounty ${input.bountyMon} MON · ${input.location} · IPFS ${ipfsUri.slice(0, 24)}…`,
        payload: {
            bountyMon: input.bountyMon,
            category: input.category,
            location: input.location,
            description: input.description,
            deadline: Number(deadline) * 1000,
            ipfsUri,
            requesterAddress: input.requesterAddress,
        },
    });

    return {
        requestId: reqIdNum,
        txHash,
        ipfsUri,
        explorerUrl,
        deadline: Number(deadline) * 1000,
    };
}
