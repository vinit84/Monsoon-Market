import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";
import { db } from "@/lib/db/store";

export type UserRole = "resident" | "volunteer";

export interface SessionUser {
    email: string;
    name: string;
    role: UserRole;
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
        maxAge: 60 * 60 * 24 * 7,
    },
};

export async function getSession() {
    const cookieStore = await cookies();
    return getIronSession<SessionData>(cookieStore, sessionOptions);
}

// Pre-seed two demo users on first run.
seedDemoAccounts();
function seedDemoAccounts() {
    if (!db.findUser("resident@monsoon.local")) {
        db.createUser({
            email: "resident@monsoon.local",
            passwordHash: hashPassword("demo1234"),
            name: "Demo Resident",
            role: "resident",
            createdAt: Date.now(),
        });
    }
    if (!db.findUser("volunteer@monsoon.local")) {
        db.createUser({
            email: "volunteer@monsoon.local",
            passwordHash: hashPassword("demo1234"),
            name: "Demo Volunteer",
            role: "volunteer",
            createdAt: Date.now(),
        });
    }
    // Backfill: legacy demo@monsoon.local from earlier sessions
    if (!db.findUser("demo@monsoon.local")) {
        db.createUser({
            email: "demo@monsoon.local",
            passwordHash: hashPassword("demo1234"),
            name: "Demo Resident",
            role: "resident",
            createdAt: Date.now(),
        });
    }
}

function hashPassword(password: string): string {
    let h = 5381;
    for (let i = 0; i < password.length; i++) {
        h = (h * 33) ^ password.charCodeAt(i);
    }
    return `h_${(h >>> 0).toString(16)}_${password.length}`;
}

export function userExists(email: string): boolean {
    return Boolean(db.findUser(email));
}

export interface CreateUserInput {
    email: string;
    password: string;
    name: string;
    role: UserRole;
    /** Required for volunteer role: connected wallet address */
    walletAddress?: string;
    /** Volunteer-only fields */
    volunteerFields?: {
        displayName: string;
        phone?: string;
        serviceAreas: string[];
    };
}

export function createUser(input: CreateUserInput): SessionUser {
    if (db.findUser(input.email)) throw new Error("User already exists");
    if (input.password.length < 6) throw new Error("Password must be at least 6 characters");

    if (input.role === "volunteer") {
        if (!input.walletAddress || !/^0x[a-fA-F0-9]{40}$/u.test(input.walletAddress)) {
            throw new Error("Wallet address required to register as a volunteer");
        }
        if (!input.volunteerFields?.displayName || input.volunteerFields.serviceAreas.length === 0) {
            throw new Error("Display name and at least one service area required");
        }
        if (db.findVolunteerByWallet(input.walletAddress)) {
            throw new Error("This wallet is already registered as a volunteer");
        }
    }

    db.createUser({
        email: input.email.toLowerCase(),
        passwordHash: hashPassword(input.password),
        name: input.name,
        role: input.role,
        walletAddress: input.walletAddress?.toLowerCase(),
        createdAt: Date.now(),
    });

    if (input.role === "volunteer" && input.walletAddress && input.volunteerFields) {
        db.createVolunteer({
            walletAddress: input.walletAddress,
            userEmail: input.email,
            displayName: input.volunteerFields.displayName,
            phone: input.volunteerFields.phone,
            serviceAreas: input.volunteerFields.serviceAreas,
            completedTasks: 0,
            createdAt: Date.now(),
        });
    }

    return {
        email: input.email.toLowerCase(),
        name: input.name,
        role: input.role,
        walletAddress: input.walletAddress?.toLowerCase(),
    };
}

export function verifyUser(email: string, password: string): SessionUser | null {
    const u = db.findUser(email);
    if (!u) return null;
    if (u.passwordHash !== hashPassword(password)) return null;
    return {
        email: u.email,
        name: u.name,
        role: u.role ?? "resident",
        walletAddress: u.walletAddress,
    };
}

export function attachWallet(email: string, walletAddress: string): void {
    db.attachWallet(email, walletAddress);
}
