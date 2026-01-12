/**
 * AI Analytics Dashboard - Visual Analytics for AI Insights
 * 
 * Displays comprehensive visual analytics including:
 * - Success probability gauge
 * - Competitive positioning radar
 * - Bid strength breakdown
 * - Market trends
 */

import React from 'react';
import { TrendingUp, Target, Award, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useTranslation } from "react-i18next";

export function AIAnalyticsDashboard({ analysisData, bidData }) {
  const { t } = useTranslation();
  const {
    overall_strength = 75,
    dimensions = {},
    win_probability = 70,
    market_insights = {},
    suggestions = []
  } = analysisData || {};
  
  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          icon={Target}
          label={t("winProbability")}
          value={`${win_probability}%`}
          trend={win_probability >= 70 ? 'high' : win_probability >= 50 ? 'medium' : 'low'}
          color="blue"
        />
        <StatCard
          icon={Award}
          label={t("overallStrength")}
          value={`${overall_strength}/100`}
          trend={overall_strength >= 80 ? 'high' : overall_strength >= 60 ? 'medium' : 'low'}
          color="purple"
        />
        <StatCard
          icon={TrendingUp}
          label={t("marketPosition")}
          value={market_insights.market_position || 'Competitive'}
          trend="medium"
          color="green"
        />
      </div>
      
      {/* Bid Strength Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>{t("bidStrengthAnalysis")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <DimensionBar
              label={t("pricingCompetitiveness")}
              score={dimensions.pricing?.score || 0}
              status={dimensions.pricing?.status}
              message={dimensions.pricing?.message}
            />
            <DimensionBar
              label={t("timelineFeasibility")}
              score={dimensions.timeline?.score || 0}
              status={dimensions.timeline?.status}
              message={dimensions.timeline?.message}
            />
            <DimensionBar
              label={t("contentQuality")}
              score={dimensions.content_quality?.score || 0}
              status={dimensions.content_quality?.status}
              message={dimensions.content_quality?.message}
            />
            <DimensionBar
              label={t("competitivePosition")}
              score={dimensions.competitive_position?.score || 0}
              status={dimensions.competitive_position?.status}
              message={dimensions.competitive_position?.message}
            />
          </div>
        </CardContent>
      </Card>
      
      {/* Success Factors */}
      <Card>
        <CardHeader>
          <CardTitle>{t("successFactors")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Strengths */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                {t("strengths")}
              </h4>
              <div className="space-y-2">
                {[
                  t("competitivePricing"),
                  t("strongSkillMatch"),
                  t("realisticTimeline"),
                  t("qualityProposalContent")
                ].map((strength, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5" />
                    <span className="text-gray-700">{strength}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Improvement Areas */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                {t("opportunities")}
              </h4>
              <div className="space-y-2">
                {suggestions.map((suggestion, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1.5" />
                    <div>
                      <span className="text-gray-700">{suggestion.message}</span>
                      <p className="text-xs text-gray-500 mt-0.5">{suggestion.action}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Market Insights */}
      {market_insights && Object.keys(market_insights).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-500" />
              {t("marketIntelligence")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {market_insights.avg_winning_bid && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="text-xs text-gray-600">{t("averageWinningBid")}</div>
                  <div className="text-xl font-bold text-blue-700">
                    ${market_insights.avg_winning_bid.toFixed(0)}
                  </div>
                </div>
              )}
              {market_insights.avg_timeline && (
                <div className="p-3 bg-purple-50 rounded-lg">
                  <div className="text-xs text-gray-600">{t("averageTimeline")}</div>
                  <div className="text-xl font-bold text-purple-700">
                    {market_insights.avg_timeline} {t("days")}
                  </div>
                </div>
              )}
              {market_insights.competition_level && (
                <div className="p-3 bg-orange-50 rounded-lg">
                  <div className="text-xs text-gray-600">{t("competitionLevel")}</div>
                  <div className="text-xl font-bold text-orange-700 capitalize">
                    {market_insights.competition_level}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, trend, color }) {
  const { t } = useTranslation();
  const colors = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    green: 'bg-green-50 text-green-700 border-green-200',
  };
  
  const trendColors = {
    high: 'text-green-600',
    medium: 'text-yellow-600',
    low: 'text-red-600',
  };
  
  return (
    <Card className={`border-2 ${colors[color]}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-80">{label}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
          </div>
          <Icon className="h-8 w-8 opacity-50" />
        </div>
        <div className="mt-3 flex items-center gap-1">
          <TrendingUp className={`h-4 w-4 ${trendColors[trend]}`} />
          <span className={`text-xs font-medium ${trendColors[trend]}`}>
            {trend === 'high' ? t("excellent") : trend === 'medium' ? t("good") : t("needsWork")}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function DimensionBar({ label, score, status, message }) {
  const getColor = (score) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };
  
  const getStatusIcon = (status) => {
    if (status === 'excellent' || status === 'good') return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (status === 'fair' || status === 'medium') return <Info className="h-4 w-4 text-yellow-500" />;
    return <AlertTriangle className="h-4 w-4 text-red-500" />;
  };
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getStatusIcon(status)}
          <span className="text-sm font-medium">{label}</span>
        </div>
        <span className="text-sm font-bold">{score}/100</span>
      </div>
      <Progress value={score} className="h-2" indicatorClassName={getColor(score)} />
      {message && <p className="text-xs text-gray-600">{message}</p>}
    </div>
  );
}

export default AIAnalyticsDashboard;
