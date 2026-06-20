import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "success" | "warning" | "critical" | "info";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
    variant: BadgeVariant;
}

const CLASSES: Record<BadgeVariant, string> = {
    success: "mm-badge mm-badge-success",
    warning: "mm-badge mm-badge-warning",
    critical: "mm-badge mm-badge-critical",
    info: "mm-badge mm-badge-info",
};

export function Badge({ variant, className, ...props }: BadgeProps) {
    return <span className={cn(CLASSES[variant], className)} {...props} />;
}
