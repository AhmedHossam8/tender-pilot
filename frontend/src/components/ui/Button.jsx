import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-white/5 text-white border border-white/20 backdrop-blur-sm shadow-sm hover:shadow-md hover:scale-105 hover:bg-white/10",
        destructive:
          "bg-red-500/20 text-red-400 border-red-400/20 backdrop-blur-sm shadow-sm hover:shadow-md hover:scale-105 hover:bg-red-500/30",
        outline:
          "bg-transparent text-white border border-white/30 backdrop-blur-sm hover:bg-white/5 hover:scale-105",
        secondary:
          "bg-blue-500/20 text-blue-400 border-blue-400/20 backdrop-blur-sm shadow-sm hover:shadow-md hover:scale-105 hover:bg-blue-500/30",
        ghost:
          "bg-transparent text-white hover:bg-white/5 hover:scale-105",
        link:
          "text-blue-400 underline-offset-4 hover:underline",
        success:
          "bg-green-500/20 text-green-400 border-green-400/20 backdrop-blur-sm shadow-sm hover:shadow-md hover:scale-105 hover:bg-green-500/30",
      },
      size: {
        default: "h-10 px-6 text-sm",
        sm: "h-8 px-4 text-xs",
        lg: "h-12 px-8 text-base",
        xl: "h-14 px-10 text-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const Button = React.forwardRef(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
