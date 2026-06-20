import { getServerEnv } from "@/config/env";
import type { NugenVisionRequest, NugenVisionResponse } from "./nugen";

/** OpenAI-compatible fallback when Nugen is unreachable. Same return shape. */
export async function openaiVisionVerdict(req: NugenVisionRequest): Promise<NugenVisionResponse> {
    const env = getServerEnv();
    if (!env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY not set");

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), req.timeoutMs);

    try {
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${env.OPENAI_API_KEY}`,
                "Content-Type": "application/json",
            },
            signal: controller.signal,
            body: JSON.stringify({
                model: env.OPENAI_VISION_MODEL,
                messages: [
                    {
                        role: "system",
                        content:
                            'You verify whether a delivery proof photo plausibly shows the requested item delivered. Reply with strict JSON {"verdict":"accepted"|"rejected","confidence":0..1,"reason":"..."}.',
                    },
                    {
                        role: "user",
                        content: [
                            { type: "text", text: req.prompt },
                            ...req.images.map((img) => ({ type: "image_url", image_url: { url: img.url } })),
                        ],
                    },
                ],
                response_format: { type: "json_object" },
                temperature: 0,
            }),
        });
        if (!res.ok) throw new Error(`OpenAI ${res.status}`);
        const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
        const raw = json.choices?.[0]?.message?.content ?? "";
        try {
            const parsed = JSON.parse(raw) as { verdict?: string; confidence?: number };
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
