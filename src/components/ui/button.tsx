import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-all duration-150 ease-out focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer",
  {
    variants: {
      variant: {
        primary:
          "bg-[#163832] text-white shadow-sm hover:bg-[#1e4d42] active:bg-[#0f2420] active:scale-95 focus-visible:ring-2 focus-visible:ring-[#F5B83D] focus-visible:ring-offset-2",
        gold:
          "bg-[#F5B83D] text-[#14151A] hover:bg-[#e8a82a] hover:shadow-[0_4px_12px_rgba(245,184,61,0.4)] active:bg-[#d49920] active:scale-95 focus-visible:ring-2 focus-visible:ring-[#163832] focus-visible:ring-offset-2",
        secondary:
          "border border-[#E6E6E3] bg-transparent text-[#14151A] hover:border-[#163832] hover:bg-[#163832]/10 hover:text-[#163832] active:bg-[#163832]/20 active:scale-95 focus-visible:ring-2 focus-visible:ring-[#163832] focus-visible:ring-offset-2",
        ghost:
          "text-[#14151A] hover:text-[#163832] hover:underline hover:underline-offset-4 active:text-[#0f2420] hover:bg-transparent",
        danger:
          "bg-[#E0533D] text-white hover:bg-[#c93f2b] active:scale-95 focus-visible:ring-2 focus-visible:ring-[#E0533D]/50 focus-visible:ring-offset-2",
      },
      size: {
        default: "h-12 px-6 py-3",
        sm: "h-10 px-5 py-2.5 text-xs font-semibold",
        lg: "h-14 px-8 py-4 text-base font-semibold",
        icon: "h-10 w-10 p-0 rounded-full",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
