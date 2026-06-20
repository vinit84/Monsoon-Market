import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "success" | "warning" | "critical" | "info" | "brass";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
    variant: BadgeVariant;
}

const CLASSES: Record<BadgeVariant, string> = {
    success: "sk-badge sk-badge-success",
    warning: "sk-badge sk-badge-warning",
    critical: "sk-badge sk-badge-critical",
    info: "sk-badge sk-badge-info",
    brass: "sk-badge sk-badge-brass",
};

export function Badge({ variant, className, ...props }: BadgeProps) {
    return <span className={cn(CLASSES[variant], className)} {...props} />;
}
