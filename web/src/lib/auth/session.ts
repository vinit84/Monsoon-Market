import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";

export interface SessionUser {
    email: string;
    name: string;
    walletAddress?: string;
}

export interface SessionData {
    user?: SessionUser;
}

const SESSION_PASSWORD =
    process.env.SESSION_PASSWORD ?? "monsoon-mandi-hackathon-secret-key-do-not-use-in-prod-32chars-min";

export const sessionOptions: SessionOptions = {
    password: SESSION_PASSWORD,
    cookieName: "monsoon_mandi_session",
    cookieOptions: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
    },
};

export async function getSession() {
    const cookieStore = await cookies();
    return getIronSession<SessionData>(cookieStore, sessionOptions);
}

// In-memory user store. Replace with Supabase/Postgres in production.
interface StoredUser {
    email: string;
    passwordHash: string;
    name: string;
    walletAddress?: string;
    createdAt: number;
}

const _users = new Map<string, StoredUser>();

// Pre-seed a demo user
seedDemoUser();
function seedDemoUser() {
    if (_users.has("demo@monsoon.local")) return;
    _users.set("demo@monsoon.local", {
        email: "demo@monsoon.local",
        passwordHash: hashPassword("demo1234"),
        name: "Demo Resident",
        createdAt: Date.now(),
    });
}

// Simple password hashing — for hackathon demo only.
// In production use bcrypt/argon2.
function hashPassword(password: string): string {
    let h = 5381;
    for (let i = 0; i < password.length; i++) {
        h = (h * 33) ^ password.charCodeAt(i);
    }
    return `h_${(h >>> 0).toString(16)}_${password.length}`;
}

export function userExists(email: string): boolean {
    return _users.has(email.toLowerCase());
}

export function createUser(email: string, password: string, name: string): SessionUser {
    const key = email.toLowerCase();
    if (_users.has(key)) throw new Error("User already exists");
    if (password.length < 6) throw new Error("Password must be at least 6 characters");
    _users.set(key, { email: key, passwordHash: hashPassword(password), name, createdAt: Date.now() });
    return { email: key, name };
}

export function verifyUser(email: string, password: string): SessionUser | null {
    const u = _users.get(email.toLowerCase());
    if (!u) return null;
    if (u.passwordHash !== hashPassword(password)) return null;
    return { email: u.email, name: u.name, walletAddress: u.walletAddress };
}

export function attachWallet(email: string, walletAddress: string): void {
    const u = _users.get(email.toLowerCase());
    if (u) u.walletAddress = walletAddress;
}
