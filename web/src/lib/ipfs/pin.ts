import { getServerEnv } from "@/config/env";

/**
 * IPFS Pinner — single-call wrapper over web3.storage's HTTP API. Given a
 * payload (JSON object or a Buffer/Blob), returns an `ipfs://...` URI.
 *
 * For the hackathon we keep this minimal. If web3.storage is rate-limited or
 * down, callers should fall back to the deterministic mock URIs documented
 * inline below.
 */

const W3S_UPLOAD_URL = "https://api.web3.storage/upload";

export async function pinJson(value: unknown, name = "monsoon-mandi-payload.json"): Promise<string> {
    const env = getServerEnv();
    if (!env.IPFS_API_TOKEN) {
        // Demo-mode fallback: return a deterministic ipfs:// URI derived from a
        // hash of the payload. The link won't resolve but downstream code can
        // still record it on-chain and the UI can display it.
        const json = JSON.stringify(value);
        const fakeCid = `bafymock${Buffer.from(json).toString("hex").slice(0, 24)}`;
        return `ipfs://${fakeCid}/${name}`;
    }

    const blob = new Blob([JSON.stringify(value)], { type: "application/json" });
    const file = new File([blob], name, { type: "application/json" });
    const form = new FormData();
    form.append("file", file);

    const res = await fetch(W3S_UPLOAD_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${env.IPFS_API_TOKEN}` },
        body: form,
    });
    if (!res.ok) throw new Error(`IPFS pin failed: ${res.status} ${await res.text().catch(() => "")}`);
    const json = (await res.json()) as { cid?: string };
    if (!json.cid) throw new Error("IPFS pin returned no CID");
    return `ipfs://${json.cid}/${name}`;
}

export async function pinImage(buffer: Buffer | ArrayBuffer, name: string, contentType = "image/jpeg"): Promise<string> {
    const env = getServerEnv();
    if (!env.IPFS_API_TOKEN) {
        const fakeCid = `bafymock${Date.now().toString(16)}`;
        return `ipfs://${fakeCid}/${name}`;
    }
    const u8 = buffer instanceof Buffer ? new Uint8Array(buffer) : new Uint8Array(buffer);
    const blob = new Blob([u8], { type: contentType });
    const file = new File([blob], name, { type: contentType });
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(W3S_UPLOAD_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${env.IPFS_API_TOKEN}` },
        body: form,
    });
    if (!res.ok) throw new Error(`IPFS pin failed: ${res.status}`);
    const json = (await res.json()) as { cid?: string };
    if (!json.cid) throw new Error("IPFS pin returned no CID");
    return `ipfs://${json.cid}/${name}`;
}

/** Convert an `ipfs://` URI to a public HTTPS gateway URL for vision LLM input. */
export function ipfsToHttps(uri: string): string {
    if (!uri.startsWith("ipfs://")) return uri;
    const path = uri.slice("ipfs://".length);
    return `https://ipfs.io/ipfs/${path}`;
}
