/**
 * Real-Time Bid Optimizer
 * 
 * Provides live feedback and suggestions as users create/edit bids
 */

import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, Info, TrendingUp, Zap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export function RealTimeBidOptimizer({ bidData, projectData, onSuggestionApply }) {
  const [suggestions, setSuggestions] = useState([]);
  const [overallScore, setOverallScore] = useState(70);
  
  useEffect(() => {
    // Analyze bid data and generate suggestions
    const newSuggestions = analyzeBid(bidData, projectData);
    setSuggestions(newSuggestions);
    
    // Calculate overall score
    const score = calculateOverallScore(bidData, projectData, newSuggestions);
    setOverallScore(score);
  }, [bidData, projectData]);
  
  const criticalSuggestions = suggestions.filter(s => s.priority === 'high');
  const mediumSuggestions = suggestions.filter(s => s.priority === 'medium');
  const infoSuggestions = suggestions.filter(s => s.priority === 'low');
  
  return (
    <div className="space-y-4">
      {/* Overall Score */}
      <Card className={`border-2 ${
        overallScore >= 80 ? 'border-green-500 bg-green-50' :
        overallScore >= 60 ? 'border-yellow-500 bg-yellow-50' :
        'border-red-500 bg-red-50'
      }`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Zap className={`h-5 w-5 ${
                overallScore >= 80 ? 'text-green-600' :
                overallScore >= 60 ? 'text-yellow-600' :
                'text-red-600'
              }`} />
              <span className="font-semibold">Bid Strength</span>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold">{overallScore}</span>
              <span className="text-sm text-gray-600">/100</span>
            </div>
          </div>
          <Progress value={overallScore} className="h-2" />
          <p className="text-xs text-gray-600 mt-2">
            {overallScore >= 80 && 'Excellent! Your bid is very competitive.'}
            {overallScore >= 60 && overallScore < 80 && 'Good bid, but there\'s room for improvement.'}
            {overallScore < 60 && 'Consider the suggestions below to strengthen your bid.'}
          </p>
        </CardContent>
      </Card>
      
      {/* Suggestions List */}
      {suggestions.length > 0 && (
        <div className="space-y-3">
          {criticalSuggestions.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-red-700 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Critical ({criticalSuggestions.length})
              </h4>
              {criticalSuggestions.map((suggestion, idx) => (
                <SuggestionCard
                  key={idx}
                  suggestion={suggestion}
                  onApply={() => onSuggestionApply?.(suggestion)}
                />
              ))}
            </div>
          )}
          
          {mediumSuggestions.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-yellow-700 flex items-center gap-2">
                <Info className="h-4 w-4" />
                Recommended ({mediumSuggestions.length})
              </h4>
              {mediumSuggestions.map((suggestion, idx) => (
                <SuggestionCard
                  key={idx}
                  suggestion={suggestion}
                  onApply={() => onSuggestionApply?.(suggestion)}
                />
              ))}
            </div>
          )}
          
          {infoSuggestions.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-blue-700 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Optional ({infoSuggestions.length})
              </h4>
              {infoSuggestions.map((suggestion, idx) => (
                <SuggestionCard
                  key={idx}
                  suggestion={suggestion}
                  onApply={() => onSuggestionApply?.(suggestion)}
                />
              ))}
            </div>
          )}
        </div>
      )}
      
      {suggestions.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
            <p className="text-sm font-medium">Looking good!</p>
            <p className="text-xs text-gray-500 mt-1">No suggestions at the moment</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function SuggestionCard({ suggestion, onApply }) {
  const { type, priority, message, suggestion: suggestionText, category } = suggestion;
  
  const getIcon = () => {
    switch (type) {
      case 'warning': return <AlertCircle className="h-4 w-4" />;
      case 'info': return <Info className="h-4 w-4" />;
      case 'tip': return <TrendingUp className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };
  
  const getColors = () => {
    switch (priority) {
      case 'high': return 'border-red-200 bg-red-50';
      case 'medium': return 'border-yellow-200 bg-yellow-50';
      case 'low': return 'border-blue-200 bg-blue-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };
  
  const getTextColor = () => {
    switch (priority) {
      case 'high': return 'text-red-700';
      case 'medium': return 'text-yellow-700';
      case 'low': return 'text-blue-700';
      default: return 'text-gray-700';
    }
  };
  
  return (
    <Card className={`border ${getColors()}`}>
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          <div className={`${getTextColor()} mt-0.5`}>
            {getIcon()}
          </div>
          <div className="flex-1 space-y-1">
            <p className={`text-sm font-medium ${getTextColor()}`}>{message}</p>
            <p className="text-xs text-gray-600">{suggestionText}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs px-2 py-0.5 bg-white rounded border">
                {category}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Helper functions
function analyzeBid(bidData, projectData) {
  const suggestions = [];
  const { proposed_amount, proposed_timeline, cover_letter } = bidData || {};
  const { budget } = projectData || {};
  
  // Pricing analysis
  if (proposed_amount && budget) {
    const ratio = proposed_amount / budget;
    if (ratio > 1.2) {
      suggestions.push({
        type: 'warning',
        category: 'pricing',
        priority: 'high',
        message: `Your bid is ${Math.round((ratio - 1) * 100)}% over budget`,
        suggestion: `Consider reducing to $${Math.round(budget * 1.05)} or provide strong justification`
      });
    } else if (ratio < 0.5) {
      suggestions.push({
        type: 'warning',
        category: 'pricing',
        priority: 'medium',
        message: 'Your bid seems unusually low',
        suggestion: 'This might raise quality concerns. Consider pricing closer to market rates.'
      });
    }
  }
  
  // Timeline analysis
  if (proposed_timeline) {
    if (proposed_timeline < 7) {
      suggestions.push({
        type: 'warning',
        category: 'timeline',
        priority: 'high',
        message: 'Very tight timeline',
        suggestion: 'Ensure you can realistically deliver. Consider adding buffer time.'
      });
    } else if (proposed_timeline > 90) {
      suggestions.push({
        type: 'info',
        category: 'timeline',
        priority: 'medium',
        message: 'Timeline seems long',
        suggestion: 'Long timelines may reduce competitiveness unless well-justified.'
      });
    }
  }
  
  // Cover letter analysis
  if (cover_letter) {
    const wordCount = cover_letter.split(' ').length;
    if (wordCount < 50) {
      suggestions.push({
        type: 'tip',
        category: 'content',
        priority: 'high',
        message: 'Cover letter is very brief',
        suggestion: 'Aim for 150-300 words. Add details about your approach and experience.'
      });
    } else if (wordCount > 500) {
      suggestions.push({
        type: 'tip',
        category: 'content',
        priority: 'low',
        message: 'Cover letter is quite long',
        suggestion: 'Consider being more concise. Focus on key qualifications.'
      });
    }
    
    // Check for key elements
    if (!cover_letter.toLowerCase().includes('experience') && !cover_letter.toLowerCase().includes('worked')) {
      suggestions.push({
        type: 'tip',
        category: 'content',
        priority: 'medium',
        message: 'Missing experience details',
        suggestion: 'Mention specific relevant experience or projects you\'ve completed.'
      });
    }
  }
  
  return suggestions;
}

function calculateOverallScore(bidData, projectData, suggestions) {
  let score = 100;
  
  // Deduct points for critical issues
  const criticalCount = suggestions.filter(s => s.priority === 'high').length;
  const mediumCount = suggestions.filter(s => s.priority === 'medium').length;
  
  score -= (criticalCount * 15);
  score -= (mediumCount * 8);
  
  return Math.max(score, 0);
}

export default RealTimeBidOptimizer;
