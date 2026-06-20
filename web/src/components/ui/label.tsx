import { type LabelHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
    return (
        <label
            className={cn("block text-[12px] font-medium text-[color:var(--color-text-secondary)] mb-1", className)}
            {...props}
        />
    );
}
