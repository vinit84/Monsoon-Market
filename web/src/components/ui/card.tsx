import { type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={cn("sk-card", className)} {...props}>
            <span className="sk-rivet" style={{ top: 8, left: 8 }} aria-hidden />
            <span className="sk-rivet" style={{ top: 8, right: 8 }} aria-hidden />
            <span className="sk-rivet" style={{ bottom: 8, left: 8 }} aria-hidden />
            <span className="sk-rivet" style={{ bottom: 8, right: 8 }} aria-hidden />
            {children}
        </div>
    );
}

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
    title: string;
    description?: ReactNode;
    action?: ReactNode;
}

export function CardHeader({ title, description, action, className, ...props }: CardHeaderProps) {
    return (
        <>
            <div className={cn("flex items-start justify-between mb-3 pl-4", className)} {...props}>
                <div>
                    <h3 className="sk-card-title">{title}</h3>
                    {description && <p className="sk-card-desc">{description}</p>}
                </div>
                {action}
            </div>
            <div className="sk-card-divider" />
        </>
    );
}
