import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-lg border border-color-line bg-color-surface px-3 py-2 text-sm text-color-ink placeholder:text-color-ink-faint focus-visible:outline-none focus-visible:border-color-accent-rose focus-visible:ring-1 focus-visible:ring-color-accent-rose disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  )
);
Input.displayName = "Input";

export { Input };
