import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--kesari)/0.4)] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 transition-all duration-200 tracking-wide",
  {
    variants: {
      variant: {
        default:     "bg-[hsl(var(--kesari))] text-white border-2 border-[hsl(var(--kesari))] hover:bg-[hsl(var(--kesari-hover))] hover:border-[hsl(var(--kesari-hover))]",
        destructive: "bg-destructive text-white border-2 border-destructive hover:bg-destructive/90",
        outline:     "bg-transparent text-foreground border-2 border-foreground hover:bg-foreground hover:text-background",
        secondary:   "bg-transparent text-muted-foreground border-2 border-border hover:border-foreground hover:text-foreground",
        ghost:       "bg-transparent text-foreground border-2 border-transparent hover:border-border hover:bg-muted/50",
      },
      size: {
        default: "h-10 px-6 py-2",
        sm:      "h-8 px-4 text-xs",
        lg:      "h-12 px-8",
        icon:    "h-9 w-9",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  },
)
Button.displayName = "Button"

export { Button, buttonVariants }
