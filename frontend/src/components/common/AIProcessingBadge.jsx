import * as React from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { Loader2, CheckCircle2, XCircle, Clock, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui";

/**
 * AI Processing Status Badge Component
 * Displays the current status of AI processing operations
 * 
 * @param {Object} props
 * @param {string} props.status - Status: pending|processing|completed|failed|cancelled
 * @param {boolean} props.showIcon - Whether to show status icon
 * @param {boolean} props.animated - Whether to animate the badge
 * @param {string} props.className - Additional CSS classes
 */
export function AIProcessingBadge({ 
  status = "pending", 
  showIcon = true, 
  animated = true,
  className 
}) {
  const { t } = useTranslation();

  const statusConfig = {
    pending: {
      label: t("aiEngine.status.pending"),
      variant: "secondary",
      icon: Clock,
      iconClass: "text-gray-500",
    },
    processing: {
      label: t("aiEngine.status.processing"),
      variant: "default",
      icon: Loader2,
      iconClass: "text-blue-500 animate-spin",
    },
    completed: {
      label: t("aiEngine.status.completed"),
      variant: "success",
      icon: CheckCircle2,
      iconClass: "text-green-500",
    },
    failed: {
      label: t("aiEngine.status.failed"),
      variant: "destructive",
      icon: XCircle,
      iconClass: "text-red-500",
    },
    cancelled: {
      label: t("aiEngine.status.cancelled"),
      variant: "outline",
      icon: XCircle,
      iconClass: "text-gray-400",
    },
  };

  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;

  return (
    <Badge 
      variant={config.variant} 
      className={cn(
        "flex items-center gap-1.5",
        animated && status === "processing" && "animate-pulse",
        className
      )}
    >
      {showIcon && <Icon className={cn("h-3.5 w-3.5", config.iconClass)} />}
      <span>{config.label}</span>
    </Badge>
  );
}

/**
 * AI Request Info Card
 * Shows detailed information about an AI request
 */
export function AIRequestInfo({ request, className }) {
  const { t } = useTranslation();

  if (!request) return null;

  return (
    <div className={cn("rounded-lg border bg-card p-4 space-y-3", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-500" />
          <h3 className="font-semibold">{t("aiEngine.requestInfo")}</h3>
        </div>
        <AIProcessingBadge status={request.status} />
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <span className="text-muted-foreground">{t("aiEngine.model")}:</span>
          <p className="font-medium">{request.model || "N/A"}</p>
        </div>
        <div>
          <span className="text-muted-foreground">{t("aiEngine.provider")}:</span>
          <p className="font-medium">{request.provider || "N/A"}</p>
        </div>
        <div>
          <span className="text-muted-foreground">{t("aiEngine.tokensUsed")}:</span>
          <p className="font-medium">
            {request.input_tokens && request.output_tokens
              ? `${request.input_tokens + request.output_tokens}`
              : "N/A"}
          </p>
        </div>
        <div>
          <span className="text-muted-foreground">{t("aiEngine.cost")}:</span>
          <p className="font-medium">
            {request.cost ? `$${request.cost.toFixed(4)}` : "N/A"}
          </p>
        </div>
      </div>

      {request.error_message && (
        <div className="mt-3 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {request.error_message}
        </div>
      )}

      {request.created_at && (
        <div className="text-xs text-muted-foreground">
          {t("aiEngine.createdAt")}: {new Date(request.created_at).toLocaleString()}
        </div>
      )}
    </div>
  );
}

/**
 * AI Processing List Item
 * Shows a compact view of an AI processing item in a list
 */
export function AIProcessingListItem({ request, onClick, className }) {
  const { t } = useTranslation();

  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center justify-between p-3 rounded-md border hover:bg-accent/50 cursor-pointer transition-colors",
        className
      )}
    >
      <div className="flex items-center gap-3 flex-1">
        <Sparkles className="h-4 w-4 text-purple-500 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">
            {request.prompt_name || t("aiEngine.aiRequest")}
          </p>
          <p className="text-xs text-muted-foreground">
            {new Date(request.created_at).toLocaleString()}
          </p>
        </div>
      </div>
      <AIProcessingBadge status={request.status} showIcon={false} />
    </div>
  );
}
