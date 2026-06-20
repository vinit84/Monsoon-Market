import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merges Tailwind class lists with predictable conflict resolution. */
export function cn(...inputs: ClassValue[]): string {
    return twMerge(clsx(inputs));
}

/** Truncate a 0x-prefixed address for display. */
export function shortAddr(addr: string, head = 6, tail = 4): string {
    if (!addr.startsWith("0x") || addr.length < head + tail + 2) return addr;
    return `${addr.slice(0, head)}…${addr.slice(-tail)}`;
}

/** Format a wei BigInt as a MON-denominated decimal string. */
export function formatMon(wei: bigint, decimals = 4): string {
    const whole = wei / 10n ** 18n;
    const frac = wei % 10n ** 18n;
    const fracStr = frac.toString().padStart(18, "0").slice(0, decimals);
    return `${whole.toString()}.${fracStr}`;
}
