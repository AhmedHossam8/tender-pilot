/**
 * AI Match Score Component
 * 
 * Displays an AI-calculated match score with visual indicators.
 * Used to show how well a provider matches a project.
 * 
 * Features:
 * - Color-coded score display (red/yellow/blue/green)
 * - Progress bar visualization
 * - Recommendation badge
 * - Optional detailed feedback display
 * - Responsive design
 * 
 * Usage:
 * <AIMatchScore 
 *   score={85} 
 *   recommendation="Strong Match"
 *   showDetails={true}
 *   feedback={aiFeedbackObject}
 * />
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

const AIMatchScore = ({ 
  score, 
  recommendation, 
  showDetails = false, 
  feedback = null,
  size = 'medium' // 'small', 'medium', 'large'
}) => {
  const { t } = useTranslation();
  const [detailsOpen, setDetailsOpen] = useState(false);

  /**
   * Get color class based on score value.
   * Higher scores = better colors (green)
   * Lower scores = warning colors (yellow/red)
   */
  const getScoreColor = (score) => {
    if (score >= 80) return {
      text: 'text-green-600',
      bg: 'bg-green-100',
      bar: 'bg-green-600',
      border: 'border-green-300'
    };
    if (score >= 60) return {
      text: 'text-blue-600',
      bg: 'bg-blue-100',
      bar: 'bg-blue-600',
      border: 'border-blue-300'
    };
    if (score >= 40) return {
      text: 'text-yellow-600',
      bg: 'bg-yellow-100',
      bar: 'bg-yellow-600',
      border: 'border-yellow-300'
    };
    return {
      text: 'text-red-600',
      bg: 'bg-red-100',
      bar: 'bg-red-600',
      border: 'border-red-300'
    };
  };

  /**
   * Get recommendation badge color.
   */
  const getRecommendationColor = (rec) => {
    const recLower = rec?.toLowerCase() || '';
    if (recLower.includes('strong')) return 'bg-green-100 text-green-800';
    if (recLower.includes('good')) return 'bg-blue-100 text-blue-800';
    if (recLower.includes('fair')) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  /**
   * Get size-specific classes for different component sizes.
   */
  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return {
          scoreText: 'text-2xl',
          maxText: 'text-base',
          barHeight: 'h-2',
          badge: 'text-xs px-2 py-1'
        };
      case 'large':
        return {
          scoreText: 'text-6xl',
          maxText: 'text-3xl',
          barHeight: 'h-6',
          badge: 'text-base px-4 py-2'
        };
      default: // medium
        return {
          scoreText: 'text-4xl',
          maxText: 'text-2xl',
          barHeight: 'h-4',
          badge: 'text-sm px-3 py-1'
        };
    }
  };

  const colors = getScoreColor(score);
  const sizeClasses = getSizeClasses();

  return (
    <div className="ai-match-score">
      {/* Main Score Display */}
      <div className="flex items-center gap-4 mb-3">
        {/* Large Score Number */}
        <div className={`${colors.text} ${sizeClasses.scoreText} font-bold`}>
          {score}
          <span className={`${sizeClasses.maxText} text-gray-500`}>/100</span>
        </div>

        {/* Progress Bar */}
        <div className="flex-1">
          <div className={`w-full bg-gray-200 rounded-full ${sizeClasses.barHeight}`}>
            <div
              className={`${colors.bar} ${sizeClasses.barHeight} rounded-full transition-all duration-500`}
              style={{ width: `${score}%` }}
            />
          </div>
          
          {/* Recommendation Badge */}
          {recommendation && (
            <div className="mt-2">
              <span className={`${getRecommendationColor(recommendation)} ${sizeClasses.badge} rounded-full font-medium inline-block`}>
                {recommendation}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* AI Icon Badge */}
      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
        </svg>
        <span>{t('ai.matchScore')}</span>
      </div>

      {/* Detailed Feedback (Optional) */}
      {showDetails && feedback && Object.keys(feedback).length > 0 && (
        <div className="mt-4">
          <button
            onClick={() => setDetailsOpen(!detailsOpen)}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium text-sm"
          >
            {detailsOpen ? t('ai.hideDetails') : t('ai.showDetails')}
            <svg
              className={`w-4 h-4 transition-transform ${detailsOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {detailsOpen && (
            <div className={`mt-3 p-4 ${colors.bg} ${colors.border} border rounded-lg space-y-3`}>
              {/* Reasoning - Always show this first if available */}
              {feedback.reasoning && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">{t('ai.analysis')}</h4>
                  <p className="text-sm text-gray-700 italic">{feedback.reasoning}</p>
                </div>
              )}
              
              {/* Matching Skills */}
              {feedback.matching_skills && feedback.matching_skills.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">{t('ai.matchingSkills')}</h4>
                  <div className="flex flex-wrap gap-2">
                    {feedback.matching_skills.map((skill, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-white rounded text-xs font-medium text-gray-700"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Skill Gaps */}
              {feedback.skill_gaps && feedback.skill_gaps.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">{t('ai.skillGaps')}</h4>
                  <div className="flex flex-wrap gap-2">
                    {feedback.skill_gaps.map((skill, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-red-50 border border-red-200 rounded text-xs font-medium text-red-700"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Budget Assessment */}
              {feedback.budget_assessment && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">{t('ai.budgetAssessment')}</h4>
                  <p className="text-sm text-gray-700">{feedback.budget_assessment}</p>
                </div>
              )}

              {/* Experience Assessment */}
              {feedback.experience_assessment && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">{t('ai.experienceLevel')}</h4>
                  <p className="text-sm text-gray-700">{feedback.experience_assessment}</p>
                </div>
              )}

              {/* Concerns */}
              {feedback.potential_concerns && feedback.potential_concerns.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">{t('ai.potentialConcerns')}</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {feedback.potential_concerns.map((concern, index) => (
                      <li key={index} className="text-sm text-gray-700">{concern}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AIMatchScore;
