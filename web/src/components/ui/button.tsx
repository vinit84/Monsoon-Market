import { type ButtonHTMLAttributes, type ReactNode, forwardRef } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "destructive" | "plain";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: Variant;
    children?: ReactNode;
}

const VARIANT_CLASSES: Record<Variant, string> = {
    primary: "mm-button-primary",
    secondary: "mm-button-secondary",
    destructive: "mm-button-primary !bg-[var(--color-critical)] hover:!bg-[#a52209]",
    plain: "text-[var(--color-brand)] hover:underline px-2 py-1",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ variant = "primary", className, ...props }, ref) => (
        <button ref={ref} className={cn("inline-flex items-center justify-center min-h-[44px]", VARIANT_CLASSES[variant], className)} {...props} />
    ),
);
Button.displayName = "Button";
