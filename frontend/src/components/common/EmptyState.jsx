import * as React from "react"
import { cn } from "@/lib/utils"
import { FileText, Search, FolderOpen, Plus, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/Button"

const illustrations = {
  default: FolderOpen,
  "no-results": Search,
  "no-documents": FileText,
  error: AlertCircle,
}

export function EmptyState({
  icon,
  title = "No data found",
  description,
  action,
  actionLabel,
  illustration = "default",
  className,
}) {
  const Icon = icon || illustrations[illustration] || illustrations.default

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4 text-center",
        className
      )}
    >
      <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-sm mb-4">
          {description}
        </p>
      )}
      {action && (
        <Button onClick={action}>
          <Plus className="h-4 w-4 mr-2" />
          {actionLabel || "Create new"}
        </Button>
      )}
    </div>
  )
}

export default EmptyState;