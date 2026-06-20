"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@/hooks/use-user";

interface NavItem {
    href: string;
    label: string;
    icon: string;
    /** "any" = visible to everyone (signed-in or not). "resident" / "volunteer" = role-gated. */
    visibleTo: "any" | "resident" | "volunteer";
}

const NAV: NavItem[] = [
    { href: "/", label: "Live Market", icon: "◉", visibleTo: "any" },
    { href: "/compose", label: "New Request", icon: "✚", visibleTo: "resident" },
    { href: "/volunteer/dashboard", label: "Volunteer Hub", icon: "🤝", visibleTo: "volunteer" },
    { href: "/agents", label: "Agent Roster", icon: "❖", visibleTo: "any" },
    { href: "/history", label: "Request History", icon: "≡", visibleTo: "any" },
];

export function Sidebar() {
    const pathname = usePathname() ?? "/";
    const { user } = useUser();

    const items = NAV.filter((item) => {
        if (item.visibleTo === "any") return true;
        // Hide role-specific items entirely for anonymous users — they can sign up via the topbar buttons.
        if (!user) return false;
        return item.visibleTo === user.role;
    });

    return (
        <aside className="hidden md:flex flex-col w-[260px] shrink-0 sk-sidebar" style={{ minHeight: "100vh" }}>
            <div className="sk-sidebar-brand">
                <div className="sk-sidebar-brand-title">Monsoon Market</div>
                <div className="sk-sidebar-brand-sub">Agent Economy · Monad</div>
            </div>
            <nav className="flex-1 py-4">
                {items.map((item) => {
                    const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                    return (
                        <Link key={item.href} href={item.href} className={`sk-sidebar-link ${active ? "active" : ""}`}>
                            <span className="inline-block w-5 mr-2 opacity-70">{item.icon}</span>
                            {item.label}
                        </Link>
                    );
                })}
            </nav>
            <div className="sk-sidebar-footer">
                <div className="flex items-center gap-2">
                    <span className="sk-led sk-led-green sk-led-pulse" />
                    <span>Monad testnet · Blitz V3</span>
                </div>
            </div>
        </aside>
    );
}
