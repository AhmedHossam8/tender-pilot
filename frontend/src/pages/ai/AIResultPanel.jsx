import * as React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Badge,
} from "@/components/ui";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { LoadingSpinner, EmptyState } from "@/components/common";
import { AIProcessingBadge, AIRequestInfo } from "@/components/common/AIProcessingBadge";
import {
  useRegenerationHistory,
  useRegenerateResponse,
} from "@/hooks/useAI";
import {
  FileText,
  RotateCw,
  Download,
  Share2,
  ArrowLeft,
  Sparkles,
  AlertCircle,
  TrendingUp,
  Clock,
  DollarSign,
} from "lucide-react";
import { toast } from "sonner";

/**
 * AI Result Panel Page
 * Displays AI-generated results with analysis, history, and regeneration options
 */
function AIResultPanel() {
  const { t } = useTranslation();
  const { responseId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = React.useState("result");

  // Fetch regeneration history (includes the original response)
  const {
    data: history,
    isLoading,
    error,
    refetch,
  } = useRegenerationHistory(responseId);

  // Regenerate mutation
  const regenerateMutation = useRegenerateResponse();

  // Get current response (latest in history)
  const currentResponse = history?.history?.[0] || history?.current;
  const aiRequest = history?.request;

  const handleRegenerate = async () => {
    try {
      const result = await regenerateMutation.mutateAsync({
        responseId,
        payload: {
          reason: "User requested regeneration",
        },
      });
      toast.success(t("aiEngine.regenerateSuccess"));
      refetch();
    } catch (err) {
      toast.error(t("aiEngine.regenerateError"));
      console.error("Regeneration error:", err);
    }
  };

  const handleDownload = () => {
    if (!currentResponse?.content) return;

    const blob = new Blob([currentResponse.content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ai-result-${responseId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success(t("aiEngine.downloadSuccess"));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner text={t("common.loading")} />
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon={AlertCircle}
        title={t("aiEngine.loadError")}
        description={error.message}
        action={
          <Button onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("common.goBack")}
          </Button>
        }
      />
    );
  }

  if (!currentResponse) {
    return (
      <EmptyState
        icon={FileText}
        title={t("aiEngine.noResult")}
        description={t("aiEngine.noResultDescription")}
        action={
          <Button onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("common.goBack")}
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="p-0 h-auto"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">{t("aiEngine.resultPanel")}</h1>
          </div>
          <p className="text-muted-foreground">
            {aiRequest?.prompt_name || t("aiEngine.aiGeneratedResult")}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleDownload}
            disabled={!currentResponse?.content}
          >
            <Download className="h-4 w-4 mr-2" />
            {t("common.download")}
          </Button>
          <Button
            onClick={handleRegenerate}
            disabled={regenerateMutation.isPending}
          >
            {regenerateMutation.isPending ? (
              <LoadingSpinner className="h-4 w-4 mr-2" />
            ) : (
              <RotateCw className="h-4 w-4 mr-2" />
            )}
            {t("aiEngine.regenerate")}
          </Button>
        </div>
      </div>

      {/* Request Info Card */}
      {aiRequest && <AIRequestInfo request={aiRequest} />}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="result">
            <FileText className="h-4 w-4 mr-2" />
            {t("aiEngine.result")}
          </TabsTrigger>
          <TabsTrigger value="history">
            <Clock className="h-4 w-4 mr-2" />
            {t("aiEngine.history")}
            {history?.history?.length > 1 && (
              <Badge variant="secondary" className="ml-2">
                {history.history.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="metrics">
            <TrendingUp className="h-4 w-4 mr-2" />
            {t("aiEngine.metrics")}
          </TabsTrigger>
        </TabsList>

        {/* Result Tab */}
        <TabsContent value="result" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-purple-500" />
                    {t("aiEngine.generatedContent")}
                  </CardTitle>
                  <CardDescription>
                    {t("aiEngine.generatedAt")}:{" "}
                    {new Date(currentResponse.created_at).toLocaleString()}
                  </CardDescription>
                </div>
                {currentResponse.version > 1 && (
                  <Badge variant="secondary">
                    {t("aiEngine.version")} {currentResponse.version}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <pre className="whitespace-pre-wrap bg-muted p-4 rounded-lg text-sm">
                  {currentResponse.content}
                </pre>
              </div>

              {/* Metadata */}
              {currentResponse.metadata && (
                <div className="mt-4 pt-4 border-t">
                  <h4 className="text-sm font-semibold mb-2">
                    {t("aiEngine.metadata")}
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    {currentResponse.output_tokens && (
                      <div>
                        <span className="text-muted-foreground">
                          {t("aiEngine.outputTokens")}:
                        </span>
                        <p className="font-medium">
                          {currentResponse.output_tokens}
                        </p>
                      </div>
                    )}
                    {currentResponse.processing_time && (
                      <div>
                        <span className="text-muted-foreground">
                          {t("aiEngine.processingTime")}:
                        </span>
                        <p className="font-medium">
                          {currentResponse.processing_time}ms
                        </p>
                      </div>
                    )}
                    {currentResponse.confidence_score && (
                      <div>
                        <span className="text-muted-foreground">
                          {t("aiEngine.confidence")}:
                        </span>
                        <p className="font-medium">
                          {(currentResponse.confidence_score * 100).toFixed(1)}%
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("aiEngine.regenerationHistory")}</CardTitle>
              <CardDescription>
                {t("aiEngine.viewPreviousVersions")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {history?.history && history.history.length > 0 ? (
                <div className="space-y-4">
                  {history.history.map((item, index) => (
                    <div
                      key={item.id || index}
                      className="border rounded-lg p-4 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant={index === 0 ? "default" : "secondary"}>
                            {t("aiEngine.version")} {item.version || index + 1}
                          </Badge>
                          {index === 0 && (
                            <Badge variant="success">{t("common.current")}</Badge>
                          )}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {new Date(item.created_at).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-sm">
                        <p className="line-clamp-3 text-muted-foreground">
                          {item.content}
                        </p>
                      </div>
                      {item.regeneration_reason && (
                        <div className="text-xs text-muted-foreground">
                          {t("aiEngine.reason")}: {item.regeneration_reason}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Clock}
                  title={t("aiEngine.noHistory")}
                  description={t("aiEngine.noHistoryDescription")}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Metrics Tab */}
        <TabsContent value="metrics" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  {t("aiEngine.performance")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      {t("aiEngine.averageProcessingTime")}
                    </span>
                    <span className="font-medium">
                      {history?.metrics?.avg_processing_time
                        ? `${history.metrics.avg_processing_time}ms`
                        : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      {t("aiEngine.totalRegenerations")}
                    </span>
                    <span className="font-medium">
                      {history?.history?.length || 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  {t("aiEngine.costAnalysis")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      {t("aiEngine.totalTokens")}
                    </span>
                    <span className="font-medium">
                      {aiRequest?.input_tokens + currentResponse?.output_tokens ||
                        "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      {t("aiEngine.estimatedCost")}
                    </span>
                    <span className="font-medium">
                      {history?.metrics?.total_cost
                        ? `$${history.metrics.total_cost.toFixed(4)}`
                        : "N/A"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AIResultPanel;
