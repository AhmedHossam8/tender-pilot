import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Activity,
  TrendingUp,
  DollarSign,
  Zap,
  Target,
  Clock,
  RefreshCw,
  Calendar
} from 'lucide-react';
import { MetricCard, LineChart, DonutChart, BarChart } from '@/components/charts';
import { LoadingSpinner } from '@/components/common';
import aiAnalyticsService from '@/services/aiAnalytics.service';
import { toast } from 'react-hot-toast';

/**
 * Enhanced AI Analytics Dashboard
 * Displays comprehensive AI usage metrics, costs, and performance
 */
const EnhancedAIDashboard = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState(30); // days
  
  // State for all analytics data
  const [usageStats, setUsageStats] = useState(null);
  const [matchAccuracy, setMatchAccuracy] = useState(null);
  const [costTrend, setCostTrend] = useState([]);
  const [featureUsage, setFeatureUsage] = useState(null);

  /**
   * Load all analytics data
   */
  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      // Parallel API calls for better performance
      const [stats, accuracy, costs, features] = await Promise.all([
        aiAnalyticsService.getUsageStats({ days: timeRange }),
        aiAnalyticsService.getMatchAccuracy(),
        aiAnalyticsService.getCostTrend(timeRange),
        aiAnalyticsService.getFeatureUsage(timeRange)
      ]);
      
      setUsageStats(stats.data);
      setMatchAccuracy(accuracy.data);
      setCostTrend(costs.data);
      setFeatureUsage(features.data);
      
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /**
   * Refresh data
   */
  const handleRefresh = () => {
    setRefreshing(true);
    loadAnalytics();
  };

  /**
   * Change time range
   */
  const handleTimeRangeChange = (days) => {
    setTimeRange(days);
  };

  // Load data on mount and when time range changes
  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="large" message="Loading analytics..." />
      </div>
    );
  }

  // Prepare chart data
  const costChartData = costTrend.map(item => ({
    label: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    value: item.total_cost
  }));

  const featureDonutData = featureUsage?.features?.map(f => ({
    label: f.feature,
    value: f.count
  })) || [];

  const featureBarData = featureUsage?.features?.slice(0, 6).map(f => ({
    label: f.feature.split('_').join(' '),
    value: f.count
  })) || [];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Activity className="h-8 w-8 text-purple-600" />
              AI Analytics Dashboard
            </h1>
            <p className="text-gray-600 mt-2">
              Monitor AI performance, costs, and usage patterns
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Time Range Selector */}
            <div className="flex items-center gap-2 bg-white rounded-lg shadow-sm p-1">
              <button
                onClick={() => handleTimeRangeChange(7)}
                className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                  timeRange === 7
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                7 Days
              </button>
              <button
                onClick={() => handleTimeRangeChange(30)}
                className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                  timeRange === 30
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                30 Days
              </button>
              <button
                onClick={() => handleTimeRangeChange(90)}
                className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                  timeRange === 90
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                90 Days
              </button>
            </div>
            
            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="text-sm font-medium">Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Total Requests"
          value={usageStats?.total_requests?.toLocaleString() || '0'}
          change={12}
          icon={Activity}
          color="blue"
        />
        
        <MetricCard
          title="Cache Hit Rate"
          value={usageStats?.cache_hit_rate?.toFixed(1) || '0'}
          change={5.3}
          icon={Zap}
          color="purple"
          suffix="%"
        />
        
        <MetricCard
          title="Total Cost"
          value={usageStats?.total_cost?.toFixed(2) || '0'}
          change={-8.2}
          icon={DollarSign}
          color="green"
          prefix="$"
        />
        
        <MetricCard
          title="Success Rate"
          value={usageStats?.success_rate?.toFixed(1) || '0'}
          change={2.1}
          icon={Target}
          color="green"
          suffix="%"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Cost Trend Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Cost Trend</h2>
            <DollarSign className="h-5 w-5 text-gray-400" />
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Daily AI API costs over the selected period
          </p>
          <LineChart data={costChartData} height={250} color="#10b981" />
        </div>

        {/* Match Accuracy */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Match Prediction Accuracy</h2>
            <Target className="h-5 w-5 text-gray-400" />
          </div>
          
          <div className="space-y-4">
            {/* Accuracy Rate */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Accuracy Rate</span>
                <span className="text-2xl font-bold text-gray-900">
                  {matchAccuracy?.accuracy_rate?.toFixed(1) || '0'}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${matchAccuracy?.accuracy_rate || 0}%` }}
                />
              </div>
            </div>

            {/* Precision */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Precision</span>
                <span className="text-lg font-semibold text-gray-900">
                  {matchAccuracy?.precision?.toFixed(1) || '0'}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${matchAccuracy?.precision || 0}%` }}
                />
              </div>
            </div>

            {/* Recall */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Recall</span>
                <span className="text-lg font-semibold text-gray-900">
                  {matchAccuracy?.recall?.toFixed(1) || '0'}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${matchAccuracy?.recall || 0}%` }}
                />
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {matchAccuracy?.total_predictions || 0}
                </div>
                <div className="text-xs text-gray-600">Total Predictions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {matchAccuracy?.correct_predictions || 0}
                </div>
                <div className="text-xs text-gray-600">Correct</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Feature Usage Donut */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Feature Usage Distribution</h2>
            <Zap className="h-5 w-5 text-gray-400" />
          </div>
          <p className="text-sm text-gray-600 mb-6">
            Breakdown of AI feature usage by request count
          </p>
          <DonutChart data={featureDonutData} size={200} />
        </div>

        {/* Feature Usage Bar */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Top Features</h2>
            <TrendingUp className="h-5 w-5 text-gray-400" />
          </div>
          <p className="text-sm text-gray-600 mb-6">
            Most frequently used AI features
          </p>
          <BarChart data={featureBarData} height={250} />
        </div>
      </div>

      {/* Performance Stats */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Performance Metrics</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Average Execution Time */}
          <div className="text-center">
            <Clock className="h-8 w-8 text-blue-600 mx-auto mb-3" />
            <div className="text-3xl font-bold text-gray-900">
              {usageStats?.avg_execution_time?.toFixed(2) || '0'}s
            </div>
            <div className="text-sm text-gray-600 mt-1">Avg Execution Time</div>
          </div>

          {/* Total Tokens */}
          <div className="text-center">
            <Zap className="h-8 w-8 text-purple-600 mx-auto mb-3" />
            <div className="text-3xl font-bold text-gray-900">
              {(usageStats?.total_tokens_used / 1000).toFixed(1) || '0'}K
            </div>
            <div className="text-sm text-gray-600 mt-1">Total Tokens Used</div>
          </div>

          {/* Confidence Score */}
          <div className="text-center">
            <Target className="h-8 w-8 text-green-600 mx-auto mb-3" />
            <div className="text-3xl font-bold text-gray-900">
              {(usageStats?.avg_confidence * 100)?.toFixed(1) || '0'}%
            </div>
            <div className="text-sm text-gray-600 mt-1">Avg Confidence</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedAIDashboard;
