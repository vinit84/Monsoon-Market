import { type ButtonHTMLAttributes, type ReactNode, forwardRef } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "destructive" | "plain";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: Variant;
    children?: ReactNode;
}

const VARIANT_CLASSES: Record<Variant, string> = {
    primary: "sk-btn sk-btn-primary",
    secondary: "sk-btn sk-btn-secondary",
    destructive: "sk-btn sk-btn-destructive",
    plain: "sk-btn sk-btn-plain",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ variant = "primary", className, ...props }, ref) => (
        <button ref={ref} className={cn(VARIANT_CLASSES[variant], className)} {...props} />
    ),
);
Button.displayName = "Button";
