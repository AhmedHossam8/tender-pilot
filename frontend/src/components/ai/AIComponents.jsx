import React from 'react';
import { Badge, Card, CardContent } from '@/components/ui';
import { Sparkles, TrendingUp, AlertCircle, CheckCircle2, Lightbulb } from 'lucide-react';
import { useTranslation } from "react-i18next";

/**
 * AI Complexity Badge
 * Shows the AI-determined complexity of a project
 */
export const AIComplexityBadge = ({ complexity }) => {
  const { t } = useTranslation();
  if (!complexity) return null;

  const config = {
    low: { color: 'bg-green-100 text-green-800 border-green-300', icon: CheckCircle2 },
    medium: { color: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: AlertCircle },
    high: { color: 'bg-red-100 text-red-800 border-red-300', icon: TrendingUp },
  };

  const { color, icon: Icon } = config[complexity] || config.medium;

  return (
    <Badge className={`${color} border flex items-center gap-1`}>
      <Icon className="h-3 w-3" />
      {t(complexity, { context: 'complexity' })} {t('Complexity')}
    </Badge>
  );
};

/**
 * AI Match Score Display
 * Shows the AI match score for a bid (0-100)
 */
export const AIMatchScore = ({ score, size = 'md', showLabel = true }) => {
  const { t } = useTranslation();
  if (score === null || score === undefined) return null;

  const getColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 60) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (score >= 40) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const sizeClasses = {
    sm: 'text-sm px-2 py-1',
    md: 'text-base px-3 py-1.5',
    lg: 'text-lg px-4 py-2',
  };

  return (
    <div className={`inline-flex items-center gap-2 rounded-full border-2 ${getColor(score)} ${sizeClasses[size]} font-semibold`}>
      <Sparkles className="h-4 w-4" />
      <span>{Math.round(score)}</span>
      {showLabel && <span className="text-xs opacity-75">{t('Match')}</span>}
    </div>
  );
};

/**
 * AI Summary Card
 * Displays AI-generated project summary
 */
export const AISummaryCard = ({ summary, complexity, className = '' }) => {
  const { t } = useTranslation();
  if (!summary && !complexity) return null;

  return (
    <Card className={`border-l-4 border-l-blue-500 ${className}`}>
      <CardContent className="pt-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Sparkles className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm text-gray-700 mb-2 flex items-center gap-2">
              {t('AI Analysis')}
              {complexity && <AIComplexityBadge complexity={complexity} />}
            </h3>
            {summary && (
              <p className="text-gray-600 text-sm leading-relaxed">{summary}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * AI Feedback Display
 * Shows AI feedback for a bid (strengths, concerns, recommendation)
 */
export const AIFeedbackDisplay = ({ feedback, className = '' }) => {
  const { t } = useTranslation();
  if (!feedback) return null;

  const { strengths = [], concerns = [], recommendation = '' } = feedback;

  return (
    <Card className={`border-l-4 border-l-purple-500 ${className}`}>
      <CardContent className="pt-4 space-y-4">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-purple-600" />
          <h3 className="font-semibold text-gray-900">{t('AI Insights')}</h3>
        </div>

        {strengths.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-green-700 mb-2">{t('Strengths')}</h4>
            <ul className="space-y-1">
              {strengths.map((strength, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {concerns.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-orange-700 mb-2">{t('Areas for Improvement')}</h4>
            <ul className="space-y-1">
              {concerns.map((concern, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                  <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                  <span>{concern}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {recommendation && (
          <div className="bg-purple-50 rounded-lg p-3">
            <p className="text-sm text-purple-900">
              <strong>{t('Recommendation')}:</strong> {recommendation}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * AI Processing Indicator
 * Shows when AI is analyzing something
 */
export const AIProcessingIndicator = ({ text }) => {
  const { t } = useTranslation();
  const defaultText = t('aiIsAnalyzing');
  return (
    <div className="flex items-center gap-2 text-blue-600 animate-pulse">
      <Sparkles className="h-4 w-4 animate-spin" />
      <span className="text-sm">{text || defaultText}</span>
    </div>
  );
};
