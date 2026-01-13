import * as React from "react";
import { cn } from "@/lib/utils";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { useTranslation } from "react-i18next";

/**
 * ErrorBoundary Component
 * Catches JS errors in child components and displays a fallback UI
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
    // Optional: send to error tracking service
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return this.props.fallback ? (
        this.props.fallback
      ) : (
        <ErrorFallback
          error={this.state.error}
          onReset={this.handleReset}
          className={this.props.className}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * ErrorFallback Component
 * UI displayed when an error occurs
 */
function ErrorFallback({ error, onReset, className }) {
  const { t } = useTranslation();

  return (
    <div
      className={cn(
        "flex items-center justify-center min-h-[300px] p-4",
        className
      )}
    >
      <Card className="max-w-md w-full">
        <CardContent className="pt-6 flex flex-col items-center text-center gap-4">
          <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold">{t("somethingWentWrong")}</h3>
            <p className="text-sm text-muted-foreground">
              {error?.message || t("unexpectedError")}
            </p>
          </div>

          {onReset && (
            <Button onClick={onReset} variant="outline" className="mt-2">
              <RefreshCw className="h-4 w-4 mr-2" />
              {t("tryAgain")}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export { ErrorBoundary, ErrorFallback };
