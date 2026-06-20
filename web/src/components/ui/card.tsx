import { type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={cn("mm-card", className)} {...props}>
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
        <div className={cn("flex items-start justify-between mb-4", className)} {...props}>
            <div>
                <h3 className="m-0">{title}</h3>
                {description && <p className="text-[color:var(--color-text-secondary)] mt-1">{description}</p>}
            </div>
            {action}
        </div>
    );
}
