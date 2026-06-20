import { ConnectWallet } from "./connect-wallet";
import { UserMenu } from "./user-menu";

export function Topbar() {
    return (
        <header className="sk-topbar">
            <div>
                <div className="sk-topbar-title">Mumbai Field Response · Live Mandi</div>
                <div className="sk-topbar-sub">Autonomous agent marketplace · monsoon emergency relief</div>
            </div>
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 px-3 py-1.5 rounded border border-[color:var(--color-brass-dark)] bg-gradient-to-b from-[#fdf8ec] to-[var(--color-paper)] shadow-inner">
                    <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-ink-muted)]">
                        <span className="sk-led sk-led-green sk-led-pulse" /> MVP
                    </span>
                    <span className="w-px h-4 bg-[color:var(--color-paper-shadow)]" />
                    <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-ink-muted)]">
                        <span className="sk-led sk-led-amber" /> Staged
                    </span>
                </div>
                <ConnectWallet />
                <UserMenu />
            </div>
        </header>
    );
}
