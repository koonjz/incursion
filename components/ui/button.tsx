import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium cursor-pointer select-none transition-[background-color,border-color,color,box-shadow,transform] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#070d20] disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-white text-zinc-950 font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.1),0_8px_20px_-6px_rgba(255,255,255,0.18)] hover:bg-zinc-100 border border-white/90 hover:scale-[1.01] active:scale-[0.98]",
        primary:
          "bg-white text-zinc-950 font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.1),0_8px_20px_-6px_rgba(255,255,255,0.18)] hover:bg-zinc-100 border border-white/90 hover:scale-[1.01] active:scale-[0.98]",
        secondary:
          "border border-white/12 bg-white/[0.07] text-zinc-100 hover:bg-white/[0.12] hover:border-white/25 shadow-sm active:scale-[0.98]",
        outline:
          "border border-white/16 bg-white/[0.04] text-zinc-200 shadow-sm hover:bg-white/[0.09] hover:border-white/30 hover:text-white active:scale-[0.98]",
        ghost: "text-zinc-300 hover:bg-white/[0.07] hover:text-white",
        destructive:
          "bg-rose-600 text-white shadow-[0_8px_18px_-8px_rgba(225,29,72,0.55)] hover:bg-rose-500 active:scale-[0.98]",
        link: "h-auto p-0 text-blue-400 underline-offset-4 hover:underline hover:text-blue-300",
        soft: "border border-blue-500/25 bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 active:scale-[0.98]",
      },
      size: {
        default: "h-10 px-4",
        sm: "h-9 px-3.5 text-[13px]",
        lg: "h-12 px-6 text-[15px]",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
