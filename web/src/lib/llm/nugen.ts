import { getServerEnv } from "@/config/env";

/**
 * Thin OpenAI-compatible client for Nugen. Nugen exposes an OpenAI-shape API at
 * `${NUGEN_BASE_URL}/v1/chat/completions`. If the upstream shape differs we
 * patch this single file.
 */

export interface VisionPart {
    kind: "image_url";
    url: string;
}

export interface NugenVisionRequest {
    prompt: string;
    images: VisionPart[];
    timeoutMs: number;
}

export interface NugenVisionResponse {
    raw: string;
    /** Parsed verdict: 'accepted' | 'rejected' | 'unknown'. */
    verdict: "accepted" | "rejected" | "unknown";
    confidence: number;
}

const RESPONSE_SCHEMA_HINT = `Reply with strict JSON of the form {"verdict":"accepted"|"rejected","confidence":0..1,"reason":"<one sentence>"}.`;

export async function nugenVisionVerdict(req: NugenVisionRequest): Promise<NugenVisionResponse> {
    const env = getServerEnv();
    if (!env.NUGEN_API_KEY) throw new Error("NUGEN_API_KEY not set");

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), req.timeoutMs);

    try {
        const res = await fetch(`${env.NUGEN_BASE_URL.replace(/\/$/u, "")}/api/v3/inference/chat/completions`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${env.NUGEN_API_KEY}`,
                "Content-Type": "application/json",
            },
            signal: controller.signal,
            body: JSON.stringify({
                model: env.NUGEN_VISION_MODEL,
                messages: [
                    {
                        role: "user",
                        content: [
                            { type: "text", text: req.prompt + "\n\n" + RESPONSE_SCHEMA_HINT },
                            ...req.images.map((img) => ({ type: "image_url", image_url: { url: img.url } })),
                        ],
                    },
                ],
                max_tokens: 200,
                temperature: 0,
            }),
        });
        if (!res.ok) {
            throw new Error(`Nugen ${res.status}: ${await res.text().catch(() => "<no body>")}`);
        }
        const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
        const raw = json.choices?.[0]?.message?.content ?? "";
        try {
            // Nugen sometimes wraps the JSON in markdown — strip it
            const cleaned = raw.replace(/^```json\s*/i, "").replace(/\s*```$/u, "").trim();
            const parsed = JSON.parse(cleaned) as { verdict?: string; confidence?: number };
            const verdict =
                parsed.verdict === "accepted" || parsed.verdict === "rejected" ? parsed.verdict : "unknown";
            const confidence = typeof parsed.confidence === "number" ? parsed.confidence : 0;
            return { raw, verdict, confidence };
        } catch {
            return { raw, verdict: "unknown", confidence: 0 };
        }
    } finally {
        clearTimeout(timer);
    }
}
