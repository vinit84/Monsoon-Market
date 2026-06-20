import { type LabelHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
    return (
        <label
            className={cn(
                "block text-[10px] font-bold uppercase tracking-[0.12em] text-[color:var(--color-ink-muted)] mb-1.5",
                className,
            )}
            {...props}
        />
    );
}
