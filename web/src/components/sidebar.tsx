"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV: { href: string; label: string; icon: string }[] = [
    { href: "/", label: "Live Mandi", icon: "◉" },
    { href: "/compose", label: "New Request", icon: "✚" },
    { href: "/agents", label: "Agent Roster", icon: "❖" },
    { href: "/history", label: "Request History", icon: "≡" },
];

export function Sidebar() {
    const pathname = usePathname() ?? "/";
    return (
        <aside className="hidden md:flex flex-col w-[260px] shrink-0 sk-sidebar" style={{ minHeight: "100vh" }}>
            <div className="sk-sidebar-brand">
                <div className="sk-sidebar-brand-title">Monsoon Mandi</div>
                <div className="sk-sidebar-brand-sub">Agent Economy · Monad</div>
            </div>
            <nav className="flex-1 py-4">
                {NAV.map((item) => {
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
