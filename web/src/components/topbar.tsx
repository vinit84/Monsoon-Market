import { ConnectWallet } from "./connect-wallet";
import { UserMenu } from "./user-menu";

export function Topbar() {
    return (
        <header className="sk-topbar">
            <div>
                <div className="sk-topbar-title">Mumbai Field Response · Live Mandi</div>
                <div className="sk-topbar-sub">Autonomous agent marketplace · monsoon emergency relief</div>
            </div>
            <div className="flex items-center gap-3">
                <ConnectWallet />
                <UserMenu />
            </div>
        </header>
    );
}
