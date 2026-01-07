/**
 * ProfileCompletenessWidget Component
 * Visual indicator of profile completeness score with suggestions
 */
import { useTranslation } from 'react-i18next';
import { CheckCircle2, AlertCircle, TrendingUp } from 'lucide-react';

export default function ProfileCompletenessWidget({ 
  score = 0, 
  profile = null,
  showSuggestions = true,
  className = '' 
}) {
  const { t } = useTranslation();
  
  // Determine status based on score
  const getStatus = () => {
    if (score >= 90) return { label: t('profile.completeness.excellent', 'Excellent'), color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-100 dark:bg-green-900/20' };
    if (score >= 70) return { label: t('profile.completeness.good', 'Good'), color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-100 dark:bg-blue-900/20' };
    if (score >= 50) return { label: t('profile.completeness.fair', 'Fair'), color: 'text-yellow-600 dark:text-yellow-400', bgColor: 'bg-yellow-100 dark:bg-yellow-900/20' };
    return { label: t('profile.completeness.poor', 'Incomplete'), color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-100 dark:bg-red-900/20' };
  };
  
  const status = getStatus();
  
  // Generate improvement suggestions
  const getSuggestions = () => {
    if (!profile || !showSuggestions) return [];
    
    const suggestions = [];
    
    if (!profile.bio || profile.bio.length < 50) {
      suggestions.push({
        text: t('profile.suggestions.add_bio', 'Add a detailed bio (at least 50 characters)'),
        points: 15
      });
    }
    
    if (!profile.headline) {
      suggestions.push({
        text: t('profile.suggestions.add_headline', 'Add a professional headline'),
        points: 10
      });
    }
    
    if (!profile.skills || profile.skills.length === 0) {
      suggestions.push({
        text: t('profile.suggestions.add_skills', 'Add at least 3 skills'),
        points: 20
      });
    }
    
    if (!profile.avatar) {
      suggestions.push({
        text: t('profile.suggestions.add_avatar', 'Upload a profile photo'),
        points: 15
      });
    }
    
    if (!profile.location) {
      suggestions.push({
        text: t('profile.suggestions.add_location', 'Add your location'),
        points: 10
      });
    }
    
    if (!profile.languages || profile.languages.length === 0) {
      suggestions.push({
        text: t('profile.suggestions.add_languages', 'Specify languages you speak'),
        points: 10
      });
    }
    
    if (profile.user_type === 'provider' || profile.user_type === 'both') {
      if (!profile.hourly_rate) {
        suggestions.push({
          text: t('profile.suggestions.add_rate', 'Set your hourly rate'),
          points: 10
        });
      }
      
      if (!profile.portfolio_url) {
        suggestions.push({
          text: t('profile.suggestions.add_portfolio', 'Add portfolio URL'),
          points: 10
        });
      }
    }
    
    return suggestions.slice(0, 3); // Show top 3 suggestions
  };
  
  const suggestions = getSuggestions();
  
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {t('profile.completeness.title', 'Profile Completeness')}
        </h3>
        <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${status.bgColor} ${status.color}`}>
          {score >= 70 ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          {status.label}
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {t('profile.completeness.progress', 'Completion')}
          </span>
          <span className="text-2xl font-bold text-gray-900 dark:text-white">
            {score}%
          </span>
        </div>
        
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              score >= 90 ? 'bg-green-500' :
              score >= 70 ? 'bg-blue-500' :
              score >= 50 ? 'bg-yellow-500' :
              'bg-red-500'
            }`}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>
      
      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
            <TrendingUp className="w-4 h-4" />
            {t('profile.completeness.improve', 'Ways to Improve')}
          </div>
          
          {suggestions.map((suggestion, index) => (
            <div 
              key={index}
              className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
            >
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                  +{suggestion.points}
                </span>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                {suggestion.text}
              </p>
            </div>
          ))}
          
          {score < 100 && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              {t('profile.completeness.benefit', 'A complete profile gets 3x more visibility!')}
            </p>
          )}
        </div>
      )}
      
      {/* Perfect Score Message */}
      {score === 100 && (
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
            <p className="text-sm text-green-700 dark:text-green-300 font-medium">
              {t('profile.completeness.perfect', 'Your profile is 100% complete! Great job!')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
