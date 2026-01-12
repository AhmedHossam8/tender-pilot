import * as React from "react"
import { cn } from "@/lib/utils"
import { AlertTriangle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog"
import { Button } from "@/components/ui/Button"
import { useTranslation } from "react-i18next"

function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  variant = "default",
  loading = false,
  icon,
}) {
  const { t } = useTranslation()
  const Icon = icon || (variant === "destructive" ? AlertTriangle : null)

  const handleConfirm = async () => {
    if (onConfirm) {
      await onConfirm()
    }
    // Don't auto-close - let parent handle closing after async operation
  }

  const handleCancel = () => {
    if (loading) return // Prevent cancel during loading
    onCancel?.()
    onOpenChange?.(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-start gap-4">
            {Icon && (
              <div
                className={cn(
                  "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
                  variant === "destructive" ? "bg-destructive/10" : "bg-primary/10"
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5",
                    variant === "destructive" ? "text-destructive" : "text-primary"
                  )}
                />
              </div>
            )}
            <div>
              <DialogTitle>{title || t("areYouSure")}</DialogTitle>
              {description && (
                <DialogDescription className="mt-1">
                  {description}
                </DialogDescription>
              )}
            </div>
          </div>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={loading}>
            {cancelLabel || t("cancel")}
          </Button>
          <Button
            variant={variant}
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? t("loading") : confirmLabel || t("confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { ConfirmDialog }
