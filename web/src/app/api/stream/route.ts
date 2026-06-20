import { getTxStreamHub, type StreamEvent } from "@/lib/stream/tx-stream-hub";

/** Server-Sent Events feed of escrow contract events. */
export async function GET(): Promise<Response> {
    const hub = getTxStreamHub();
    const encoder = new TextEncoder();

    const stream = new ReadableStream<Uint8Array>({
        start(controller) {
            const send = (e: StreamEvent) => {
                const payload = JSON.stringify({
                    ...e,
                    raw: undefined, // strip raw to keep SSE small
                });
                controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
            };
            // Send heartbeat every 15 s so proxies don't close the connection.
            const heartbeat = setInterval(() => {
                controller.enqueue(encoder.encode(`: heartbeat\n\n`));
            }, 15_000);
            const unsubscribe = hub.subscribe(send);
            // Cleanup when the client disconnects.
            const cleanup = () => {
                clearInterval(heartbeat);
                unsubscribe();
            };
            // ReadableStream cancel handler is implemented by the caller via signal.
            // Wire it via `cancel` below.
            (this as unknown as { _cleanup?: () => void })._cleanup = cleanup;
        },
        cancel() {
            (this as unknown as { _cleanup?: () => void })._cleanup?.();
        },
    });

    return new Response(stream, {
        headers: {
            "content-type": "text/event-stream",
            "cache-control": "no-cache, no-transform",
            connection: "keep-alive",
        },
    });
}
