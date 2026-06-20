import { getPublicClient, explorerTxUrl } from "@/lib/onchain/chain";
import { ESCROW_EVENT_LABELS } from "@/lib/onchain/escrow-client";
import { getServerEnv } from "@/config/env";

export interface StreamEvent {
    txHash: `0x${string}`;
    blockNumber: number;
    eventName: string;
    actionLabel: string;
    actor?: `0x${string}`;
    requestId?: string;
    raw: Record<string, unknown>;
    explorerUrl: string;
    observedAt: number;
}

type Listener = (e: StreamEvent) => void;

/**
 * Tx Stream Hub. Polls the escrow contract for new events and broadcasts to
 * subscribed SSE connections. Single instance per process, lazily started.
 */
class TxStreamHubImpl {
    private listeners = new Set<Listener>();
    private lastBlock = 0n;
    private polling = false;
    private failures = 0;

    subscribe(l: Listener): () => void {
        this.listeners.add(l);
        this.start();
        return () => this.listeners.delete(l);
    }

    private start(): void {
        if (this.polling) return;
        this.polling = true;
        this.loop().catch((e) => {
            console.error("[tx-stream-hub] poll loop crashed:", e);
            this.polling = false;
        });
    }

    private async loop(): Promise<void> {
        const env = getServerEnv();
        if (!env.ESCROW_ADDRESS) {
            console.warn("[tx-stream-hub] ESCROW_ADDRESS unset; pausing polling");
            this.polling = false;
            return;
        }
        const client = getPublicClient();
        this.lastBlock = await client.getBlockNumber();

        while (this.polling) {
            await new Promise((r) => setTimeout(r, 1000));
            try {
                const head = await client.getBlockNumber();
                if (head <= this.lastBlock) continue;
                const rawLogs = await client.getLogs({
                    address: env.ESCROW_ADDRESS as `0x${string}`,
                    fromBlock: this.lastBlock + 1n,
                    toBlock: head,
                });
                // Parse each log against the abi; a malformed log silently skips.
                for (const raw of rawLogs) {
                    const log = raw as unknown as {
                        transactionHash: `0x${string}`;
                        blockNumber: bigint | null;
                        eventName?: string;
                        args?: Record<string, unknown>;
                    };
                    const eventName = log.eventName ?? "Other";
                    const event: StreamEvent = {
                        txHash: log.transactionHash,
                        blockNumber: Number(log.blockNumber ?? 0n),
                        eventName,
                        actionLabel: ESCROW_EVENT_LABELS[eventName] ?? eventName,
                        raw: log.args ?? {},
                        explorerUrl: explorerTxUrl(log.transactionHash),
                        observedAt: Date.now(),
                    };
                    const args = log.args ?? {};
                    if (typeof args.bidder === "string") event.actor = args.bidder as `0x${string}`;
                    if (typeof args.winner === "string") event.actor = args.winner as `0x${string}`;
                    if (typeof args.resident === "string") event.actor = args.resident as `0x${string}`;
                    if (typeof args.requestId === "bigint") event.requestId = args.requestId.toString();
                    for (const l of this.listeners) l(event);
                }
                this.lastBlock = head;
                this.failures = 0;
            } catch (e) {
                this.failures += 1;
                console.warn(`[tx-stream-hub] poll failed (${this.failures}/3):`, e);
            }
        }
    }

    failureCount(): number {
        return this.failures;
    }
}

let _instance: TxStreamHubImpl | null = null;
export function getTxStreamHub(): TxStreamHubImpl {
    if (!_instance) _instance = new TxStreamHubImpl();
    return _instance;
}
