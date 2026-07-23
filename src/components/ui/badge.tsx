import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-[11px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-elevated text-primary shadow hover:bg-elevated/80",
        secondary:
          "border-transparent bg-subtle text-primary hover:bg-subtle/80",
        destructive:
          "border-transparent bg-accent-danger/15 text-accent-danger shadow hover:bg-accent-danger/25",
        outline: "border-subtle text-muted",
        success: "border-transparent bg-accent-success/15 text-accent-success hover:bg-accent-success/25",
        warning: "border-transparent bg-accent-warning/15 text-accent-warning hover:bg-accent-warning/25",
        premium: "border-accent/20 bg-accent/10 text-accent hover:bg-accent/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
