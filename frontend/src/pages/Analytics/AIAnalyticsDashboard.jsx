import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { aiService } from '../../services/ai.service';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { Brain, TrendingUp, DollarSign, Users, Zap, Clock, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { LoadingSpinner } from '@/components/common';
import { AIAnalyticsSkeleton } from '@/components/common/LoadingSkeleton';
import { Button } from '@/components/ui';
import { toast } from 'sonner';

const AIAnalyticsDashboard = () => {
  const queryClient = useQueryClient();

  // Fetch analytics data
  const { data: usageData, isLoading: usageLoading, refetch: refetchUsage } = useQuery({
    queryKey: ['ai-analytics', 'usage'],
    queryFn: () => aiService.getUsageAnalytics(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: performanceData, isLoading: perfLoading, refetch: refetchPerformance } = useQuery({
    queryKey: ['ai-analytics', 'performance'],
    queryFn: () => aiService.getPerformanceMetrics(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: costsData, isLoading: costsLoading, refetch: refetchCosts } = useQuery({
    queryKey: ['ai-analytics', 'costs'],
    queryFn: () => aiService.getCostAnalytics(),
    staleTime: 5 * 60 * 1000,
  });

  const isLoading = usageLoading || perfLoading || costsLoading;

  // Handler for refreshing all analytics
  const handleRefreshAll = async () => {
    toast.info('Refreshing analytics...');
    await Promise.all([
      refetchUsage(),
      refetchPerformance(),
      refetchCosts()
    ]);
    toast.success('Analytics updated');
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <AIAnalyticsSkeleton />
      </div>
    );
  }

  // Extract metrics
  const usage = usageData?.data || {};
  const performance = performanceData?.data || {};
  const costs = costsData?.data || {};

  const stats = [
    {
      title: 'Total AI Requests',
      value: usage.total_requests || 0,
      icon: Brain,
      color: 'text-blue-600',
      bg: 'bg-blue-100 dark:bg-blue-900',
      change: usage.requests_change || '+0%',
    },
    {
      title: 'Success Rate',
      value: `${((usage.successful_requests / usage.total_requests) * 100 || 0).toFixed(1)}%`,
      icon: CheckCircle,
      color: 'text-green-600',
      bg: 'bg-green-100 dark:bg-green-900',
      change: usage.success_rate_change || '+0%',
    },
    {
      title: 'Avg Response Time',
      value: `${performance.avg_latency_ms || 0}ms`,
      icon: Zap,
      color: 'text-yellow-600',
      bg: 'bg-yellow-100 dark:bg-yellow-900',
      change: performance.latency_change || '-0%',
    },
    {
      title: 'API Cost (Platform)',
      value: `$${(costs.total_cost || 0).toFixed(2)}`,
      icon: DollarSign,
      color: 'text-purple-600',
      bg: 'bg-purple-100 dark:bg-purple-900',
      change: costs.cost_change || '+0%',
    },
  ];

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">AI Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor platform-wide AI usage, performance, and system health
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleRefreshAll}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh All
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <Card key={idx}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${stat.bg}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <span className="text-sm text-muted-foreground">{stat.change}</span>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Usage by Feature */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Usage by Feature
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {usage.by_feature && Object.entries(usage.by_feature).map(([feature, count]) => (
                <div key={feature} className="flex items-center justify-between">
                  <span className="text-sm capitalize">{feature.replace(/_/g, ' ')}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${(count / usage.total_requests) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold w-12 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">Fastest Response</span>
                </div>
                <span className="font-semibold">{performance.min_latency_ms || 0}ms</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-600" />
                  <span className="text-sm">Slowest Response</span>
                </div>
                <span className="font-semibold">{performance.max_latency_ms || 0}ms</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Successful Requests</span>
                </div>
                <span className="font-semibold">{usage.successful_requests || 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <span className="text-sm">Failed Requests</span>
                </div>
                <span className="font-semibold">{usage.failed_requests || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cost Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Cost Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {costs.by_service && Object.entries(costs.by_service).map(([service, cost]) => (
                <div key={service} className="flex items-center justify-between p-2">
                  <span className="text-sm capitalize">{service.replace(/_/g, ' ')}</span>
                  <span className="font-semibold">${cost.toFixed(4)}</span>
                </div>
              ))}
              <div className="pt-3 border-t flex items-center justify-between font-bold">
                <span>Total</span>
                <span>${(costs.total_cost || 0).toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              AI Features Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                <span className="text-sm">Bid Analysis</span>
                <span className="text-xs px-2 py-1 bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 rounded-full font-medium">
                  Active
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                <span className="text-sm">Smart Recommendations</span>
                <span className="text-xs px-2 py-1 bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 rounded-full font-medium">
                  Active
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                <span className="text-sm">Project Analysis</span>
                <span className="text-xs px-2 py-1 bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 rounded-full font-medium">
                  Active
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                <span className="text-sm">Real-time Suggestions</span>
                <span className="text-xs px-2 py-1 bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 rounded-full font-medium">
                  Limited
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Box */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <Brain className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold mb-1">About AI Analytics</h3>
              <p className="text-sm text-muted-foreground">
                These metrics track the performance and usage of AI features across the platform. 
                The data refreshes every 5 minutes and includes bid analysis, recommendations, 
                project analysis, and other AI-powered features. Monitor costs and performance 
                to ensure optimal AI utilization.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIAnalyticsDashboard;
