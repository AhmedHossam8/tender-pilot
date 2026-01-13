import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold transition-all backdrop-blur-sm border border-white/10 shadow-sm hover:shadow-md hover:scale-105",
  {
    variants: {
      variant: {
        default:
          "bg-white/5 text-white border-white/20",
        secondary:
          "bg-blue-500/20 text-blue-400 border-blue-400/20",
        destructive:
          "bg-red-500/20 text-red-400 border-red-400/20",
        outline:
          "bg-transparent text-white border-white/30",
        success:
          "bg-green-500/20 text-green-400 border-green-400/20",
        // Status variants
        draft:
          "bg-yellow-500/20 text-yellow-400 border-yellow-400/20",
        "in-review":
          "bg-purple-500/20 text-purple-300 border-purple-300/20",
        approved:
          "bg-green-500/20 text-green-300 border-green-300/20",
        rejected:
          "bg-red-500/20 text-red-300 border-red-300/20",
        submitted:
          "bg-blue-500/20 text-blue-300 border-blue-300/20",
        pending:
          "bg-orange-500/20 text-orange-300 border-orange-300/20",
        confirmed:
          "bg-teal-500/20 text-teal-300 border-teal-300/20",
        completed:
          "bg-green-600/20 text-green-200 border-green-200/20",
        cancelled:
          "bg-red-600/20 text-red-200 border-red-200/20",
        open:
          "bg-blue-600/20 text-blue-200 border-blue-200/20",
        in_progress:
          "bg-purple-600/20 text-purple-200 border-purple-200/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function Badge({ className, variant, ...props }) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

// Status badge component
function StatusBadge({ status, className }) {
  const { t } = useTranslation();

  const statusConfig = {
    draft: { label: t("status.draft"), variant: "draft" },
    "in-review": { label: t("status.in-review"), variant: "in-review" },
    in_review: { label: t("status.in-review"), variant: "in-review" },
    approved: { label: t("status.approved"), variant: "approved" },
    rejected: { label: t("status.rejected"), variant: "rejected" },
    submitted: { label: t("status.submitted"), variant: "submitted" },
    pending: { label: t("status.pending"), variant: "pending" },
    confirmed: { label: t("status.confirmed"), variant: "confirmed" },
    completed: { label: t("status.completed"), variant: "completed" },
    cancelled: { label: t("status.cancelled"), variant: "cancelled" },
    open: { label: t("status.open"), variant: "open" },
    in_progress: { label: t("status.in_progress"), variant: "in_progress" },
  };

  const config = statusConfig[status?.toLowerCase()] || {
    label: status,
    variant: "default",
  };

  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}

export { Badge, badgeVariants, StatusBadge };