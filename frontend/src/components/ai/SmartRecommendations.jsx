/**
 * Smart Recommendations Panel
 * 
 * Displays personalized, AI-powered recommendations based on user context
 */

import React from 'react';
import { Sparkles, TrendingUp, Target, Clock, DollarSign, Users, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export function SmartRecommendations({ recommendations = [], userType = 'provider' }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  if (!recommendations || recommendations.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-gray-500">
          <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>{t('noRecommendations')}</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-500" />
          {t('aiRecommendationsForYou')}
        </h3>
        <Badge variant="secondary" className="gap-1">
          <TrendingUp className="h-3 w-3" />
          {t('opportunities', { count: recommendations.length })}
        </Badge>
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        {recommendations.map((rec, index) => (
          <RecommendationCard
            key={index}
            recommendation={rec}
            onAction={() => navigate(`/projects/${rec.project.id}`)}
          />
        ))}
      </div>
    </div>
  );
}

function RecommendationCard({ recommendation, onAction }) {
  const { t } = useTranslation();
  const { project, match_type, match_percentage, matching_skills, reasons, confidence } = recommendation;
  
  const getMatchTypeColor = (type) => {
    switch (type) {
      case 'perfect': return 'bg-green-100 text-green-800 border-green-300';
      case 'good': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'budget': return 'bg-purple-100 text-purple-800 border-purple-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };
  
  const getConfidenceColor = (conf) => {
    if (conf >= 80) return 'text-green-600';
    if (conf >= 60) return 'text-yellow-600';
    return 'text-gray-600';
  };
  
  return (
    <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-purple-500">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="font-semibold text-lg">{project.title}</h4>
                <Badge className={`${getMatchTypeColor(match_type)} border`}>
                  {t('matchPercentage', { percentage: match_percentage })}
                </Badge>
              </div>
              <p className="text-sm text-gray-600 line-clamp-2">{project.description}</p>
            </div>
          </div>
          
          {/* Project Details */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <DetailBadge icon={DollarSign} label={t('budget')} value={`$${project.budget}`} />
            <DetailBadge icon={Users} label={t('bids')} value={project.bid_count} />
            <DetailBadge icon={Target} label={t('category')} value={project.category} />
            <DetailBadge 
              icon={Clock} 
              label={t('posted')} 
              value={formatDate(project.created_at, t)} 
            />
          </div>
          
          {/* Matching Skills */}
          {matching_skills && matching_skills.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {matching_skills.map((skill, idx) => (
                <Badge key={idx} variant="outline" className="bg-blue-50">
                  {skill}
                </Badge>
              ))}
            </div>
          )}
          
          {/* Reasons */}
          {reasons && reasons.length > 0 && (
            <div className="space-y-1 bg-purple-50 rounded-lg p-3">
              <p className="text-xs font-semibold text-purple-900 mb-2">{t('whyRecommended')}:</p>
              {reasons.map((reason, idx) => (
                <div key={idx} className="flex items-start gap-2 text-sm">
                  <Sparkles className="h-3 w-3 text-purple-500 mt-0.5 flex-shrink-0" />
                  <span className="text-purple-900">{reason}</span>
                </div>
              ))}
            </div>
          )}
          
          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">{t('confidence')}:</span>
              <span className={`text-sm font-bold ${getConfidenceColor(confidence)}`}>
                {confidence}%
              </span>
            </div>
            <Button onClick={onAction} className="gap-2">
              {t('viewProject')}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DetailBadge({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
      <Icon className="h-4 w-4 text-gray-500" />
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-semibold">{value}</p>
      </div>
    </div>
  );
}

function formatDate(dateString, t) {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return t('today');
  if (diffDays === 1) return t('yesterday');
  if (diffDays < 7) return t('daysAgo', { count: diffDays });
  return date.toLocaleDateString();
}

export default SmartRecommendations;
