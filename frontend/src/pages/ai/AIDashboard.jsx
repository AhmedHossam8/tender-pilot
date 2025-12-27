import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  StatCard,
  Badge,
  Button,
} from "@/components/ui";
import { LoadingSpinner, EmptyState } from "@/components/common";
import { AIProcessingBadge, AIProcessingListItem } from "@/components/common/AIProcessingBadge";
import {
  useUsageAnalytics,
  usePerformanceAnalytics,
  useCostAnalytics,
  useAIHealth,
} from "@/hooks/useAI";
import {
  Sparkles,
  TrendingUp,
  DollarSign,
  Zap,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Activity,
  BarChart3,
  RefreshCw,
} from "lucide-react";

/**
 * AI Dashboard Page
 * Comprehensive dashboard for AI engine monitoring and analytics
 */
function AIDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [dateRange, setDateRange] = React.useState({
    start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    end_date: new Date().toISOString().split("T")[0],
  });

  // Fetch AI health status
  const { data: health, isLoading: healthLoading } = useAIHealth();

  // Fetch usage analytics
  const {
    data: usageData,
    isLoading: usageLoading,
    refetch: refetchUsage,
  } = useUsageAnalytics(dateRange);

  // Fetch performance analytics
  const {
    data: performanceData,
    isLoading: performanceLoading,
  } = usePerformanceAnalytics(dateRange);

  // Fetch cost analytics
  const { data: costData, isLoading: costLoading } = useCostAnalytics(dateRange);

  const isLoading =
    healthLoading || usageLoading || performanceLoading || costLoading;

  // Extract data with safe defaults
  const summary = usageData?.summary || {};
  const recentRequests = usageData?.recent_requests || [];
  const performance = performanceData?.summary || {};
  const costs = costData?.summary || {};

  const handleRefresh = () => {
    refetchUsage();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-purple-500" />
            {t("aiEngine.dashboard")}
          </h1>
          <p className="text-muted-foreground">
            {t("aiEngine.dashboardDescription")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
            />
            {t("common.refresh")}
          </Button>
        </div>
      </div>

      {/* Health Status */}
      {health && (
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-semibold">{t("aiEngine.systemStatus")}</p>
                  <p className="text-sm text-muted-foreground">
                    {health.status === "healthy"
                      ? t("aiEngine.allSystemsOperational")
                      : t("aiEngine.systemIssues")}
                  </p>
                </div>
              </div>
              <Badge
                variant={health.status === "healthy" ? "success" : "destructive"}
              >
                {health.status}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-6">
              <LoadingSpinner />
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title={t("aiEngine.totalRequests")}
            value={summary.total_requests?.toLocaleString() || "0"}
            change={summary.request_growth}
            changeType={
              summary.request_growth > 0
                ? "increase"
                : summary.request_growth < 0
                ? "decrease"
                : undefined
            }
            icon={Activity}
          />
          <StatCard
            title={t("aiEngine.successRate")}
            value={
              summary.total_requests > 0
                ? `${(
                    (summary.successful_requests / summary.total_requests) *
                    100
                  ).toFixed(1)}%`
                : "0%"
            }
            icon={CheckCircle2}
          />
          <StatCard
            title={t("aiEngine.avgProcessingTime")}
            value={
              performance.avg_processing_time
                ? `${performance.avg_processing_time}ms`
                : "N/A"
            }
            icon={Clock}
          />
          <StatCard
            title={t("aiEngine.totalCost")}
            value={costs.total_cost ? `$${costs.total_cost.toFixed(2)}` : "$0.00"}
            change={costs.cost_trend}
            changeType={
              costs.cost_trend > 0
                ? "increase"
                : costs.cost_trend < 0
                ? "decrease"
                : undefined
            }
            icon={DollarSign}
          />
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent AI Requests */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              {t("aiEngine.recentRequests")}
            </CardTitle>
            <CardDescription>
              {t("aiEngine.recentRequestsDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentRequests.length > 0 ? (
              <div className="space-y-3">
                {recentRequests.slice(0, 5).map((request) => (
                  <AIProcessingListItem
                    key={request.id}
                    request={request}
                    onClick={() =>
                      request.response_id &&
                      navigate(`/ai/results/${request.response_id}`)
                    }
                  />
                ))}
                {recentRequests.length > 5 && (
                  <Button variant="link" className="w-full">
                    {t("common.viewAll")}
                  </Button>
                )}
              </div>
            ) : (
              <EmptyState
                icon={Activity}
                title={t("aiEngine.noRequests")}
                description={t("aiEngine.noRequestsDescription")}
              />
            )}
          </CardContent>
        </Card>

        {/* Usage by Provider */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              {t("aiEngine.usageByProvider")}
            </CardTitle>
            <CardDescription>
              {t("aiEngine.providerDistribution")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {usageData?.breakdown_by_provider &&
            usageData.breakdown_by_provider.length > 0 ? (
              <div className="space-y-4">
                {usageData.breakdown_by_provider.map((provider, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{provider.provider}</span>
                      <span className="text-muted-foreground">
                        {provider.request_count} {t("aiEngine.requests")}
                      </span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{
                          width: `${
                            (provider.request_count / summary.total_requests) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={BarChart3}
                title={t("aiEngine.noData")}
                description={t("aiEngine.noDataDescription")}
              />
            )}
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              {t("aiEngine.performanceMetrics")}
            </CardTitle>
            <CardDescription>
              {t("aiEngine.performanceDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  {t("aiEngine.fastestRequest")}
                </span>
                <span className="font-medium">
                  {performance.min_processing_time
                    ? `${performance.min_processing_time}ms`
                    : "N/A"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  {t("aiEngine.slowestRequest")}
                </span>
                <span className="font-medium">
                  {performance.max_processing_time
                    ? `${performance.max_processing_time}ms`
                    : "N/A"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  {t("aiEngine.averageRequest")}
                </span>
                <span className="font-medium">
                  {performance.avg_processing_time
                    ? `${performance.avg_processing_time}ms`
                    : "N/A"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  {t("aiEngine.totalProcessingTime")}
                </span>
                <span className="font-medium">
                  {performance.total_processing_time
                    ? `${(performance.total_processing_time / 1000).toFixed(2)}s`
                    : "N/A"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cost Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              {t("aiEngine.costBreakdown")}
            </CardTitle>
            <CardDescription>
              {t("aiEngine.costDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  {t("aiEngine.totalTokens")}
                </span>
                <span className="font-medium">
                  {summary.total_tokens?.toLocaleString() || "0"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  {t("aiEngine.inputTokens")}
                </span>
                <span className="font-medium">
                  {summary.total_input_tokens?.toLocaleString() || "0"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  {t("aiEngine.outputTokens")}
                </span>
                <span className="font-medium">
                  {summary.total_output_tokens?.toLocaleString() || "0"}
                </span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t">
                <span className="text-sm font-semibold">
                  {t("aiEngine.estimatedTotal")}
                </span>
                <span className="font-bold text-lg">
                  {costs.total_cost ? `$${costs.total_cost.toFixed(4)}` : "$0.00"}
                </span>
              </div>
              {costs.daily_average && (
                <div className="text-xs text-muted-foreground text-center">
                  {t("aiEngine.dailyAverage")}: ${costs.daily_average.toFixed(4)}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Failed Requests Alert */}
      {summary.failed_requests > 0 && (
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <div>
                <p className="font-semibold">{t("aiEngine.failedRequests")}</p>
                <p className="text-sm text-muted-foreground">
                  {summary.failed_requests} {t("aiEngine.requestsFailed")} (
                  {summary.total_requests > 0
                    ? (
                        (summary.failed_requests / summary.total_requests) *
                        100
                      ).toFixed(1)
                    : 0}
                  %)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default AIDashboard;
