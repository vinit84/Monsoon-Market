import fs from "node:fs";
import path from "node:path";

/**
 * File-backed JSON store. Persists across server restarts.
 * Same shape as Supabase tables — easy to swap when scaling.
 */

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "db.json");

export interface User {
    email: string;
    passwordHash: string;
    name: string;
    role: "resident" | "volunteer";
    walletAddress?: string;
    createdAt: number;
}

export interface Volunteer {
    walletAddress: string;
    userEmail: string;
    displayName: string;
    phone?: string;
    serviceAreas: string[]; // location ids: andheri_e, dadar_w, etc.
    completedTasks: number;
    createdAt: number;
}

interface Db {
    users: User[];
    volunteers: Volunteer[];
}

let _db: Db | null = null;

function load(): Db {
    if (_db) return _db;
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(DB_PATH)) {
        _db = { users: [], volunteers: [] };
        save();
        return _db;
    }
    try {
        _db = JSON.parse(fs.readFileSync(DB_PATH, "utf8")) as Db;
        // Backfill missing fields for legacy records
        _db.users = (_db.users ?? []).map((u) => ({ ...u, role: u.role ?? "resident" }));
        _db.volunteers = _db.volunteers ?? [];
    } catch {
        _db = { users: [], volunteers: [] };
        save();
    }
    return _db!;
}

function save(): void {
    if (!_db) return;
    fs.writeFileSync(DB_PATH, JSON.stringify(_db, null, 2));
}

export const db = {
    // ----- users -----
    findUser(email: string): User | undefined {
        return load().users.find((u) => u.email === email.toLowerCase());
    },
    createUser(user: User): void {
        load().users.push({ ...user, email: user.email.toLowerCase() });
        save();
    },
    attachWallet(email: string, walletAddress: string): void {
        const u = load().users.find((u) => u.email === email.toLowerCase());
        if (u) {
            u.walletAddress = walletAddress.toLowerCase();
            save();
        }
    },

    // ----- volunteers -----
    findVolunteerByWallet(walletAddress: string): Volunteer | undefined {
        return load().volunteers.find(
            (v) => v.walletAddress.toLowerCase() === walletAddress.toLowerCase(),
        );
    },
    findVolunteerByEmail(email: string): Volunteer | undefined {
        return load().volunteers.find((v) => v.userEmail === email.toLowerCase());
    },
    listVolunteers(): Volunteer[] {
        return [...load().volunteers];
    },
    createVolunteer(v: Volunteer): Volunteer {
        const normalized: Volunteer = {
            ...v,
            walletAddress: v.walletAddress.toLowerCase(),
            userEmail: v.userEmail.toLowerCase(),
        };
        load().volunteers.push(normalized);
        save();
        return normalized;
    },
    incrementVolunteerTasks(walletAddress: string): void {
        const v = load().volunteers.find(
            (v) => v.walletAddress.toLowerCase() === walletAddress.toLowerCase(),
        );
        if (v) {
            v.completedTasks += 1;
            save();
        }
    },
};
