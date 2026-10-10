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
          "bg-gradient-to-b from-blue-600 to-blue-600 text-white shadow-[0_8px_18px_-8px_rgba(37,99,235,0.5),inset_0_1px_0_rgba(255,255,255,0.18)] hover:from-blue-500 hover:to-blue-700",
        secondary: "bg-blue-400/15 text-blue-100 hover:bg-blue-400/25",
        outline:
          "border border-white/14 bg-white/[0.06] text-white shadow-sm hover:bg-white/10 hover:border-white/28",
        ghost: "text-blue-100 hover:bg-white/8",
        destructive:
          "bg-rose-600 text-white shadow-[0_8px_18px_-8px_rgba(190,18,60,0.55)] hover:bg-rose-500",
        link: "h-auto p-0 text-blue-300 underline-offset-4 hover:underline",
        soft: "border border-blue-400/25 bg-white/5 text-blue-300 hover:bg-blue-400/20",
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
