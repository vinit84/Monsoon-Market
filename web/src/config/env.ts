import { z } from "zod";

/**
 * Strict, typed environment loader. Server-only — do not import from client code.
 * Public, browser-safe values must use `NEXT_PUBLIC_` prefix and be exposed
 * separately via `publicEnv`.
 */

const HexAddress = z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/u, "expected 0x-prefixed 20-byte address");

const HexPrivateKey = z
    .string()
    .regex(/^0x[a-fA-F0-9]{64}$/u, "expected 0x-prefixed 32-byte private key");

const Tier = z.enum(["mvp", "demo-plus"]).default("mvp");
const Mode = z.enum(["live", "staged"]).default("staged");

const ServerEnvSchema = z.object({
    DEMO_TIER: Tier,
    DEMO_MODE: Mode,

    MONAD_TESTNET_RPC_URL: z.string().url().default("https://testnet-rpc.monad.xyz"),
    MONAD_TESTNET_CHAIN_ID: z.coerce.number().int().positive().default(10143),
    MONAD_TESTNET_EXPLORER: z.string().url().default("https://testnet.monadscan.com"),

    ESCROW_ADDRESS: HexAddress.optional(),
    IDENTITY_REGISTRY: HexAddress.default("0x8004A169FB4a3325136EB29fA0ceB6D2e539a432"),
    REPUTATION_REGISTRY: HexAddress.default("0x8004BAa17C55a88189AE136b182e5fdA19dE9b63"),
    X402_FACILITATOR_URL: z.string().url().default("https://x402-facilitator.molandak.org"),

    DEPLOYER_PK: HexPrivateKey.optional(),
    RESIDENT_RELAYER_PK: HexPrivateKey.optional(),
    VOLUNTEER_A_PK: HexPrivateKey.optional(),
    VOLUNTEER_B_PK: HexPrivateKey.optional(),
    SUPPLY_PK: HexPrivateKey.optional(),
    ROUTE_PK: HexPrivateKey.optional(),
    VERIFIER_PK: HexPrivateKey.optional(),

    VERIFIER_ADDRESS: HexAddress.optional(),
    SLASH_RECIPIENT: HexAddress.optional(),

    NUGEN_API_KEY: z.string().optional(),
    NUGEN_BASE_URL: z.string().url().default("https://api.nugen.in/v1"),
    NUGEN_VISION_MODEL: z.string().default("nugen-vision-default"),
    OPENAI_API_KEY: z.string().optional(),
    OPENAI_VISION_MODEL: z.string().default("gpt-4o-mini"),

    IPFS_API_TOKEN: z.string().optional(),

    PARA_ENV: z.enum(["BETA", "PRODUCTION"]).default("BETA"),
});

const PublicEnvSchema = z.object({
    NEXT_PUBLIC_PARA_API_KEY: z.string().optional(),
});

export type ServerEnv = z.infer<typeof ServerEnvSchema>;
export type PublicEnv = z.infer<typeof PublicEnvSchema>;

let _serverEnv: ServerEnv | null = null;

/** Lazily parses and caches process.env. Call only from server code. */
export function getServerEnv(): ServerEnv {
    if (_serverEnv) return _serverEnv;
    const parsed = ServerEnvSchema.safeParse(process.env);
    if (!parsed.success) {
        const issues = parsed.error.issues
            .map((i) => `  ${i.path.join(".")}: ${i.message}`)
            .join("\n");
        throw new Error(`Invalid environment configuration:\n${issues}`);
    }
    _serverEnv = parsed.data;
    return _serverEnv;
}

/** Browser-safe public env values. */
export function getPublicEnv(): PublicEnv {
    return PublicEnvSchema.parse({
        NEXT_PUBLIC_PARA_API_KEY: process.env.NEXT_PUBLIC_PARA_API_KEY,
    });
}
