import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow",
        outline: "text-foreground",
        success:
          "border-transparent bg-accent text-accent-foreground",
        // Status variants
        draft:
          "border-transparent bg-status-draft text-white",
        "in-review":
          "border-transparent bg-status-in-review text-white",
        approved:
          "border-transparent bg-status-approved text-white",
        rejected:
          "border-transparent bg-status-rejected text-white",
        submitted:
          "border-transparent bg-status-submitted text-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({ className, variant, ...props }) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

// Status badge component
function StatusBadge({ status, className }) {
  const statusConfig = {
    draft: { label: "Draft", variant: "draft" },
    "in-review": { label: "In Review", variant: "in-review" },
    in_review: { label: "In Review", variant: "in-review" },
    approved: { label: "Approved", variant: "approved" },
    rejected: { label: "Rejected", variant: "rejected" },
    submitted: { label: "Submitted", variant: "submitted" },
  }

  const config = statusConfig[status?.toLowerCase()] || {
    label: status,
    variant: "default",
  }

  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  )
}

export { Badge, badgeVariants, StatusBadge }
