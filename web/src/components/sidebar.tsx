import Link from "next/link";

const NAV: { href: string; label: string }[] = [
    { href: "/", label: "Live Mandi" },
    { href: "/compose", label: "New Request" },
    { href: "/agents", label: "Agent Roster" },
    { href: "/history", label: "Request History" },
];

export function Sidebar({ pathname = "/" }: { pathname?: string }) {
    return (
        <aside
            className="hidden md:flex flex-col w-[240px] shrink-0 bg-[var(--color-sidebar-bg)] text-white"
            style={{ minHeight: "100vh" }}
        >
            <div className="px-5 py-6 border-b border-white/10">
                <div className="text-[20px] font-semibold leading-tight">Monsoon Mandi</div>
                <div className="text-[12px] text-white/60 mt-1">Agent economy on Monad</div>
            </div>
            <nav className="flex-1 py-4">
                {NAV.map((item) => {
                    const active = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`block px-5 py-2 text-[14px] ${active ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5 hover:text-white"}`}
                        >
                            {item.label}
                        </Link>
                    );
                })}
            </nav>
            <div className="px-5 py-4 border-t border-white/10 text-[12px] text-white/50">
                Monad testnet · Blitz V3
            </div>
        </aside>
    );
}
