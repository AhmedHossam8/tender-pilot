import * as React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

/** Spinner size mappings */
const spinnerSizes = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
  xl: "h-12 w-12",
};

/** Loading Spinner Component */
function LoadingSpinner({ size = "md", className, text }) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-2", className)}>
      <Loader2 className={cn("animate-spin text-primary", spinnerSizes[size])} />
      {text && <p className="text-sm text-muted-foreground">{text}</p>}
    </div>
  );
}

/** Page Loader (for section loading) */
function PageLoader({ text }) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-center min-h-[300px]">
      <LoadingSpinner size="lg" text={text || t("loading")} />
    </div>
  );
}

/** Full Page Loader (overlay) */
function FullPageLoader({ text }) {
  const { t } = useTranslation();
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
      <LoadingSpinner size="xl" text={text || t("loading")} />
    </div>
  );
}

export { LoadingSpinner, PageLoader, FullPageLoader };
