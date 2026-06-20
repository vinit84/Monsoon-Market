import { subscribe, getEvents, type SimEvent } from "@/lib/sim/engine";

/** Server-Sent Events feed of simulated agent events. */
export async function GET(): Promise<Response> {
    const encoder = new TextEncoder();
    let closed = false;
    let heartbeat: ReturnType<typeof setInterval> | null = null;
    let unsubscribe: (() => void) | null = null;

    const stream = new ReadableStream<Uint8Array>({
        start(controller) {
            // Replay existing events
            for (const e of getEvents()) {
                if (closed) return;
                try {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(e)}\n\n`));
                } catch { break; }
            }

            // Subscribe to new events
            unsubscribe = subscribe((e: SimEvent) => {
                if (closed) return;
                try {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(e)}\n\n`));
                } catch {
                    closed = true;
                }
            });

            // Heartbeat every 15s
            heartbeat = setInterval(() => {
                if (closed) {
                    if (heartbeat) clearInterval(heartbeat);
                    return;
                }
                try {
                    controller.enqueue(encoder.encode(`: heartbeat\n\n`));
                } catch {
                    closed = true;
                    if (heartbeat) clearInterval(heartbeat);
                }
            }, 15_000);
        },
        cancel() {
            closed = true;
            if (heartbeat) clearInterval(heartbeat);
            if (unsubscribe) unsubscribe();
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
